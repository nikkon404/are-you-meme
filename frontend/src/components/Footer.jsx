import React from "react";
import { Box, Container, Stack, Typography, Link, IconButton } from "@mui/material";
import { LinkedIn, GitHub, Instagram, LocalCafe } from "@mui/icons-material";

export default function Footer() {
    return (
        <Box component="footer" sx={{ height: 72, py: 2, mt: 1, bgcolor: "transparent", position: "sticky", bottom: 12 }}>
            <Container maxWidth="md">
                <Stack spacing={1} alignItems="center" textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                        by <strong>Nikkon</strong>
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <IconButton component={Link} href="https://www.linkedin.com/in/nikkon404/" target="_blank" rel="noopener" aria-label="LinkedIn"><LinkedIn /></IconButton>
                        <IconButton component={Link} href="https://github.com/nikkon404/are-you-meme" target="_blank" rel="noopener" aria-label="GitHub"><GitHub /></IconButton>
                        <IconButton component={Link} href="https://www.instagram.com/xnikkon/" target="_blank" rel="noopener" aria-label="Instagram"><Instagram /></IconButton>
                        <IconButton component={Link} href="https://buymeacoffee.com/nikkon" target="_blank" rel="noopener" aria-label="Buy me a coffee"><LocalCafe /></IconButton>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
}


