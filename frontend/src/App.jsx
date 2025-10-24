import React, { useState } from "react";
import CameraCapture from "./CameraCapture";

export default function App() {
    const [uploadedUrl, setUploadedUrl] = useState(null);
    const [bestMatchUrl, setBestMatchUrl] = useState(null);
    const [randomMatchUrl, setRandomMatchUrl] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    async function handleCapture(blob) {
        // create local preview URL (frontend keeps the snapshot)
        const localUrl = URL.createObjectURL(blob);
        setUploadedUrl(localUrl);

        // send to backend
        setLoading(true);
        const form = new FormData();
        form.append("file", blob, "capture.jpg");

        try {
            const resp = await fetch("http://127.0.0.1:8000/search?top_n=5", {
                method: "POST",
                body: form,
            });
            if (!resp.ok) {
                const txt = await resp.text();
                alert("Server error: " + txt);
                setLoading(false);
                return;
            }
            const data = await resp.json();
            // uploaded image is kept locally by the frontend; server no longer returns it
            setBestMatchUrl(data.best_match);
            const r = data.all_results || [];
            setResults(r);
            // pick one random match (if available)
            if (r.length > 0) {
                const pick = r[Math.floor(Math.random() * r.length)];
                setRandomMatchUrl(pick.image_url);
            } else {
                setRandomMatchUrl(null);
            }
        } catch (err) {
            alert("Upload failed: " + err);
        }
        setLoading(false);
    }

    return (
        <div className="container">
            <h1>Are You Meme — Camera Search</h1>
            <CameraCapture onCapture={handleCapture} />

            {loading && (
                <div className="loading-overlay">
                    <div className="spinner" />
                    <p>Uploading and searching...</p>
                </div>
            )}

            {uploadedUrl && bestMatchUrl && (
                <div className="comparison-result">
                    <div className="comparison-item">
                        <h3>Your Image</h3>
                        <img src={uploadedUrl} alt="uploaded" className="preview" />
                    </div>
                    <div className="comparison-item">
                        <h3>Best Match</h3>
                        <img src={bestMatchUrl} alt="best match" className="preview" />
                        <p className="match-score">Score: {results[0]?.score.toFixed(4)}</p>
                    </div>
                </div>
            )}

            {randomMatchUrl && (
                <div className="result">
                    <h3>Random Match</h3>
                    <div className="single-match">
                        <div className="match-item single">
                            <img src={randomMatchUrl} alt="random match" className="match-image" />
                        </div>
                        <p className="match-score">(one randomly selected from results)</p>
                    </div>
                </div>
            )}
        </div>
    );
}
