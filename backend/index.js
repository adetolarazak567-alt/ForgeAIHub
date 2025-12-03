import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";
import gTTS from "gtts-js";

const app = express();
app.use(cors());
app.use(express.json());

// Use your Hugging Face token stored in environment variable
const HF_TOKEN = process.env.HF_TOKEN;

// -------------------- TEXT → IMAGE --------------------
app.post("/tti", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await fetch(
      "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: "Image generation failed" });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- CHAT --------------------
app.post("/chat", async (req, res) => {
  try {
    const { text } = req.body;
    const response = await fetch(
      "https://api-inference.huggingface.co/models/google/gemma-2-2b-it",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: text })
      }
    );

    const data = await response.json();
    const reply = data?.generated_text || data?.[0]?.generated_text || "No response generated.";
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- TTS --------------------
app.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const filename = `tts_${Date.now()}.mp3`;
    const tts = new gTTS(text, "en");

    tts.save(filename, () => {
      res.sendFile(filename, { root: "." }, () => {
        setTimeout(() => {
          try { fs.unlinkSync(filename); } catch(e){}
        }, 1500);
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});