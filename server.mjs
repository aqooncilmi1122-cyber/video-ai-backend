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

// ====== Health check route ======
app.get("/", (req, res) => {
  res.json({ status: "✅ API is running fine" });
});

// ====== Text-to-Video route ======
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "❌ Missing prompt in request body",
      });
    }

    // === Choose your video model ===
    // يمكنك تجربة أي واحد من التالي:
    // "luma/reframe-video"
    // "stability-ai/stable-video-diffusion"
    const model = "luma/reframe-video";

    // === Run model on Replicate ===
    const output = await replicate.run(model, {
      input: {
        prompt: prompt,
        num_frames: 16, // عدد الإطارات (يمكنك تغييره إلى 24 أو 32)
      },
    });

    // === Extract URL ===
    const videoUrl =
      output?.video ||
      (Array.isArray(output) ? output[0] : null) ||
      null;

    if (!videoUrl) {
      return res.status(500).json({
        success: false,
        message: "⚠️ No video URL returned from Replicate",
        rawOutput: output,
      });
    }

    // === Success response ===
    res.json({
      success: true,
      videoUrl,
    });
  } catch (error) {
    console.error("❌ Replicate error:", error);
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
