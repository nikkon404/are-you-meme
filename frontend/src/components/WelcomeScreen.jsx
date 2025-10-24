import React from "react";

export default function WelcomeScreen({ onGetStarted }) {
    return (
        <div className="app-shell">
            <div className="card hero-card">
                <h1 className="hero-title">🎭 Are You Meme</h1>
                <p className="hero-subtitle">
                    Capture an image and we will find the closest matching memes from our
                    collection. Discover your meme twin in seconds.
                </p>
                <button className="btn btn-primary" onClick={onGetStarted}>
                    Get Started 🚀
                </button>
            </div>
        </div>
    );
}



