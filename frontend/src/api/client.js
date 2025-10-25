// Vite exposes env vars only when prefixed with VITE_
function resolveApiBase() {
    const envBase = import.meta.env?.VITE_API_BASE;
    const base = envBase || (typeof window !== "undefined" ? window.location.origin : "");
    return (base || "").replace(/\/$/, "");
}

const API_BASE = resolveApiBase();

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


