import React from "react";
import { Container, Stack, Typography, Button, Paper } from "@mui/material";
import { PlayArrow, EmojiEmotions, Palette, SportsKabaddi, PhotoCamera, Landscape } from "@mui/icons-material";
import { motion } from "framer-motion";
import AppTitle from "../components/AppTitle";

export default function WelcomePage({ onGetStarted }) {
    return (
        <Container maxWidth="md" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", px: 2 }}>
            <Paper elevation={6} sx={{ p: 6, width: "100%", borderRadius: 3 }} component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Stack spacing={3} alignItems="center" textAlign="center">
                    <AppTitle />
                    <Typography variant="body1" color="text.secondary" maxWidth={580}>
                        Snap a pic and meet your meme twin. We look at vibe, expression and scene to find your best match.
                    </Typography>
                    <Stack spacing={1} sx={{ width: "100%", maxWidth: 620 }}>
                        <Typography variant="subtitle2" fontWeight={900}>What we notice</Typography>
                        <Stack direction="row" spacing={2} justifyContent="center" sx={{ flexWrap: "wrap" }}>
                            <Stack direction="row" spacing={0.5} alignItems="center"><EmojiEmotions fontSize="small" /><Typography variant="body2" fontWeight={700}>Expression</Typography></Stack>
                            <Stack direction="row" spacing={0.5} alignItems="center"><SportsKabaddi fontSize="small" /><Typography variant="body2" fontWeight={700}>Pose & Action</Typography></Stack>
                            <Stack direction="row" spacing={0.5} alignItems="center"><Palette fontSize="small" /><Typography variant="body2" fontWeight={700}>Colors</Typography></Stack>
                            <Stack direction="row" spacing={0.5} alignItems="center"><Landscape fontSize="small" /><Typography variant="body2" fontWeight={700}>Background</Typography></Stack>
                            <Stack direction="row" spacing={0.5} alignItems="center"><PhotoCamera fontSize="small" /><Typography variant="body2" fontWeight={700}>Framing</Typography></Stack>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" align="center" fontWeight={700}>We only process your photo to match. We do not store or share your photo.</Typography>
                    </Stack>
                    <Button size="large" variant="contained" startIcon={<PlayArrow />} onClick={onGetStarted} component={motion.button} whileTap={{ scale: 0.97 }}>
                        Get Started
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
}


