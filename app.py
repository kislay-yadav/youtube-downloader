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
            stream = yt.streams.get_highest_resolution()
            file_path = stream.download(output_path=DOWNLOAD_FOLDER)
            return send_file(file_path, as_attachment=True)
        except Exception as e:
            return render_template("index.html", error=str(e))
    return render_template("index.html", error=None)

if __name__ == "__main__":
    app.run(debug=True)
