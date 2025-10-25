import React from "react";
import { Container, Stack, Typography, Paper, Alert } from "@mui/material";
import { motion } from "framer-motion";
import AppTitle from "../components/AppTitle";
import CameraCapture from "../components/CameraCapture";

export default function CapturePage({ onCapture, loading, error }) {
    const insecure = typeof window !== "undefined" && !(
        (window.isSecureContext === true) ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    );
    return (
        <Container maxWidth="md" sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", px: 2, py: 2 }}>
            <AppTitle />
            <Paper elevation={6} sx={{ p: 3, width: "100%", borderRadius: 3 }} component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Stack spacing={2} alignItems="stretch">
                    <Typography variant="subtitle2" color="text.secondary">Capture</Typography>
                    {insecure && (
                        <Alert severity="warning">
                            To use the camera on mobile, open this site over HTTPS or use localhost.
                        </Alert>
                    )}
                    {error && <Alert severity="error">{error}</Alert>}
                    <CameraCapture onCapture={onCapture} />
                    {loading && <Typography align="center" color="text.secondary">Analyzing your image...</Typography>}
                </Stack>
            </Paper>
        </Container>
    );
}


