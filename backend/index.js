import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;
if (!HF_TOKEN) console.log("❌ Missing HUGGINGFACE_TOKEN");

// ----------------------------
//  CHAT API
// ----------------------------
app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message || "";

    const r = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill",
      { inputs: message },
      {
        headers: { Authorization: `Bearer ${HF_TOKEN}` }
      }
    );

    const reply = r.data[0]?.generated_text || "I could not generate a reply.";
    res.json({ reply });
  } catch (err) {
    console.log("CHAT ERROR:", err.response?.data || err.message);
    res.status(500).json({ reply: "Chat generation failed" });
  }
});

// ----------------------------
//  TEXT → SPEECH (TTS)
// ----------------------------
app.post("/api/tts", async (req, res) => {
  try {
    const text = req.body.text || "Hello";

    const r = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/fastspeech2-en-ljspeech",
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        responseType: "arraybuffer"
      }
    );

    res.setHeader("Content-Type", "audio/wav");
    res.send(r.data);
  } catch (err) {
    console.log("TTS ERROR:", err.response?.data || err.message);
    res.status(500).send("Failed to generate audio");
  }
});

// ----------------------------
//  TEXT → IMAGE (TTI)
// ----------------------------
app.post("/api/tti", async (req, res) => {
  try {
    const { prompt, style, size } = req.body;

    const fullPrompt = `${prompt}. Style: ${style}.`;

    const r = await axios.post(
      "https://api-inference.huggingface.co/models/prompthero/openjourney",
      { inputs: fullPrompt, parameters: { width: size, height: size } },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          Accept: "image/png"
        },
        responseType: "arraybuffer"
      }
    );

    res.setHeader("Content-Type", "image/png");
    res.send(r.data);
  } catch (err) {
    console.log("TTI ERROR:", err.response?.data || err.message);
    res.status(500).send("Image generation failed");
  }
});

// ----------------------------
//  START SERVER
// ----------------------------
app.listen(3000, () => console.log("🚀 Backend running on port 3000"));