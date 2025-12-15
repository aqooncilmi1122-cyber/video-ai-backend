import express from "express";
import cors from "cors";
import Replicate from "replicate";

const app = express();
const PORT = process.env.PORT || 10000;

// ===== Middlewares =====
app.use(cors());
app.use(express.json());

// ===== Replicate client =====
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// ===== Health check =====
app.get("/", (req, res) => {
  res.json({ status: "API is running ✅" });
});

// ===== Generate video route =====
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Missing prompt",
      });
    }

    // ✅ VIDEO MODEL (IMPORTANT)
    const output = await replicate.run(
      "luma/reframe-video",
      {
        input: {
          prompt: prompt,
        },
      }
    );

    const videoUrl =
      output?.video || (Array.isArray(output) ? output[0] : null);

    if (!videoUrl) {
      return res.status(500).json({
        success: false,
        message: "Video URL not returned from Replicate",
        rawOutput: output,
      });
    }

    return res.json({
      success: true,
      videoUrl: videoUrl,
    });

  } catch (error) {
    console.error("Replicate error:", error);
    return res.status(500).json({
      success: false,
      message: "Video generation failed",
      details: error.message,
    });
  }
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
