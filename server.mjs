import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Video AI backend is running" });
});

// Text → Video (Runway API)
app.post("/api/generate", async (req, res) => {
  try {
    const { script, duration, style } = req.body || {};

    if (!script || script.trim().length === 0) {
      return res.status(400).json({ error: 'Missing "script" in request body' });
    }

    const apiKey = process.env.VIDEO_API_KEY;
    const apiUrl =
      process.env.VIDEO_API_URL || "https://api.runwayml.com/v1/generate";
    const model = process.env.VIDEO_MODEL || "gen-2";

    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Server misconfigured: VIDEO_API_KEY is missing" });
    }

    const parts = [script];
    if (style) parts.push(`Style: ${style}`);
    if (duration) parts.push(`Duration: about ${duration} seconds`);
    const prompt = parts.join(" | ");

    const runwayResponse = await axios.post(
      apiUrl,
      {
        prompt,
        model,
        resolution: "720p",
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 180000,
      }
    );

    const data = runwayResponse.data;

    const videoUrl =
      data.video_url ||
      data.videoUrl ||
      (data.output && data.output[0] && data.output[0].url) ||
      (data.result && data.result[0] && data.result[0].url);

    if (!videoUrl) {
      console.error("Runway response without video URL:", data);
      return res
        .status(500)
        .json({ error: "No video URL returned from Runway API" });
    }

    return res.json({ videoUrl });
  } catch (err) {
    console.error(
      "Error calling Runway API:",
      err.response?.data || err.message
    );

    const statusCode = err.response?.status || 500;
    return res.status(statusCode).json({
      error: "Failed to generate video",
      details: err.response?.data || err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Video AI backend listening on port ${PORT}`);
});
