import React, { useRef, useEffect, useState } from "react";

export default function CameraCapture({ onCapture }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [streaming, setStreaming] = useState(false);
    const [countdown, setCountdown] = useState(0);

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

    function doCapture() {
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

    function startCountdownAndCapture() {
        if (!streaming || countdown > 0) return;
        let seconds = 1;
        setCountdown(seconds);
        const interval = setInterval(() => {
            seconds -= 1;
            setCountdown(seconds);
            if (seconds <= 0) {
                clearInterval(interval);
                setCountdown(0);
                doCapture();
            }
        }, 1000);
    }

    return (
        <div className="camera">
            <div className="camera-stage">
                <video ref={videoRef} className="video" playsInline muted />
                {countdown > 0 && (
                    <div className="countdown-overlay">
                        <div className="countdown-number">{countdown}</div>
                    </div>
                )}
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <div className="controls">
                <button className="btn btn-primary" onClick={startCountdownAndCapture} disabled={!streaming || countdown > 0}>
                    {countdown > 0 ? `Capturing in ${countdown}...` : "Capture & Search"}
                </button>
            </div>
        </div>
    );
}
