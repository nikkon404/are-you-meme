import React, { useMemo, useState } from "react";
import { Container, Stack, Typography, Paper, Grid, Button } from "@mui/material";
import { FileDownload, Replay, CameraAlt, Star, Leaderboard, Speed, Collections } from "@mui/icons-material";
import AppTitle from "../components/AppTitle";
import { motion } from "framer-motion";

export default function PreviewPage({ uploadedUrl, bestMatchUrl, results, onDownload, onRetry }) {
    const allResults = Array.isArray(results) ? results : [];
    const initialIndex = useMemo(() => {
        const idx = allResults.findIndex((r) => r?.image_url === bestMatchUrl);
        return idx >= 0 ? idx : 0;
    }, [allResults, bestMatchUrl]);
    const [mainIndex, setMainIndex] = useState(initialIndex);
    const main = allResults[mainIndex];
    const score = main?.score;
    const TILE = 300; // max tile size
    const THUMB = 68; // fixed thumbnail size

    async function loadImageForCanvas(url) {
        return new Promise(async (resolve, reject) => {
            try {
                let src = url;
                if (typeof url === "string" && !url.startsWith("blob:")) {
                    const resp = await fetch(url, { mode: "cors" });
                    const blob = await resp.blob();
                    src = URL.createObjectURL(blob);
                }
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            } catch (e) {
                reject(e);
            }
        });
    }

    function drawContain(ctx, img, x, y, boxW, boxH) {
        const scale = Math.min(boxW / img.width, boxH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const dx = x + (boxW - drawW) / 2;
        const dy = y + (boxH - drawH) / 2;
        ctx.drawImage(img, dx, dy, drawW, drawH);
    }

    async function handleDownload() {
        const mainUrl = main?.image_url || bestMatchUrl;
        if (!uploadedUrl || !mainUrl) return;
        try {
            const [img1, img2] = await Promise.all([
                loadImageForCanvas(uploadedUrl),
                loadImageForCanvas(mainUrl),
            ]);

            const canvas = document.createElement("canvas");
            canvas.width = TILE * 2;
            canvas.height = TILE;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            drawContain(ctx, img1, 0, 0, TILE, TILE);
            drawContain(ctx, img2, TILE, 0, TILE, TILE);

            const tryDownload = (blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "are-you-meme.jpg";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    return true;
                }
                return false;
            };

            if (!canvas.toBlob || !await new Promise((res) => canvas.toBlob((b) => res(tryDownload(b)), "image/jpeg", 0.95))) {
                const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
                const a = document.createElement("a");
                a.href = dataUrl;
                a.download = "are-you-meme.jpg";
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (e) {
            alert("Failed to create download image: " + e);
        }
    }
    return (
        <Container maxWidth="lg" sx={{ minHeight: "100dvh", display: "flex", alignItems: "center", px: 2, py: 2, mb: 3, flexDirection: "column" }}>
            <AppTitle />
            <Paper elevation={6} sx={{ p: 3, pb: 4, width: "100%", borderRadius: 3, mb: 2 }} component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                        <Leaderboard fontSize="small" />
                        <Typography variant="subtitle1" fontWeight={800}>Results</Typography>
                    </Stack>
                    <Grid container spacing={3} wrap="nowrap" sx={{ overflow: "hidden", alignItems: "flex-start", justifyContent: "center" }}>
                        <Grid item>
                            <Stack spacing={1} alignItems="center">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CameraAlt fontSize="small" />
                                    <Typography variant="subtitle1" fontWeight={800}>Your Image</Typography>
                                </Stack>
                                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} style={{ width: "min(44vw, 300px)", height: "min(44vw, 300px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                                    <img src={uploadedUrl} alt="uploaded" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                </motion.div>
                            </Stack>
                        </Grid>
                        <Grid item>
                            <Stack spacing={1} alignItems="center">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Star fontSize="small" />
                                    <Typography variant="subtitle1" fontWeight={800}>Best Match</Typography>
                                </Stack>
                                <motion.div key={main?.image_url || bestMatchUrl} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} style={{ width: "min(44vw, 300px)", height: "min(44vw, 300px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                                    <img src={main?.image_url || bestMatchUrl} alt="best match" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                </motion.div>
                                {typeof score === "number" && (
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Speed fontSize="inherit" />
                                        <Typography variant="caption" color="text.secondary" fontWeight={800}>Score: {score.toFixed(4)}</Typography>
                                    </Stack>
                                )}
                            </Stack>
                        </Grid>

                    </Grid>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 1 }}>
                        <Collections fontSize="small" />
                        <Typography variant="subtitle1" fontWeight={800}>Other Matches</Typography>
                    </Stack>
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(4, ${THUMB}px)`, gap: 8, justifyContent: "center", margin: "0 auto" }}>
                        {allResults
                            .map((r, idx) => ({ r, idx }))
                            .filter(({ idx }) => idx !== mainIndex)
                            .slice(0, 4)
                            .map(({ r, idx }) => (
                                <motion.button whileTap={{ scale: 0.97 }}
                                    key={`${r.image_url}-${idx}`}
                                    onClick={() => setMainIndex(idx)}
                                    style={{
                                        width: THUMB,
                                        height: THUMB,
                                        borderRadius: 8,
                                        border: "1px solid rgba(0,0,0,0.1)",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                                        padding: 0,
                                        background: "#fff",
                                        cursor: "pointer",
                                    }}
                                >
                                    <img src={r.image_url} alt="match" style={{ width: THUMB, height: THUMB, objectFit: "cover", borderRadius: 8, transition: "transform 180ms ease" }} onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.03)"} onMouseOut={(e) => e.currentTarget.style.transform = "scale(1.0)"} />
                                </motion.button>
                            ))}
                    </div>
                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                        <Button variant="outlined" startIcon={<FileDownload />} onClick={onDownload || handleDownload}>Download</Button>
                        <Button variant="contained" startIcon={<Replay />} onClick={onRetry}>Try Again</Button>
                    </Stack>
                </Stack>
            </Paper>
        </Container>
    );
}


