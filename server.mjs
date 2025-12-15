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

app.get("/", (req, res) => {
  res.json({ status: "API is running ✅" });
});

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
      "luma/reframe-video",
      {
        input: {
          prompt: prompt,
        },
      }
    );

    const videoUrl =
      output?.video ||
      (Array.isArray(output) ? output[0] : null);

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
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
