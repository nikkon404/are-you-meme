import React, { useRef, useEffect, useState } from "react";

export default function CameraCapture({ onCapture }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [streaming, setStreaming] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [errorMessage, setErrorMessage] = useState(null);
    const [facingMode, setFacingMode] = useState("user"); // 'user' | 'environment'
    const fileInputRef = useRef(null);
    const [mirrored, setMirrored] = useState(true);
    const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

    function isLocalhost() {
        if (typeof window === "undefined") return false;
        return /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
    }

    function isSecure() {
        if (typeof window === "undefined") return true;
        return window.isSecureContext || isLocalhost();
    }

    function getUserMedia(constraints) {
        const mediaDevices = navigator && navigator.mediaDevices;
        if (mediaDevices && typeof mediaDevices.getUserMedia === "function") {
            return mediaDevices.getUserMedia(constraints);
        }
        const legacy =
            (navigator && (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia)) ||
            null;
        if (legacy) {
            return new Promise((resolve, reject) => legacy.call(navigator, constraints, resolve, reject));
        }
        return Promise.reject(new Error("Camera API not available on this browser"));
    }

    useEffect(() => {
        async function start() {
            try {
                if (!isSecure()) {
                    setErrorMessage(
                        "Camera access requires a secure context. Use HTTPS or run on localhost."
                    );
                    return;
                }
                // stop previous stream if any
                if (videoRef.current && videoRef.current.srcObject) {
                    const prevTracks = videoRef.current.srcObject.getTracks();
                    prevTracks.forEach((t) => t.stop());
                }
                const constraints = { video: { facingMode } };
                const stream = await getUserMedia(constraints);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute("playsinline", "true");
                    await videoRef.current.play();
                    setStreaming(true);
                }
            } catch (err) {
                console.error("Failed to access camera", err);
                setErrorMessage("Failed to access camera: " + (err && err.message ? err.message : String(err)));
            }
        }
        start();
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach((t) => t.stop());
            }
        };
    }, [facingMode]);

    // Default mirror when using front camera; unmirror for back camera
    useEffect(() => {
        setMirrored(facingMode === "user");
    }, [facingMode]);

    function doCapture() {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (!blob) return;
            if (blob.size > MAX_UPLOAD_BYTES) {
                setErrorMessage("File too large. Max 5 MB.");
                return;
            }
            if (onCapture) onCapture(blob);
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

    function flipCamera() {
        setFacingMode((m) => (m === "user" ? "environment" : "user"));
    }

    function openGalleryPicker() {
        if (fileInputRef.current) fileInputRef.current.click();
    }

    function onFilePicked(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (file.size > MAX_UPLOAD_BYTES) {
            setErrorMessage("File too large. Max 5 MB.");
            e.target.value = "";
            return;
        }
        // Call onCapture with the picked image file (blob)
        if (onCapture) onCapture(file);
        // reset input value so the same file can be picked again
        e.target.value = "";
    }

    return (
        <div className="camera">
            <div className="camera-stage">
                <video
                    ref={videoRef}
                    className="video"
                    playsInline
                    muted
                    style={{ transform: mirrored ? "scaleX(-1)" : "none", transformOrigin: "center" }}
                />
                {/* Flip camera overlay button */}
                <button
                    type="button"
                    aria-label="Flip camera"
                    onClick={flipCamera}
                    disabled={!streaming || countdown > 0}
                    style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 40,
                        height: 40,
                        borderRadius: 9999,
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0,0,0,0.45)",
                        color: "#fff",
                        cursor: "pointer",
                        backdropFilter: "blur(2px)",
                    }}
                >
                    {/* flip icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 7h10a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                        <path d="M17 17H7a4 4 0 01-4-4v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                        <path d="M9 5l-2 2 2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15 15l2 2-2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                {/* Mirror toggle overlay button */}
                <button
                    type="button"
                    aria-label="Mirror preview"
                    onClick={() => setMirrored((m) => !m)}
                    style={{
                        position: "absolute",
                        bottom: 10,
                        left: 10,
                        width: 40,
                        height: 40,
                        borderRadius: 9999,
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0,0,0,0.45)",
                        color: "#fff",
                        cursor: "pointer",
                        backdropFilter: "blur(2px)",
                    }}
                >
                    {/* mirror icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4v16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                        <path d="M11 6H6a3 3 0 00-3 3v6a3 3 0 003 3h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                        <path d="M13 6h5a3 3 0 013 3v6a3 3 0 01-3 3h-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                </button>
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
                <button className="btn" onClick={openGalleryPicker} style={{ marginLeft: 8 }}>
                    Choose from Gallery
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={onFilePicked}
                />
            </div>
            {errorMessage && (
                <div className="camera-error" role="alert" style={{ marginTop: 12, color: "#b00020" }}>
                    {errorMessage}
                </div>
            )}
        </div>
    );
}

// re-export removed; this file now contains the full component implementation
