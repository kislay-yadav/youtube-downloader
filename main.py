from flask import Flask, render_template, request, send_file
from pytube import YouTube
import os

app = Flask(__name__)

DOWNLOAD_FOLDER = "downloads"
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        url = request.form["url"]
        try:
            yt = YouTube(url)
            stream = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').desc().first()
            filepath = stream.download(output_path=DOWNLOAD_FOLDER)
            filename = os.path.basename(filepath)
            return send_file(filepath, as_attachment=True)
        except Exception as e:
            return render_template("index.html", error=str(e))
    return render_template("index.html")
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
