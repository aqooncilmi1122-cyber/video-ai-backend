// ====== Imports ======
import express from "express";
import cors from "cors";
import Replicate from "replicate";

// ====== App setup ======
const app = express();
const PORT = process.env.PORT || 10000;

// ====== Middlewares ======
app.use(cors());
app.use(express.json());

// ====== Replicate Client ======
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// ====== Health check ======
app.get("/", (req, res) => {
  res.json({ status: "✅ API is running" });
});

// ====== TEXT ➜ VIDEO (REAL) ======
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Missing prompt",
      });
    }

    const output = await replicate.run(
      "stability-ai/stable-video-diffusion",
      {
        input: {
          prompt,
          num_frames: 24,
          fps: 8,
        },
      }
    );

    const videoUrl =
      Array.isArray(output) ? output[0] : output?.video;

    if (!videoUrl) {
      return res.status(500).json({
        success: false,
        message: "No video returned",
        raw: output,
      });
    }

    res.json({
      success: true,
      videoUrl,
    });

  } catch (error) {
    console.error("Replicate error:", error);
    res.status(500).json({
      success: false,
      message: "Video generation failed",
      details: error.message,
    });
  }
});

// ====== Start server ======
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
