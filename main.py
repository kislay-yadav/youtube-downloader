from flask import Flask, render_template, request, send_file
import yt_dlp
import os
import uuid

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/download', methods=['POST'])
def download():
    url = request.form['url']
    fmt = request.form['format']
    filename = f"{uuid.uuid4()}.%(ext)s"
    
    ydl_opts = {
        'format': 'bestaudio/best' if fmt == 'audio' else 'best',
        'outtmpl': filename,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
        }] if fmt == 'audio' else []
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    # Find real downloaded filename
    real_file = None
    for f in os.listdir():
        if f.startswith(filename.split('%')[0]):
            real_file = f
            break

    return send_file(real_file, as_attachment=True)

# ✅ Fix for Render deployment
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

