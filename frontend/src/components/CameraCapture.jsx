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
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    setStreaming(true);
                }
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
        let seconds = 1; // user preference (was 3 originally)
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
                        <div className="countdown-text">Hold still</div>
                    </div>
                )}
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <div className="controls">
                <button className="btn btn-primary" onClick={startCountdownAndCapture} disabled={!streaming || countdown > 0}>
                    <span className="btn-icon" aria-hidden>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 3l1.5 2h3L15 3h3a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h3z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                    </span>
                    {countdown > 0 ? `Capturing in ${countdown}...` : "Capture & Search"}
                </button>
            </div>
        </div>
    );
}

// re-export removed; this file now contains the full component implementation
