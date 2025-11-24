// server.mjs
import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 10000;

// ---- Environment variables ----
const VIDEO_API_KEY = process.env.VIDEO_API_KEY;   // من Render
const VIDEO_API_URL = process.env.VIDEO_API_URL;   // من Render
const VIDEO_MODEL   = process.env.VIDEO_MODEL;     // من Render

if (!VIDEO_API_KEY || !VIDEO_API_URL || !VIDEO_MODEL) {
  console.warn("⚠️ Missing VIDEO_API_KEY or VIDEO_API_URL or VIDEO_MODEL in env vars");
}

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Video AI backend is running ✅" });
});

// --------- MAIN ROUTE: Generate video ----------
app.post("/api/generate", async (req, res) => {
  try {
    const { script, duration, aspectRatio, style } = req.body;

    if (!script) {
      return res.status(400).json({ success: false, message: "Missing script text" });
    }

    if (!VIDEO_API_KEY || !VIDEO_API_URL || !VIDEO_MODEL) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error: VIDEO_API_* env vars not set",
      });
    }

    // ✅ هنا نبني الطلب إلى Runway API
    // ⚠️ Endpoint و body يجب أن يطابقا الدوكيمونت الرسمية:
    // https://docs.dev.runwayml.com  (شاهد نموذج Text → Video)
    const runwayPayload = {
      // هذه مفاتيح عامة – عدّلها إذا كان الـ docs يستخدم أسماء أخرى
      prompt: script,
      model: VIDEO_MODEL,     // مثلاً: "gen-2" أو "gen-3-alpha"
      // duration, aspectRatio, style حسب ما يسمح به Runway
      duration,
      aspect_ratio: aspectRatio,
      style,
    };

    const runwayRes = await axios.post(VIDEO_API_URL, runwayPayload, {
      headers: {
        Authorization: `Bearer ${VIDEO_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 600000, // 10 minutes
    });

    const data = runwayRes.data;

    // نحاول استنتاج رابط الفيديو من الاستجابة
    let videoUrl =
      data.video_url ||
      data.url ||
      (Array.isArray(data.results) && data.results[0]?.url) ||
      (Array.isArray(data.assets) && data.assets[0]?.url) ||
      null;

    if (!videoUrl) {
      // إذا لم نعرف أين الرابط نرجّع الـ raw كاملة لكي نراها في الـ console في الواجهة
      return res.json({
        success: true,
        videoUrl: null,
        raw: data,
        message:
          "API response received but video URL not found. Check 'raw' field on frontend console.",
      });
    }

    return res.json({
      success: true,
      videoUrl,
      raw: data,
    });
  } catch (err) {
    console.error("❌ Error from Runway API:");
    console.error(err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message: "Runway API error",
      details: err.response?.data || err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
