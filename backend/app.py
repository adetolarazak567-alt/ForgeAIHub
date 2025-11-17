import os
import requests
from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")

BASE_URL = "https://openrouter.ai/api/v1"

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_KEY}",
    "Content-Type": "application/json"
}

# ---------------------------
# IMAGE GENERATION
# ---------------------------
@app.route("/api/generate-image", methods=["POST"])
def generate_image():
    data = request.json
    prompt = data.get("prompt")

    payload = {
        "model": "deepseek-ai/Flux-Schnell",
        "prompt": prompt,
        "size": "1024x1024"
    }

    try:
        res = requests.post(
            f"{BASE_URL}/images/generations",
            json=payload,
            headers=HEADERS
        )

        out = res.json()

        return jsonify({
            "image": out.get("data", [{}])[0].get("url", None)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------
# TEXT-TO-SPEECH (TTS)
# ---------------------------

# VALID OpenRouter voices:
VOICES = [
    "alloy",
    "verse",
    "amber",
    "aria",
    "luna",
    "nova"
]

@app.route("/api/tts", methods=["POST"])
def tts():
    data = request.json
    text = data.get("text")
    voice = data.get("voice", "alloy")

    if voice not in VOICES:
        voice = "alloy"

    payload = {
        "model": "openai/gpt-4o-mini-tts",
        "input": text,
        "voice": voice,
        "format": "mp3"
    }

    try:
        res = requests.post(
            f"{BASE_URL}/audio/synthesize",
            json=payload,
            headers=HEADERS
        )

        out = res.json()

        return jsonify({
            "audio": out.get("audio", None)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------
# HEALTH CHECK
# ---------------------------
@app.route("/")
def home():
    return "ForgeAIHub Backend Running!"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
