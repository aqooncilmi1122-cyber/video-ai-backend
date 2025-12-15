import express from "express";
import Replicate from "replicate";

const app = express();
app.use(express.json());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    const output = await replicate.run(
      "luma/ray",
      {
        input: {
          prompt,
          aspect_ratio: "16:9"
        }
      }
    );

    res.json({ video: output });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "API running ✅" });
});

app.listen(10000, () => {
  console.log("Server running on port 10000");
});
