import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// للتأكد أن السيرفر يشتغل
app.get("/", (req, res) => {
  res.send("✅ Video AI backend is running");
});

// API الأساسية التي سيستدعيها تطبيقك
app.post("/api/generate-video", (req, res) => {
  const { script, language, length_seconds, voice } = req.body || {};

  console.log("📩 New request:", { script, language, length_seconds, voice });

  if (!script) {
    return res.status(400).json({ error: "script is required" });
  }

  // فيديو حقيقي تجريبي – لاحقًا نستبدله بفيديو AI
  const demoVideoUrl = "https://www.w3schools.com/html/mov_bbb.mp4";

  res.json({
    videoUrl: demoVideoUrl,
    info: {
      language,
      length_seconds,
      voice: !!voice
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Video AI backend running on port " + PORT);
});
