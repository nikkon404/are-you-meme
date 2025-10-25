import React, { useMemo, useState } from "react";
import { Container, Stack, Typography, Paper, Grid, Button } from "@mui/material";
import { Share, Replay } from "@mui/icons-material";
import { motion } from "framer-motion";

export default function PreviewPage({ uploadedUrl, bestMatchUrl, results, onShare, onRetry }) {
    const allResults = Array.isArray(results) ? results : [];
    const initialIndex = useMemo(() => {
        const idx = allResults.findIndex((r) => r?.image_url === bestMatchUrl);
        return idx >= 0 ? idx : 0;
    }, [allResults, bestMatchUrl]);
    const [mainIndex, setMainIndex] = useState(initialIndex);
    const main = allResults[mainIndex];
    const score = main?.score;
    const TILE = 340; // slightly smaller to leave space for footer
    const THUMB = 84; // thumbnail size

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

    async function handleShare() {
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
                    a.download = "are-you-meme-share.jpg";
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
                a.download = "are-you-meme-share.jpg";
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (e) {
            alert("Failed to create share image: " + e);
        }
    }
    return (
        <Container maxWidth="lg" sx={{ height: "calc(100vh - 76px)", display: "flex", alignItems: "center", px: 2 }}>
            <Paper elevation={6} sx={{ p: 3, width: "100%", borderRadius: 3 }} component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Stack spacing={2}>
                    <Typography variant="h5" fontWeight={800}>Are You Meme</Typography>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>Results</Typography>
                    <Grid container spacing={2} wrap="nowrap" sx={{ overflow: "hidden", alignItems: "flex-start", justifyContent: "center" }}>
                        <Grid item>
                            <Stack spacing={1} alignItems="center">
                                <Typography variant="subtitle1" fontWeight={700}>Your Image</Typography>
                                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} style={{ width: TILE, height: TILE, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                                    <img src={uploadedUrl} alt="uploaded" style={{ width: TILE, height: TILE, objectFit: "contain" }} />
                                </motion.div>
                            </Stack>
                        </Grid>
                        <Grid item>
                            <Stack spacing={1} alignItems="center">
                                <Typography variant="subtitle1" fontWeight={700}>Best Match</Typography>
                                <motion.div key={main?.image_url || bestMatchUrl} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} style={{ width: TILE, height: TILE, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                                    <img src={main?.image_url || bestMatchUrl} alt="best match" style={{ width: TILE, height: TILE, objectFit: "contain" }} />
                                </motion.div>
                                {typeof score === "number" && (
                                    <Typography variant="caption" color="text.secondary">Score: {score.toFixed(4)}</Typography>
                                )}
                            </Stack>
                        </Grid>

                    </Grid>
                    <Stack direction="row" spacing={1} justifyContent="center">
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
                    </Stack>
                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                        <Button variant="outlined" startIcon={<Share />} onClick={onShare || handleShare}>Share</Button>
                        <Button variant="contained" startIcon={<Replay />} onClick={onRetry}>Try Again</Button>
                    </Stack>
                </Stack>
            </Paper>
        </Container>
    );
}


