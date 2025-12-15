// =======================
// Imports
// =======================
import express from "express";
import cors from "cors";
import Replicate from "replicate";

// =======================
// App
// =======================
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// =======================
// Replicate Client
// =======================
if (!process.env.REPLICATE_API_TOKEN) {
  console.error("❌ REPLICATE_API_TOKEN is missing");
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// =======================
// Health check
// =======================
app.get("/", (req, res) => {
  res.json({ status: "API running ✅" });
});

// =======================
// Text → Video
// =======================
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    const output = await replicate.run(
      "stability-ai/stable-video-diffusion",
      {
        input: {
          prompt,
        },
      }
    );

    res.json({
      success: true,
      output,
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =======================
// Start server
// =======================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
