import React from "react";
import { Container, Stack, Typography, Button, Paper, Box, Chip } from "@mui/material";
import { PlayArrow, EmojiEmotions, Palette, SportsKabaddi, PhotoCamera, Landscape } from "@mui/icons-material";
import { motion } from "framer-motion";
import AppTitle from "../components/AppTitle";
import previewImg from "../../resources/preview.png";

export default function WelcomePage({ onGetStarted }) {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: { xs: "flex-start", md: "center" },
                pt: { xs: 2, sm: 3, md: 4 },
                pb: { xs: 3, sm: 4, md: 6 },
            }}
        >
            <AppTitle />

            <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
                <Paper
                    elevation={6}
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    sx={{
                        p: { xs: 2.5, sm: 4, md: 5 },
                        borderRadius: { xs: 2, sm: 3 },
                        width: "100%",
                    }}
                >

                    <Stack spacing={{ xs: 2, sm: 2.5, md: 3 }} alignItems="center" textAlign="center">
                        {/* Title */}

                        {/* Preview Image */}
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            style={{ width: "100%", maxWidth: 500 }}
                        >
                            <Box
                                sx={{
                                    borderRadius: { xs: 2, sm: 3 },
                                    overflow: "hidden",
                                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                                    border: "1px solid rgba(0,0,0,0.06)",
                                }}
                            >
                                <img
                                    src={previewImg}
                                    alt="Are You Meme preview"
                                    style={{ display: "block", width: "100%", height: "auto" }}
                                />
                            </Box>
                        </motion.div>

                        {/* Description */}
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{
                                fontSize: { xs: "0.875rem", sm: "0.95rem", md: "1rem" },
                                maxWidth: 500,
                                lineHeight: 1.6,
                            }}
                        >
                            Snap a pic and meet your meme twin. It looks at vibe, expression and scene to find your best
                            match.
                        </Typography>

                        {/* Features */}
                        <Stack spacing={1} sx={{ width: "100%", maxWidth: 600 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: { xs: "0.8rem", sm: "0.85rem" } }}>
                                What it notices
                            </Typography>
                            <Stack
                                direction="row"
                                spacing={1}
                                justifyContent="center"
                                sx={{
                                    flexWrap: "wrap",
                                    gap: { xs: 0.75, sm: 1 },
                                }}
                            >
                                {[
                                    { icon: <EmojiEmotions />, label: "Expression" },
                                    { icon: <SportsKabaddi />, label: "Pose" },
                                    { icon: <Palette />, label: "Colors" },
                                    { icon: <Landscape />, label: "Background" },
                                    { icon: <PhotoCamera />, label: "Framing" },
                                ].map((item, idx) => (
                                    <Chip
                                        key={idx}
                                        icon={item.icon}
                                        label={item.label}
                                        size="small"
                                        sx={{
                                            fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                            height: { xs: 24, sm: 26 },
                                        }}
                                    />
                                ))}
                            </Stack>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                    fontWeight: 600,
                                    mt: 0.5,
                                }}
                            >
                                Your photo is only processed for matching and never stored or shared.
                            </Typography>
                        </Stack>

                        {/* CTA Button */}
                        <Button
                            size="large"
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={onGetStarted}
                            component={motion.button}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            sx={{
                                mt: { xs: 1, sm: 2 },
                                px: { xs: 3, sm: 4 },
                                py: { xs: 1, sm: 1.25 },
                                fontSize: { xs: "0.9rem", sm: "1rem" },
                                fontWeight: 700,
                            }}
                        >
                            Get Started
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}


