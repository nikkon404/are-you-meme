import React from "react";
import CameraCapture from "../CameraCapture";

export default function CaptureScreen({ onCapture, loading }) {
    return (
        <div className="app-shell">
            <div className="card">
                <h1 className="title">📸 Capture Your Image</h1>
                <p className="subtitle">Position your camera and click capture to find matching memes.</p>
                <CameraCapture onCapture={onCapture} />
                {loading && (
                    <div className="loading-overlay">
                        <div className="spinner" />
                        <p>Analyzing your image and searching for matches...</p>
                    </div>
                )}
            </div>
        </div>
    );
}



