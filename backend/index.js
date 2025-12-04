import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

if (!HF_TOKEN) {
  console.error("❌ Missing HUGGINGFACE_TOKEN");
  process.exit(1);
}

/* ------- HELPERS ------- */
async function hfQuery(model, payload, isBlob = false) {
  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    console.log(await res.text());
    throw new Error("HF API failed");
  }

  return isBlob ? res.arrayBuffer() : res.json();
}

/* ------- TTS ------- */
app.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;

    const audio = await hfQuery(
      "facebook/fastspeech2-en-ljspeech",
      { inputs: text },
      true
    );

    res.setHeader("Content-Type", "audio/wav");
    res.send(Buffer.from(audio));
  } catch (err) {
    res.status(500).send("TTS failed");
  }
});

/* ------- TTI (Image Generation) ------- */
app.post("/tti", async (req, res) => {
  try {
    const { prompt } = req.body;

    const image = await hfQuery(
      "stabilityai/stable-diffusion-2",
      { inputs: prompt },
      true
    );

    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(image));
  } catch (err) {
    res.status(500).send("TTI failed");
  }
});

/* ------- CHAT (Text Generation) ------- */
app.post("/chat", async (req, res) => {
  try {
    const { text } = req.body;

    const out = await hfQuery(
      "mistralai/Mistral-7B-Instruct-v0.3",
      { inputs: text }
    );

    const reply =
      out && out[0] && out[0].generated_text
        ? out[0].generated_text
        : "Couldn't generate a response";

    res.json({ reply });
  } catch (err) {
    res.json({ reply: "Chat failed" });
  }
});

app.listen(3000, () => console.log("Backend running on port 3000"));