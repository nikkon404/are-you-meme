import React from "react";

export default function PreviewScreen({ uploadedUrl, bestMatchUrl, randomMatchUrl, results, onTryAgain }) {
    return (
        <div className="app-shell">
            <div className="card">
                <h1 className="title">🎉 Your Meme Match Results</h1>
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
                        <h3>Random Match from Results</h3>
                        <div className="single-match">
                            <div className="match-item single">
                                <img src={randomMatchUrl} alt="random match" className="match-image" />
                            </div>
                            <p className="match-score">(randomly selected from top matches)</p>
                        </div>
                    </div>
                )}

                <button className="btn btn-success" onClick={onTryAgain}>
                    Try Another Image 📷
                </button>
            </div>
        </div>
    );
}



