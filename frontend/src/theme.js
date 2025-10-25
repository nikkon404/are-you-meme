import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: "light",
        primary: { main: "#4f46e5" },
        secondary: { main: "#10b981" },
        background: {
            default: "#f8faff",
            paper: "#ffffff",
        },
    },
    shape: { borderRadius: 12 },
    typography: {
        fontFamily: [
            "Inter",
            "ui-sans-serif",
            "system-ui",
            "-apple-system",
            "Segoe UI",
            "Roboto",
            "Helvetica",
            "Arial",
        ].join(", "),
    },
});

export default theme;


