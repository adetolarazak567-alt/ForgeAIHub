
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(cors());

// ==== FREE TTS (Pico TTS — fast, free, no key) ====
app.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;

    const r = await fetch("https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=" + encodeURIComponent(text));

    if (!r.ok) return res.status(500).send("TTS failed");

    const audio = await r.arrayBuffer();
    res.set("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audio));
  } catch (err) {
    res.status(500).send("Error");
  }
});

// ==== FREE TTI (Stable Diffusion API — NO key needed) ====
app.post("/tti", async (req, res) => {
  try {
    const { prompt } = req.body;

    const r = await fetch("https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt));

    if (!r.ok) return res.status(500).send("TTI failed");

    const img = await r.arrayBuffer();
    res.set("Content-Type", "image/jpeg");
    res.send(Buffer.from(img));
  } catch (err) {
    res.status(500).send("Error generating image");
  }
});

// ==== FREE CHAT (Open-source LLaMA 3 model — free endpoint) ====
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const r = await fetch("https://api.deepinfra.com/v1/openai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages: [{ role: "user", content: message }]
      })
    });

    const j = await r.json();

    res.json({
      response: j.choices?.[0]?.message?.content || "No reply"
    });
  } catch (err) {
    res.json({ response: "Error fetching response" });
  }
});

// ROOT
app.get("/", (req, res) => {
  res.send("ForgeAIHub backend is running.");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Backend running on port " + port));