import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Redis from "ioredis";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------------- Redis (اختياري لكن مفعّل) ----------------
const redisUrl = process.env.REDIS_URL;
let redis = null;

if (redisUrl) {
  redis = new Redis(redisUrl);
  redis.on("error", (err) => {
    console.error("Redis error:", err.message);
  });
  console.log("Trying to connect to Redis:", redisUrl);
} else {
  console.log("No REDIS_URL provided. Running WITHOUT Redis.");
}

async function safeSetRedis(key, value) {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", 3600);
  } catch (e) {
    console.error("safeSetRedis error:", e.message);
  }
}

async function safeGetRedis(key) {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("safeGetRedis error:", e.message);
    return null;
  }
}

// ---------- دالة توليد فيديو حقيقي عبر API خارجية ----------
async function generateRealVideo(prompt, duration, ratio, style) {
  const apiUrl = process.env.VIDEO_API_URL;   // رابط خدمة الفيديو
  const apiKey = process.env.VIDEO_API_KEY;   // API Key من مزود الخدمة

  if (!apiUrl || !apiKey) {
    throw new Error("VIDEO_API_URL or VIDEO_API_KEY is missing");
  }

  // 👇 عدّل الـ body حسب متطلبات الخدمة التي ستستخدمها
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      prompt,                 // السكريبت/الوصف
      duration,               // المدة (ثواني أو دقائق)
      aspect_ratio: ratio,    // 16:9 أو 9:16 ...
      style                   // نمط الفيديو: cinematic, anime...
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Video API error:", response.status, text);
    throw new Error("Video API request failed");
  }

  const data = await response.json();

  // 👇 غيّر اسم الحقل حسب الـ API (مثلاً data.result.url أو data.video.url ...)
  const videoUrl = data.video_url;

  if (!videoUrl) {
    throw new Error("video_url not found in API response");
  }

  return videoUrl;
}

// --------------- Health check ---------------
app.get("/", (req, res) => {
  res.send("AI Video Backend is running ✅");
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    redis: !!redis
  });
});

// --------------- API إنشاء الفيديو ---------------
app.post("/api/generate-video", async (req, res) => {
  const { prompt, duration, ratio, style } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const jobId = "job_" + Date.now();

  await safeSetRedis(jobId, {
    prompt,
    status: "processing"
  });

  try {
    const videoUrl = await generateRealVideo(
      prompt,
      duration || 120,    // عدد الثواني (مثلاً 120 = دقيقتين)
      ratio || "16:9",
      style || "cinematic"
    );

    await safeSetRedis(jobId, {
      prompt,
      status: "done",
      videoUrl
    });

    res.json({ jobId, videoUrl });
  } catch (err) {
    console.error("generate-video error:", err.message);
    res.status(500).json({
      error: "Failed to generate video",
      details: err.message
    });
  }
});

// --------------- API حالة الطلب ---------------
app.get("/api/status/:id", async (req, res) => {
  const data = await safeGetRedis(req.params.id);
  if (!data) return res.json({ error: "Job not found or no Redis" });
  res.json(data);
});

// --------------- تشغيل السيرفر ---------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend running on port", PORT));
