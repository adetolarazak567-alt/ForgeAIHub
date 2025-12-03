import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";
import gTTS from "gtts.js";

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------
// 🔑 USE HUGGINGFACE TOKEN FROM ENV
// ---------------------------------------
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;
if (!HF_TOKEN) console.warn("HUGGINGFACE_TOKEN is not set!");

// ---------------------------------------
// 🖼 TEXT → IMAGE (Stable Diffusion)
// ---------------------------------------
app.post("/tti", async (req, res) => {
  try {
    const { prompt, style, size } = req.body;
    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

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
      const t = await response.text();
      return res.status(500).json({ error: "Image generation failed: " + t });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------
// 💬 CHATBOT (HuggingFace LLM)
// ---------------------------------------
app.post("/chat", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

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

    if (!response.ok) {
      const t = await response.text();
      return res.status(500).json({ error: "Chat failed: " + t });
    }

    const data = await response.json();
    const reply = data?.generated_text || data?.[0]?.generated_text || "No response generated.";
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------
// 🔊 TEXT → SPEECH (gTTS)
// ---------------------------------------
app.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const filename = `tts_${Date.now()}.mp3`;
    const tts = new gTTS(text, "en");

    tts.save(filename, (err) => {
      if (err) return res.status(500).json({ error: "TTS failed: " + err.message });

      res.sendFile(filename, { root: "." }, () => {
        // Delete after sending
        setTimeout(() => {
          try { fs.unlinkSync(filename); } catch (e) {}
        }, 1500);
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------
// 🚀 HEALTH CHECK
// ---------------------------------------
app.get("/ping", (req, res) => {
  res.json({ status: "ok" });
});

// ---------------------------------------
// 🚀 START SERVER
// ---------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ForgeAIHub backend running on port ${PORT}`));