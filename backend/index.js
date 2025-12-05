import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

/* ============================================
   WORKING MODELS (STABLE & SUPPORTED BY HF)
   ============================================ */

// CHAT MODEL – works perfectly with text inputs
const CHAT_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

// TTS MODEL – returns audio/wav directly
const TTS_MODEL = "espnet/kan-bayashi_ljspeech_vits";

// TEXT → IMAGE MODEL – works with REST
const TTI_MODEL = "stabilityai/sdxl-turbo";


/* ============================================
   CHAT ENDPOINT
   ============================================ */
app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message || "";

    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${CHAT_MODEL}`,
      { inputs: message },
      { headers: { Authorization: `Bearer ${HF_TOKEN}` } }
    );

    const text = response.data[0]?.generated_text || "No response";

    res.json({ response: text });
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).json({ error: "Chat generation failed" });
  }
});


/* ============================================
   TEXT → SPEECH ENDPOINT
   ============================================ */
app.post("/tts", async (req, res) => {
  try {
    const text = req.body.text || "Hello world";

    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${TTS_MODEL}`,
      { inputs: text },
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


/* ============================================
   TEXT → IMAGE ENDPOINT
   ============================================ */
app.post("/tti", async (req, res) => {
  try {
    const prompt = req.body.prompt || "A beautiful landscape";

    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${TTI_MODEL}`,
      { inputs: prompt },
      {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        responseType: "arraybuffer",
      }
    );

    res.setHeader("Content-Type", "image/png");
    res.send(response.data);
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).json({ error: "Image generation failed" });
  }
});


/* ============================================
   SERVER START
   ============================================ */
app.listen(3000, () =>
  console.log("ForgeAIHub backend is running on port 3000 🚀")
);