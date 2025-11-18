from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import io
import os
import openai

app = Flask(__name__)
CORS(app)

# Read key from environment variable
OPENAI_KEY = os.getenv("OPENAI_KEY")
if not OPENAI_KEY:
    raise ValueError("Set environment variable OPENAI_KEY")

openai.api_key = OPENAI_KEY

# ------------- TTS -------------
@app.route("/tts", methods=["POST"])
def tts():
    data = request.json
    text = data.get("text")
    if not text:
        return jsonify({"error": "No text provided"}), 400

    audio = openai.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice="alloy",
        input=text
    )

    return send_file(
        io.BytesIO(audio.audio_data),
        mimetype="audio/mpeg",
        as_attachment=False,
        download_name="audio.mp3"
    )

# ------------- IMAGE -------------
@app.route("/image", methods=["POST"])
def image():
    data = request.json
    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    img = openai.images.generate(
        model="gpt-image-1",
        prompt=prompt,
        size="512x512"
    )
    url = img.data[0].url
    return jsonify({"url": url})

# ------------- LOGO -------------
@app.route("/logo", methods=["POST"])
def logo():
    data = request.json
    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    img = openai.images.generate(
        model="gpt-image-1",
        prompt=prompt + " logo, vector style",
        size="512x512"
    )
    url = img.data[0].url
    return jsonify({"url": url})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
