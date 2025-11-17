import os
import requests
from flask import Flask, request, jsonify
from threading import Thread
from uuid import uuid4

app = Flask(__name__)

OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
BASE_URL = "https://openrouter.ai/api/v1"

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_KEY}",
    "Content-Type": "application/json"
}

# In-memory storage for demo (replace with DB or persistent storage for production)
results = {}

# ---------------------------
# IMAGE GENERATION (TTI)
# ---------------------------
def generate_image_task(prompt, task_id):
    try:
        payload = {
            "model": "flux-schnell",
            "input": prompt,
            "size": "1024x1024"
        }
        res = requests.post(f"{BASE_URL}/images", json=payload, headers=HEADERS)
        data = res.json()
        image_url = data.get("data", [{}])[0].get("url", "")
        results[task_id] = {"status": "done", "image": image_url}
    except Exception as e:
        results[task_id] = {"status": "error", "error": str(e)}

@app.route("/api/generate-image", methods=["POST"])
def generate_image():
    data = request.json
    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    task_id = str(uuid4())
    results[task_id] = {"status": "processing"}
    Thread(target=generate_image_task, args=(prompt, task_id)).start()

    return jsonify({"task_id": task_id, "status": "processing"}), 202

@app.route("/api/image-result/<task_id>", methods=["GET"])
def get_image_result(task_id):
    if task_id not in results:
        return jsonify({"error": "Invalid task ID"}), 404
    return jsonify(results[task_id])

# ---------------------------
# TTS – AI Voice Text to Speech
# ---------------------------
VOICE_MODELS = {
    "male_1": "en-US-JasonNeural",
    "male_2": "en-US-GuyNeural",
    "female_1": "en-US-JennyNeural",
    "female_2": "en-US-AriaNeural",
    "deep_male": "en-US-ChristopherNeural",
    "soft_female": "en-US-AshleyNeural"
}

def tts_task(text, voice, task_id):
    try:
        payload = {
            "model": "gpt-4o-mini-tts",
            "input": text,
            "voice": voice,
            "format": "mp3"
        }
        res = requests.post(f"{BASE_URL}/audio/speech", json=payload, headers=HEADERS)
        data = res.json()
        audio_url = data.get("url", "")
        results[task_id] = {"status": "done", "audio": audio_url}
    except Exception as e:
        results[task_id] = {"status": "error", "error": str(e)}

@app.route("/api/tts", methods=["POST"])
def tts():
    data = request.json
    text = data.get("text")
    voice_key = data.get("voice", "female_1")
    voice = VOICE_MODELS.get(voice_key, "en-US-JennyNeural")

    if not text:
        return jsonify({"error": "Text is required"}), 400

    task_id = str(uuid4())
    results[task_id] = {"status": "processing"}
    Thread(target=tts_task, args=(text, voice, task_id)).start()

    return jsonify({"task_id": task_id, "status": "processing"}), 202

@app.route("/api/tts-result/<task_id>", methods=["GET"])
def get_tts_result(task_id):
    if task_id not in results:
        return jsonify({"error": "Invalid task ID"}), 404
    return jsonify(results[task_id])

# ---------------------------
# HEALTH CHECK
# ---------------------------
@app.route("/", methods=["GET"])
def home():
    return "ForgeAIHub Async Backend Running!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
