import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { exec } from "child_process"; // for gTTS

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------
// 🔑 ADD YOUR TOKEN HERE
// ---------------------------------------
const HF_TOKEN = "YOUR_HUGGINGFACE_ACCESS_TOKEN_HERE"; // <-- paste your token

// ---------------------------------------
// 🖼 TEXT → IMAGE (Stable Diffusion)
// ---------------------------------------
app.post("/api/tti", async (req, res) => {
try {
const { prompt } = req.body;

const response = await fetch(
"https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
{
method: "POST",
headers: {
"Authorization": Bearer ${HF_TOKEN},
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
// 💬 CHATBOT (HuggingFace LLM)
// ---------------------------------------
app.post("/api/chat", async (req, res) => {
try {
const { message } = req.body;

const response = await fetch(
"https://api-inference.huggingface.co/models/google/gemma-2-2b-it",
{
method: "POST",
headers: {
"Authorization": Bearer ${HF_TOKEN},
"Content-Type": "application/json",
},
body: JSON.stringify({ inputs: message }),
}
);

const data = await response.json();
const reply = data?.generated_text || "I couldn't generate a response.";

res.json({ reply });

} catch (err) {
res.status(500).json({ error: err.message });
}
});

// ---------------------------------------
// 🔊 TEXT → SPEECH (gTTS)
// ---------------------------------------
app.post("/api/tts", async (req, res) => {
try {
const { text } = req.body;

const filename = audio_${Date.now()}.mp3;

exec(gtts-cli "${text}" --output ${filename}, (err) => {
if (err) return res.status(500).json({ error: err.message });

res.sendFile(filename, { root: "." }, () => {
// delete file after sending
exec(rm ${filename});
});
});

} catch (err) {
res.status(500).json({ error: err.message });
}
});

// ---------------------------------------
// 🚀 START SERVER
// ---------------------------------------
app.listen(3000, () => {
console.log("Backend running on http://localhost:3000");
});