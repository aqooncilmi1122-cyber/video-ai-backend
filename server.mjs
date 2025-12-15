import express from "express";
import cors from "cors";
import Replicate from "replicate";

const app = express();
app.use(cors());
app.use(express.json());

// Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Generate video route
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
      "lucataco/animate-diff",
      {
        input: {
          prompt,
          num_frames: 16,
        },
      }
    );

    res.json({
      success: true,
      videoUrl: output[0],
    });

  } catch (err) {
    console.error("Replicate error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
