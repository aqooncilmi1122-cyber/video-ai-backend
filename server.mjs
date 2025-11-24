import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Redis from "ioredis";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to Redis (Render Key Value)
const redis = new Redis(process.env.REDIS_URL);

// Demo video generator
async function generateVideoDemo() {
  return "https://samplelib.com/lib/preview/mp4/sample-5s.mp4";
}

// Main API
app.post("/api/generate-video", async (req, res) => {
  const { prompt, duration, ratio, style } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const jobId = "job_" + Date.now();

  // Save processing state
  await redis.set(
    jobId,
    JSON.stringify({ prompt, status: "processing" }),
    "EX",
    3600
  );

  // Demo video (works without API)
  const videoUrl = await generateVideoDemo();

  // Save result
  await redis.set(
    jobId,
    JSON.stringify({ prompt, status: "done", videoUrl }),
    "EX",
    3600
  );

  res.json({ jobId, videoUrl });
});

// Status check API
app.get("/api/status/:id", async (req, res) => {
  const data = await redis.get(req.params.id);
  if (!data) return res.json({ error: "Job not found" });
  res.json(JSON.parse(data));
});

// Render port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend running on" , PORT));
