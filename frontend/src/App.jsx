import React, { useState, useEffect } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import CaptureScreen from "./components/CaptureScreen";
import PreviewScreen from "./components/PreviewScreen";

export default function App() {
    const [screen, setScreen] = useState("welcome"); // "welcome" | "capture" | "preview"
    const [fadeIn, setFadeIn] = useState(false);

    const [uploadedUrl, setUploadedUrl] = useState(null);
    const [bestMatchUrl, setBestMatchUrl] = useState(null);
    const [randomMatchUrl, setRandomMatchUrl] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Trigger fade-in effect when screen changes
        setFadeIn(false);
        const timeout = setTimeout(() => setFadeIn(true), 10);
        return () => clearTimeout(timeout);
    }, [screen]);

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

            // Move to preview screen after successful capture and fetch
            setScreen("preview");
        } catch (err) {
            alert("Upload failed: " + err);
        }
        setLoading(false);
    }

    function handleGetStarted() {
        setScreen("capture");
    }

    function handleTryAgain() {
        // Reset state and go back to capture screen
        setUploadedUrl(null);
        setBestMatchUrl(null);
        setRandomMatchUrl(null);
        setResults([]);
        setScreen("capture");
    }

    // Render the appropriate screen based on current state
    return (
        <div className={`app-container${fadeIn ? " fade-in" : ""}`}>
            {screen === "welcome" && (
                <WelcomeScreen onGetStarted={handleGetStarted} />
            )}

            {screen === "capture" && (
                <CaptureScreen onCapture={handleCapture} loading={loading} />
            )}

            {screen === "preview" && (
                <PreviewScreen
                    uploadedUrl={uploadedUrl}
                    bestMatchUrl={bestMatchUrl}
                    randomMatchUrl={randomMatchUrl}
                    results={results}
                    onTryAgain={handleTryAgain}
                />
            )}
        </div>
    );
}
