import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

if (!HF_TOKEN) {
  console.log("❌ HUGGINGFACE_TOKEN NOT FOUND");
}

// ---------------------------
// CHAT ENDPOINT
// ---------------------------
app.post("/chat", async (req, res) => {
  try {
    const userMsg = req.body.message || "";

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill",
      { inputs: userMsg },
      {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
      }
    );

    res.json({ response: response.data[0].generated_text });
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).json({ error: "Chat generation failed" });
  }
});

// ---------------------------
// TEXT → SPEECH ENDPOINT
// ---------------------------
app.get("/text-to-speech", async (req, res) => {
  try {
    const text = req.query.text || "Hello";

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/fastspeech2-en-ljspeech",
      text,
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    res.setHeader("Content-Type", "audio/wav");
    res.send(response.data);
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).json({ error: "TTS generation failed" });
  }
});

// ---------------------------
// SERVER START
// ---------------------------
app.listen(3000, () => console.log("Backend running on port 3000"));