from flask import Flask, render_template, request, redirect, url_for, send_file, Markup
import pandas as pd
from PIL import Image
import io
import re
import json

app = Flask(__name__)

data = pd.read_parquet('data.parquet')
data['vote'] = 0

def preprocess_text(ip, op):
    text = f'Input:\n{ip}\n\nOutput:\n{op}'.replace('\n', '<br>')
    def replace_ground(match):
        coords = json.loads(f'[{match.group(1)}]')
        content = match.group(2)
        return f'<span class="interactive-text" onmouseover="showBoundingBox({coords[0]}, {coords[1]}, {coords[2]}, {coords[3]})" onmouseout="hideBoundingBox()">{content}💬</span>'
    text = re.sub(r'<ground \[([0-9, ]+)\]>(.*?)</ground>', replace_ground, text)
    return text

data['text'] = data.apply(lambda row: preprocess_text(row['input'], row['output']), axis=1)

def save_votes(index, vote):
    with open('votes.log', 'a') as file:
        file.write(f'{index},{vote}\n')

@app.route('/')
@app.route('/<int:index>')
def index(index=0):
    if index < 0:
        index = 0
    elif index >= len(data):
        index = len(data) - 1
    item = data.iloc[index]
    item.text = item.text.replace('\n', '<br>')
    print(item.text)
    return render_template('index.html', item=item, index=index, processed_text=Markup(item.text))

@app.route('/vote', methods=['POST'])
def vote():
    index = int(request.form.get('index'))
    vote_value = request.form.get('vote')
    vote = 1 if vote_value == '👍' else -1
    data.at[index, 'vote'] = vote
    save_votes(index, vote_value)
    index += 1
    if index >= len(data):
        index = 0
    return redirect(url_for('index', index=index))

@app.route('/image/<int:index>')
def image(index):
    item = data.iloc[index]
    image_data = io.BytesIO(item.image)
    img = Image.open(image_data)
    img_io = io.BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True)
