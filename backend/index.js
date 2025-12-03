
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";
import nodeGtts from "node-gtts";

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------
// 🔑 ADD YOUR HUGGINGFACE TOKEN HERE
// ---------------------------------------
const HF_TOKEN = "YOUR_HUGGINGFACE_ACCESS_TOKEN_HERE";

// ---------------------------------------
// 🖼 TEXT → IMAGE (Stable Diffusion)
// ---------------------------------------
app.post("/tti", async (req, res) => {
  try {
    const { prompt } = req.body;

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

// ---------------------------------------
// 💬 CHATBOT (HuggingFace GPT-like model)
// ---------------------------------------
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
    const reply =
      data?.generated_text ||
      data?.[0]?.generated_text ||
      "No response generated.";

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------
// 🔊 TEXT → SPEECH (Node.js using node-gtts)
// ---------------------------------------
app.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text)
      return res.status(400).json({ error: "No text provided for TTS" });

    const filename = `tts_${Date.now()}.mp3`;
    const tts = nodeGtts("en");

    tts.save(filename, text, (err) => {
      if (err) {
        console.error("TTS error:", err);
        return res.status(500).json({ error: "TTS failed" });
      }

      res.sendFile(filename, { root: "." }, () => {
        // Delete file after sending
        setTimeout(() => {
          try {
            fs.unlinkSync(filename);
          } catch (e) {}
        }, 1500);
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------
// 🚀 START SERVER
// ---------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});