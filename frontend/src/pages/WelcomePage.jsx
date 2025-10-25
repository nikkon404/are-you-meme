import React from "react";
import { Container, Stack, Typography, Button, Paper } from "@mui/material";
import { PlayArrow } from "@mui/icons-material";
import { motion } from "framer-motion";
import AppTitle from "../components/AppTitle";

export default function WelcomePage({ onGetStarted }) {
    return (
        <Container maxWidth="md" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", px: 2 }}>
            <Paper elevation={6} sx={{ p: 6, width: "100%", borderRadius: 3 }} component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Stack spacing={3} alignItems="center" textAlign="center">
                    <AppTitle />
                    <Typography variant="body1" color="text.secondary" maxWidth={560}>
                        Capture your photo and we’ll find the closest matching meme from our collection.
                        Explore fun, expressive, and action-aware matches.
                    </Typography>
                    <Button size="large" variant="contained" startIcon={<PlayArrow />} onClick={onGetStarted} component={motion.button} whileTap={{ scale: 0.97 }}>
                        Get Started
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
}


