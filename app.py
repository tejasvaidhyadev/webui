from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_story', methods=['POST'])
def generate_story():
    api_key = 'AIzaSyDORYHYuu-A9cvP6HWe5IHkU0MmItgYWUQ'  # Replace with your actual Google Cloud API key
    api_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + api_key
    try:
        request_data = request.json
        response = requests.post(api_url, json=request_data)
        response_data = response.json()
        return jsonify(response_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
