import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------------- Redis (اختياري) ----------------
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

// --------------- دالة فيديو ديمو (مؤقتًا) ---------------
async function generateVideoDemo() {
  // فيديو قصير جاهز للتجربة فقط
  return "https://samplelib.com/lib/preview/mp4/sample-5s.mp4";
}

// --------------- Health check ---------------
app.get("/", (req, res) => {
  res.send("AI Video Backend DEMO is running ✅");
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

  // 🔥 هنا الآن نستخدم فيديو تجريبي فقط
  const videoUrl = await generateVideoDemo();

  await safeSetRedis(jobId, {
    prompt,
    status: "done",
    videoUrl
  });

  res.json({ jobId, videoUrl });
});

// --------------- API حالة الطلب ---------------
app.get("/api/status/:id", async (req, res) => {
  const data = await safeGetRedis(req.params.id);
  if (!data) return res.json({ error: "Job not found or no Redis" });
  res.json(data);
});

// --------------- تشغيل السيرفر ---------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend DEMO running on port", PORT));
