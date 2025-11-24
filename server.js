import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { OpenAI } from "openai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// *************
//  Important: API KEY from Render Environment variable
// *************
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ************* Generate Video Endpoint *************
app.post("/generate-video", async (req, res) => {
  try {
    const { script, language, length_seconds, voice } = req.body;

    if (!script) {
      return res.status(400).json({ error: "Script text is required" });
    }

    console.log("➡️ Request received:", req.body);

    // OpenAI video generation API
    const video = await client.videos.generate({
      model: "gpt-video-1",
      prompt: script,
      aspect_ratio: "16:9",
      duration: length_seconds || 10,
      voice: voice ? { enabled: true } : { enabled: false },
      language: language || "en",
    });

    console.log("🎬 Video created.");

    // استخراج url
    const video_url = video.data[0].url;

    return res.json({ videoUrl: video_url });

  } catch (err) {
    console.error("❌ ERROR:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

// ************* Server Listen *************
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Video AI backend running on port ${PORT}`);
});
