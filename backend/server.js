import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

/* ---------------------------
   FREE TEXT TO SPEECH (TTS)
   Using: espnet/kan-bayashi_ljspeech_vits
---------------------------- */
app.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;

    const r = await fetch(
      "https://api-inference.huggingface.co/models/espnet/kan-bayashi_ljspeech_vits",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: text })
      }
    );

    if (!r.ok) return res.status(500).send("TTS generation failed.");

    const audio = await r.arrayBuffer();
    res.set("Content-Type", "audio/wav");
    res.send(Buffer.from(audio));
  } catch (err) {
    res.status(500).send("TTS error");
  }
});

/* ---------------------------
   FREE TEXT → IMAGE (TTI)
   Using: stabilityai/stable-diffusion-2-1
---------------------------- */
app.post("/tti", async (req, res) => {
  try {
    const { prompt } = req.body;

    const r = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: prompt })
      }
    );

    if (!r.ok) return res.status(500).send("Image generation failed.");

    const img = await r.arrayBuffer();
    res.set("Content-Type", "image/png");
    res.send(Buffer.from(img));
  } catch (err) {
    res.status(500).send("TTI error");
  }
});

/* ---------------------------
   FREE AI CHAT ASSISTANT
   Using: HuggingFace Zephyr-7B
---------------------------- */
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const r = await fetch(
      "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs: message,
          parameters: { max_new_tokens: 150 }
        })
      }
    );

    const j = await r.json();

    if (!j || !j[0] || !j[0].generated_text)
      return res.json({ response: "No response" });

    const reply = j[0].generated_text;
    res.json({ response: reply });
  } catch (err) {
    res.json({ response: "Chat error" });
  }
});

/* ---------------------------
   SERVER START
---------------------------- */
app.get("/", (_, res) => res.send("ForgeAIHub backend running ✔"));
app.listen(3000, () => console.log("Server running on port 3000"));
