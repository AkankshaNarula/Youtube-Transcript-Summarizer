from flask import Flask, jsonify, request
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
from transformers import pipeline
from googletrans import Translator, LANGUAGES

app = Flask(__name__)
CORS(app)
translator = Translator()
summarizer = pipeline('summarization', model="facebook/bart-large-cnn")

@app.route('/translate', methods=['POST'])
def translate():
    data = request.json
    text = data.get('text')
    target_language = data.get('targetLanguage')

    if not text or not target_language:
        return jsonify({"error": "Text and target language are required"}), 400

    # Define supported languages
    language_map = {
        'hi': 'Hindi',
        'en': 'English',
        'fr': 'French',
        'es': 'Spanish',
        'braille': 'Braille'
    }

    if target_language not in language_map:
        return jsonify({"error": f"Language '{target_language}' is not supported"}), 400

    # Special handling for Braille
    if target_language == 'braille':
        return jsonify({
            "translatedText": "Braille translation not implemented. Please use a Braille-specific converter."
        }), 200

    try:
        # Perform translation for supported languages
        translated = translator.translate(text, dest=target_language).text
        return jsonify({"translatedText": translated}), 200
    except Exception as e:
        return jsonify({"error": f"Translation error: {str(e)}"}), 500

@app.route("/summary", methods=["POST"])
def summary_api():
    data = request.get_json()
    url = data.get("url")

    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        # Extract video ID from the URL
        video_id = url.split('=')[-1]
        transcript = get_transcript(video_id)
        summary = get_summary(transcript)
        return jsonify({'summary': summary}), 200
    except Exception as e:
        return jsonify({'error': f"Summarization error: {str(e)}"}), 500

def get_transcript(video_id):
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        # Combine the transcript into a single string
        transcript = ' '.join([d['text'] for d in transcript_list])
        return transcript
    except Exception as e:
        raise ValueError(f"Error fetching transcript: {str(e)}")

def get_summary(transcript):
    summary = ''
    try:
        # Summarize in chunks of 1000 characters
        for i in range(0, len(transcript), 1000):
            chunk = transcript[i:i+1000]
            summary_text = summarizer(chunk, max_length=150, min_length=50, do_sample=False)[0]['summary_text']
            summary += summary_text + ' '
        return summary.strip()
    except Exception as e:
        raise ValueError(f"Error during summarization: {str(e)}")

if __name__ == '__main__':
    app.run(debug=True, port=5002)
