import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ---------- TTS (Text → Speech) ---------- */
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;

    const audio = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text
    });

    const buffer = Buffer.from(await audio.arrayBuffer());

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": buffer.length
    });

    res.send(buffer);
  } catch (err) {
    console.log("TTS Error:", err);
    res.status(500).json({ error: "TTS failed" });
  }
});

/* ---------- TTI (Text → Image) ---------- */
app.post("/api/tti", async (req, res) => {
  try {
    const { prompt, size } = req.body;

    const img = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: `${size}x${size}`
    });

    const base64 = img.data[0].b64_json;
    const buffer = Buffer.from(base64, "base64");

    res.set({
      "Content-Type": "image/png",
      "Content-Length": buffer.length
    });

    res.send(buffer);
  } catch (err) {
    console.log("TTI Error:", err);
    res.status(500).json({ error: "Image generation failed" });
  }
});

/* ---------- CHAT ---------- */
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const reply = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are ForgeAIHub assistant." },
        { role: "user", content: message }
      ]
    });

    res.json({ reply: reply.choices[0].message.content });
  } catch (err) {
    console.log("Chat Error:", err);
    res.status(500).json({ reply: "Chat failed" });
  }
});

/* ---------- SERVER ---------- */
app.get("/", (req, res) => {
  res.send("ForgeAIHub backend running.");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Backend live on " + PORT));