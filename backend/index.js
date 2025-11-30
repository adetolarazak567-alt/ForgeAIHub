// backend/index.js
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ====== CONFIG ======
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // for TTS, TTI, Chat
const PORT = process.env.PORT || 3000;

// ====== Ping ======
app.get('/ping', (req,res)=> res.send('pong'));

// ====== TTS ======
app.post('/tts', async (req,res)=>{
    try{
        const { text, voice, speed } = req.body;

        // Example: OpenAI TTS (replace with actual TTS API if needed)
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method:'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type':'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4o-mini-tts",
                voice: voice || 'alloy',
                input: text,
                speed: parseFloat(speed) || 1
            })
        });

        if(!response.ok) return res.status(response.status).send(await response.text());
        const arrayBuffer = await response.arrayBuffer();
        res.setHeader('Content-Type','audio/mpeg');
        res.send(Buffer.from(arrayBuffer));
    }catch(e){
        res.status(500).send(e.message);
    }
});

// ====== TTI ======
app.post('/tti', async (req,res)=>{
    try{
        const { prompt, style, size } = req.body;

        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method:'POST',
            headers:{
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type':'application/json'
            },
            body: JSON.stringify({
                model: "gpt-image-1",
                prompt: prompt,
                size: size+'x'+size
            })
        });

        if(!response.ok) return res.status(response.status).send(await response.text());
        const data = await response.json();
        const imgUrl = data.data[0].url;

        // fetch image and send as blob
        const imgResp = await fetch(imgUrl);
        const buf = await imgResp.arrayBuffer();
        res.setHeader('Content-Type','image/png');
        res.send(Buffer.from(buf));
    }catch(e){
        res.status(500).send(e.message);
    }
});

// ====== Chat ======
app.post('/chat', async (req,res)=>{
    try{
        const { text } = req.body;
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method:'POST',
            headers:{
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type':'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{role:'user', content: text}],
                max_tokens: 300
            })
        });
        if(!response.ok) return res.status(response.status).send(await response.text());
        const j = await response.json();
        const reply = j.choices[0].message.content;
        res.json({ reply });
    }catch(e){
        res.status(500).send(e.message);
    }
});

// ====== Start server ======
app.listen(PORT, ()=> console.log(`Backend running on port ${PORT}`));
