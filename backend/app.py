import base64
import io
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)  # 🔥 FIXES "Failed to fetch" by allowing all origins


# -------------------------------------------
# CONFIG — Set your API keys
# -------------------------------------------
OPENROUTER_KEY = "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"   # <-- replace


# -------------------------------------------
# IMAGE GENERATION
# -------------------------------------------
@app.route("/api/image", methods=["POST"])
def generate_image():
    data = request.json
    prompt = data.get("prompt")
    size = data.get("size", "1024x1024")

    url = "https://openrouter.ai/api/v1/images"

    payload = {
        "prompt": prompt,
        "size": size
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "Content-Type": "application/json"
    }

    r = requests.post(url, json=payload, headers=headers)

    if r.status_code != 200:
        return jsonify({"error": r.text}), 400

    res = r.json()
    
    # Try to extract the image URL or base64
    try:
        img_url = res["data"][0]["url"]
        return jsonify({ "image_url": img_url })
    except:
        b64 = res["data"][0]["b64_json"]
        return jsonify({ "data_uri": f"data:image/png;base64,{b64}" })


# -------------------------------------------
# TEXT TO SPEECH (TTS)
# -------------------------------------------
@app.route("/api/tts", methods=["POST"])
def tts():
    data = request.json
    text = data.get("text", "")
    voice = data.get("voice", "alloy")
    fmt = data.get("format", "mp3")

    url = "https://openrouter.ai/api/v1/audio"

    payload = {
        "input": text,
        "voice": voice,
        "format": fmt
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "Content-Type": "application/json"
    }

    r = requests.post(url, json=payload, headers=headers)

    if r.status_code != 200:
        return jsonify({"error": r.text}), 400

    audio_bytes = base64.b64decode(r.json()["audio"])

    return send_file(
        io.BytesIO(audio_bytes),
        mimetype=f"audio/{fmt}",
        as_attachment=True,
        download_name=f"tts.{fmt}"
    )


# -------------------------------------------
# SPEECH TO TEXT (STT)
# -------------------------------------------
@app.route("/api/stt", methods=["POST"])
def stt():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    url = "https://openrouter.ai/api/v1/audio/transcriptions"

    files = {
        "file": (file.filename, file.stream, file.mimetype)
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}"
    }

    r = requests.post(url, files=files, headers=headers)

    if r.status_code != 200:
        return jsonify({"error": r.text}), 400

    return jsonify(r.json())


@app.route("/", methods=["GET"])
def home():
    return "ForgeAIHub backend is running."


if __name__ == "__main__":
    app.run(hosthostyouenrouter-api-kei-keyyy
