import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import requests
from pydub import AudioSegment
from io import BytesIO

app = Flask(__name__)
CORS(app)

# -----------------------------
# 🔐 Load OpenRouter Key
# -----------------------------
OPENROUTER_KEY = os.getenv("OPENROUTER_KEY") or "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"

# -----------------------------
# 🔥 Base headers for OpenRouter
# -----------------------------
BASE_HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_KEY}",
    "HTTP-Referer": "https://aroearning.netlify.app",
    "X-Title": "ForgeAIHub",
    "Content-Type": "application/json"
}

# -----------------------------
# 1️⃣ IMAGE GENERATION
# -----------------------------
@app.route("/api/image", methods=["POST"])
def generate_image():
    data = request.json
    prompt = data.get("prompt")
    size = data.get("size", "1024x1024")

    payload = {
        "model": "openai/gpt-image-1",
        "prompt": prompt,
        "size": size
    }

    res = requests.post(
        "https://openrouter.ai/api/v1/images",
        headers=BASE_HEADERS,
        json=payload
    )

    return jsonify(res.json())


# -----------------------------
# 2️⃣ TEXT → SPEECH (TTS)
# -----------------------------
@app.route("/api/tts", methods=["POST"])
def tts():
    data = request.json
    text = data.get("text")
    voice = data.get("voice", "alloy_male")
    format_ext = data.get("format", "mp3")

    payload = {
        "model": "openai/gpt-4o-mini-tts",
        "input": text,
        "voice": voice,
        "format": format_ext
    }

    res = requests.post(
        "https://openrouter.ai/api/v1/audio/speech",
        headers=BASE_HEADERS,
        json=payload
    )

    audio_bytes = res.content

    return send_file(
        BytesIO(audio_bytes),
        mimetype=f"audio/{format_ext}",
        as_attachment=True,
        download_name=f"forge_tts.{format_ext}"
    )


# -----------------------------
# 3️⃣ SPEECH → TEXT (STT)
# -----------------------------
@app.route("/api/stt", methods=["POST"])
def stt():
    file = request.files["file"]
    audio_bytes = file.read()

    files = {
        "file": ("audio.wav", audio_bytes, file.content_type)
    }

    res = requests.post(
        "https://openrouter.ai/api/v1/audio/transcriptions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_KEY}",
            "HTTP-Referer": "https://aroearning.netlify.app",
            "X-Title": "ForgeAIHub",
        },
        files=files,
        data={"model": "openai/gpt-4o-mini-transcribe"}
    )

    return jsonify(res.json())


# -----------------------------
# APP ROOT
# -----------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Forge backend running"})


# -----------------------------
# RUN (Local only)
# -----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
