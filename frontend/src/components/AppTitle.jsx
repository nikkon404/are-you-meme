import React from "react";
import { Typography } from "@mui/material";

export default function AppTitle({ onHome, sx }) {
    function handleClick(e) {
        e.preventDefault();
        if (typeof onHome === "function") {
            onHome();
        } else {
            window.location.reload();
        }
    }
    return (
        <Typography
            component="a"
            href="#"
            onClick={handleClick}
            variant="h5"
            fontWeight={900}
            align="center"
            sx={{ textDecoration: "none", color: "inherit", cursor: "pointer", display: "inline-block", my: 2, ...sx }}
        >
            Are You Meme
        </Typography>
    );
}


