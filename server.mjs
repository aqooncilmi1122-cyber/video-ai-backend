import express from "express";
import cors from "cors";
import Replicate from "replicate";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Health check
app.get("/", (req, res) => {
  res.json({ status: "API running ✅" });
});

// TEXT → IMAGE → VIDEO
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    // 1️⃣ Text → Image
    const image = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: {
          prompt,
          aspect_ratio: "16:9",
        },
      }
    );

    const imageUrl = image[0];

    // 2️⃣ Image → Video
    const video = await replicate.run(
      "stability-ai/stable-video-diffusion",
      {
        input: {
          image: imageUrl,
          motion_bucket_id: 127,
        },
      }
    );

    res.json({
      success: true,
      image: imageUrl,
      video: video[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on ${PORT}`)
);
