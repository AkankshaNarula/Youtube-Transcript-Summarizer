from flask import Flask, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
from transformers import pipeline

app = Flask(__name__)

# CORS setup: Allow all origins for testing purposes
CORS(app, origins="*")

@app.route("/")
def summary_api():
    try:
        print('Fetching summary...')
        url = 'https://www.youtube.com/watch?v=MS5UjNKw_1M'
        video_id = url.split('=')[1]
        summary = get_summary(get_transcript(video_id))
        return jsonify({'summary': summary}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_transcript(video_id):
    transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
    transcript = ' '.join([d['text'] for d in transcript_list])
    return transcript

def get_summary(transcript):
    summariser = pipeline('summarization')
    summary = ''
    for i in range(0, (len(transcript)//1000)+1):
        summary_text = summariser(transcript[i*1000:(i+1)*1000])[0]['summary_text']
        summary = summary + summary_text + ' '
    return summary

if __name__ == '__main__':
    app.run(debug=True, port=5002)

