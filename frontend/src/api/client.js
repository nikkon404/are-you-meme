// Vite exposes env vars only when prefixed with VITE_
function getApiBaseFromEnv() {
    const envBase = import.meta.env?.VITE_API_BASE;
    if (!envBase) {
        throw new Error("VITE_API_BASE is not set. Create frontend/.env and set VITE_API_BASE.");
    }
    return envBase.replace(/\/$/, "");
}

const API_BASE = getApiBaseFromEnv();
const HF_TOKEN = import.meta.env?.VITE_HF_TOKEN || "";
console.log("API_BASE", API_BASE);

export async function searchImage(blob, topN = 5) {
    const form = new FormData();
    form.append("file", blob, "capture.jpg");

    const headers = {};
    if (HF_TOKEN) {
        headers["Authorization"] = `Bearer ${HF_TOKEN}`;
    }

    const resp = await fetch(`${API_BASE}/search?top_n=${topN}`, {
        method: "POST",
        headers,
        body: form,
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || "Search failed");
    }
    return resp.json();
}

export async function health() {
    const headers = {};
    if (HF_TOKEN) {
        headers["Authorization"] = `Bearer ${HF_TOKEN}`;
    }

    const resp = await fetch(`${API_BASE}/health`, { headers });
    return resp.json();
}


