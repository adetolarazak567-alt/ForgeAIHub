from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import base64
import io
from openai import OpenAI

app = Flask(__name__)
CORS(app)

# Load API key
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")

client = OpenAI(api_key=OPENROUTER_KEY, base_url="https://openrouter.ai/api/v1")


@app.route("/tts", methods=["POST"])
def tts():
    data = request.json
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    # Generate speech (MP3)
    response = client.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice="alloy",
        input=text
    )

    audio_bytes = response.read()

    return send_file(
        io.BytesIO(audio_bytes),
        mimetype="audio/mpeg",
        as_attachment=False,
        download_name="audio.mp3"
    )


@app.route("/image", methods=["POST"])
def image():
    data = request.json
    prompt = data.get("prompt", "")

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    response = client.images.generate(
        model="flux-pro",
        prompt=prompt,
        size="1024x1024"
    )

    image_base64 = response.data[0].b64_json
    image_bytes = base64.b64decode(image_base64)

    file_path = "generated_image.png"
    with open(file_path, "wb") as f:
        f.write(image_bytes)

    return jsonify({"url": request.host_url + file_path})


@app.route("/logo", methods=["POST"])
def logo():
    data = request.json
    prompt = "Minimal modern logo, " + data.get("prompt", "")

    response = client.images.generate(
        model="flux-pro",
        prompt=prompt,
        size="1024x1024"
    )

    image_base64 = response.data[0].b64_json
    image_bytes = base64.b64decode(image_base64)

    file_path = "logo.png"
    with open(file_path, "wb") as f:
        f.write(image_bytes)

    return jsonify({"url": request.host_url + file_path})


@app.route("/")
def home():
    return "AI Backend Running!"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
