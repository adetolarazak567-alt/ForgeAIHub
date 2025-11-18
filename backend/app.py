from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import io
import os
from gtts import gTTS

app = Flask(__name__)
CORS(app)  # allow cross-origin requests

# Optional environment variable (use if you integrate OpenRouter later)
OPENROUTER_KEY = os.environ.get("OPENROUTER_KEY")

# ---------------- TTS ----------------
@app.route("/tts", methods=["POST"])
def tts():
    data = request.json
    text = data.get("text")
    if not text:
        return jsonify({"error": "Text required"}), 400

    mp3_fp = io.BytesIO()
    tts = gTTS(text)
    tts.write_to_fp(mp3_fp)
    mp3_fp.seek(0)
    return send_file(mp3_fp, mimetype="audio/mpeg", download_name="audio.mp3")

# ---------------- Text → Image ----------------
@app.route("/image", methods=["POST"])
def image():
    data = request.json
    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "Prompt required"}), 400

    # placeholder image (replace with real AI API later)
    url = "https://via.placeholder.com/512.png?text=" + prompt.replace(" ", "+")
    return jsonify({"url": url})

# ---------------- Logo Maker ----------------
@app.route("/logo", methods=["POST"])
def logo():
    data = request.json
    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "Prompt required"}), 400

    # placeholder logo
    url = "https://via.placeholder.com/256.png?text=" + prompt.replace(" ", "+")
    return jsonify({"url": url})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
