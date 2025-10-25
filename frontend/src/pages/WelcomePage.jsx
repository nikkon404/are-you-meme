import React from "react";
import { Container, Stack, Typography, Button, Paper } from "@mui/material";
import { PlayArrow, EmojiEmotions, Palette, SportsKabaddi, PhotoCamera, Landscape } from "@mui/icons-material";
import { motion } from "framer-motion";
import AppTitle from "../components/AppTitle";
import previewImg from "../../resources/preview.png";

export default function WelcomePage({ onGetStarted }) {
    return (
        <Container maxWidth="md" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", px: 2, py: 4 }}>
            <Paper elevation={6} sx={{ p: 6, pt: 4, width: "100%", borderRadius: 3 }} component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Stack spacing={3} alignItems="center" textAlign="center">
                    <AppTitle />
                    <motion.div
                        initial={{ y: 0 }}
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                        style={{
                            width: "min(92vw, 560px)",
                            borderRadius: 16,
                            border: "1px solid rgba(0,0,0,0.08)",
                            boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
                            overflow: "hidden",
                            background: "#fff",
                            willChange: "transform",
                        }}
                    >
                        <img src={previewImg} alt="Are You Meme preview" style={{ display: "block", width: "100%", height: "auto" }} />
                    </motion.div>
                    <Typography variant="body1" color="text.secondary" maxWidth={580}>
                        Snap a pic and meet your meme twin. It looks at vibe, expression and scene to find your best match.
                    </Typography>
                    <Stack spacing={1} sx={{ width: "100%", maxWidth: 620 }}>
                        <Typography variant="subtitle2" fontWeight={900}>What it notices</Typography>
                        <Stack direction="row" spacing={2} justifyContent="center" sx={{ flexWrap: "wrap" }}>
                            <Stack direction="row" spacing={0.5} alignItems="center"><EmojiEmotions sx={{ fontSize: 16 }} /><Typography variant="caption" fontWeight={700}>Expression</Typography></Stack>
                            <Stack direction="row" spacing={0.5} alignItems="center"><SportsKabaddi sx={{ fontSize: 16 }} /><Typography variant="caption" fontWeight={700}>Pose & Action</Typography></Stack>
                            <Stack direction="row" spacing={0.5} alignItems="center"><Palette sx={{ fontSize: 16 }} /><Typography variant="caption" fontWeight={700}>Colors</Typography></Stack>
                            <Stack direction="row" spacing={0.5} alignItems="center"><Landscape sx={{ fontSize: 16 }} /><Typography variant="caption" fontWeight={700}>Background</Typography></Stack>
                            <Stack direction="row" spacing={0.5} alignItems="center"><PhotoCamera sx={{ fontSize: 16 }} /><Typography variant="caption" fontWeight={700}>Framing</Typography></Stack>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" align="center" fontWeight={700}>It only processes your photo to match and does not store or share your photo.</Typography>
                    </Stack>
                    <Button size="large" variant="contained" startIcon={<PlayArrow />} onClick={onGetStarted} component={motion.button} whileTap={{ scale: 0.97 }}>
                        Get Started
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
}


