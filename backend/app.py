from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import requests
from io import BytesIO
from pydub import AudioSegment

app = Flask(__name__)
CORS(app)  # allow cross-origin requests

OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY")
BASE_URL = "https://openrouter.ai/api/v1"  # TTS/Image endpoint

if not OPENROUTER_KEY:
    raise Exception("OPENROUTER_API_KEY not set in environment variables")


@app.route("/api/tts", methods=["POST"])
def tts():
    data = request.get_json()
    text = data.get("text")
    voice = data.get("voice", "alloy_male")
    fmt = data.get("format", "mp3")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    # Call OpenRouter TTS endpoint
    headers = {"Authorization": f"Bearer {OPENROUTER_KEY}"}
    payload = {"text": text, "voice": voice, "format": fmt}

    resp = requests.post(f"{BASE_URL}/text-to-speech", json=payload, headers=headers)
    if resp.status_code != 200:
        return jsonify({"error": resp.text}), resp.status_code

    audio_bytes = BytesIO(resp.content)
    return send_file(audio_bytes, mimetype=f"audio/{fmt}", as_attachment=True, download_name=f"tts.{fmt}")


@app.route("/api/image", methods=["POST"])
def image_gen():
    data = request.get_json()
    prompt = data.get("prompt")
    size = data.get("size", "512x512")

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    headers = {"Authorization": f"Bearer {OPENROUTER_KEY}"}
    payload = {"prompt": prompt, "size": size}

    resp = requests.post(f"{BASE_URL}/image-generation", json=payload, headers=headers)
    if resp.status_code != 200:
        return jsonify({"error": resp.text}), resp.status_code

    return jsonify(resp.json())


@app.route("/api/stt", methods=["POST"])
def stt():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    headers = {"Authorization": f"Bearer {OPENROUTER_KEY}"}

    files = {"file": (file.filename, file.stream, file.mimetype)}
    resp = requests.post(f"{BASE_URL}/speech-to-text", files=files, headers=headers)

    if resp.status_code != 200:
        return jsonify({"error": resp.text}), resp.status_code

    return jsonify(resp.json())


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
