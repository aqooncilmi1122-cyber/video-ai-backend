// ===== Replicate client =====
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// ===== Generate video route =====
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: "Missing prompt" });
    }

    const output = await replicate.run(
      "lucataco/animate-diff",
      {
        input: {
          prompt,
          num_frames: 16
        }
      }
    );

    return res.json({
      success: true,
      videoUrl: output[0],
    });

  } catch (err) {
    console.error("Replicate error:", err);
    return res.status(500).json({
      success: false,
      message: "Replicate error",
      details: err.message,
    });
  }
});
