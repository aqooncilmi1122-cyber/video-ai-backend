import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// تأكد أن المفتاح موجود
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ ERROR: Missing OPENAI_API_KEY");
  process.exit(1);
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// نقطة إنشاء الفيديو
app.post("/generate-video", async (req, res) => {
  try {
    const { script, language, length_seconds, voice } = req.body;

    if (!script) {
      return res.status(400).json({ error: "Script text is required" });
    }

    console.log("🎬 Creating video…");

    // إنشاء فيديو حقيقي
    const response = await client.videos.generate({
      model: "gpt-4o-mini-tts",
      prompt: script,
      duration: length_seconds || 10,
      voice: voice ? "alloy" : null,
      aspect_ratio: "16:9",
    });

    if (!response || !response.video_url) {
      return res.status(500).json({ error: "Video generation failed" });
    }

    res.json({
      success: true,
      videoUrl: response.video_url,
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({
      error: err.message || "Server error",
    });
  }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Video backend running on port ${PORT}`);
});
