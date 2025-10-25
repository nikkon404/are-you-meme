import React from "react";
import { Container, Stack, Typography, Paper, Alert } from "@mui/material";
import { motion } from "framer-motion";
import CameraCapture from "../components/CameraCapture";

export default function CapturePage({ onCapture, loading, error }) {
    return (
        <Container maxWidth="md" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", px: 2 }}>
            <Paper elevation={6} sx={{ p: 3, width: "100%", borderRadius: 3 }} component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Stack spacing={2} alignItems="stretch">
                    <Typography variant="h5" fontWeight={800}>Are You Meme</Typography>
                    <Typography variant="subtitle2" color="text.secondary">Capture</Typography>
                    {error && <Alert severity="error">{error}</Alert>}
                    <CameraCapture onCapture={onCapture} />
                    {loading && <Typography align="center" color="text.secondary">Analyzing your image...</Typography>}
                </Stack>
            </Paper>
        </Container>
    );
}


