import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";
import gTTS from "gtts";

const app = express();
app.use(cors());
app.use(express.json());

// ------------------ Hugging Face Token ------------------
const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) {
  console.warn("Warning: HF_TOKEN not set in environment variables!");
}

// ------------------ TEXT → IMAGE (TTI) ------------------
app.post("/tti", async (req, res) => {
  try {
    const { prompt, style = "photorealistic", size = "512" } = req.body;

    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

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

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: "Image generation failed: " + text });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ CHATBOT ------------------
app.post("/chat", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ TEXT → SPEECH (TTS) ------------------
app.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided for TTS" });

    const filename = `tts_${Date.now()}.mp3`;
    const tts = new gTTS(text, "en");

    tts.save(filename, (err) => {
      if (err) return res.status(500).json({ error: "TTS failed" });

      res.sendFile(filename, { root: "." }, () => {
        // delete temporary file
        setTimeout(() => {
          try { fs.unlinkSync(filename); } catch(e) {}
        }, 1500);
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ SIMPLE PING ------------------
app.get("/ping", (req, res) => {
  res.send("pong");
});

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});