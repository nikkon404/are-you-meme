const API_BASE = "http://127.0.0.1:8000";

export async function searchImage(blob, topN = 5) {
    const form = new FormData();
    form.append("file", blob, "capture.jpg");
    const resp = await fetch(`${API_BASE}/search?top_n=${topN}`, {
        method: "POST",
        body: form,
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || "Search failed");
    }
    return resp.json();
}

export async function health() {
    const resp = await fetch(`${API_BASE}/health`);
    return resp.json();
}


