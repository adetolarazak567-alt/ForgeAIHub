import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

if(!HF_TOKEN) {
  console.warn("HUGGINGFACE_TOKEN is not set in environment variables!");
}

// ------------------- TTI -------------------
app.post("/tti", async (req, res) => {
  try {
    const { prompt, style, size } = req.body;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if(!response.ok) return res.status(500).json({ error: "Image generation failed" });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- CHAT -------------------
app.post("/chat", async (req, res) => {
  try {
    const { text } = req.body;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/google/gemma-2-2b-it",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    const data = await response.json();
    const reply = data?.generated_text || data?.[0]?.generated_text || "No response generated.";
    res.json({ reply });

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- PING -------------------
app.get("/ping", (req,res) => res.send("pong"));

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});