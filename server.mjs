// ===== Imports =====
import express from "express";
import cors from "cors";
import Replicate from "replicate";

// ===== App =====
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ===== Replicate =====
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// ===== Health =====
app.get("/", (req, res) => {
  res.json({ status: "API running ✅" });
});

// ===== Text → Image → Video =====
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: "Missing prompt" });
    }

    // 1️⃣ Text → Image
    const image = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: { prompt },
      }
    );

    const imageUrl = Array.isArray(image) ? image[0] : image;
    if (!imageUrl) throw new Error("Image generation failed");

    // 2️⃣ Image → Video
    const video = await replicate.run(
      "stability-ai/stable-video-diffusion",
      {
        input: {
          input_image: imageUrl,
          num_frames: 25,
        },
      }
    );

    const videoUrl = Array.isArray(video) ? video[0] : video;

    res.json({
      success: true,
      imageUrl,
      videoUrl,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ===== Start =====
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
