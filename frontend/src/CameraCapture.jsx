import React, { useRef, useEffect, useState } from "react";

export default function CameraCapture({ onCapture }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [streaming, setStreaming] = useState(false);

    useEffect(() => {
        async function start() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setStreaming(true);
            } catch (err) {
                console.error("Failed to access camera", err);
                alert("Failed to access camera: " + err.message);
            }
        }
        start();
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach((t) => t.stop());
            }
        };
    }, []);

    function capture() {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (blob && onCapture) onCapture(blob);
        }, "image/jpeg", 0.95);
    }

    return (
        <div className="camera">
            <video ref={videoRef} className="video" playsInline muted />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <div className="controls">
                <button onClick={capture} disabled={!streaming}>
                    Capture & Search
                </button>
            </div>
        </div>
    );
}
