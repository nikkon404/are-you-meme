import React, { useState, useEffect } from "react";
import { ThemeProvider, CssBaseline, Backdrop, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import theme from "./theme";
import useImageSearch from "./hooks/useImageSearch";
import ReactLazy, { Suspense } from "react";
const WelcomePage = React.lazy(() => import("./pages/WelcomePage"));
const CapturePage = React.lazy(() => import("./pages/CapturePage"));
const PreviewPage = React.lazy(() => import("./pages/PreviewPage"));
import Footer from "./components/Footer";

export default function App() {
    const [screen, setScreen] = useState("welcome"); // "welcome" | "capture" | "preview"
    const [fadeIn, setFadeIn] = useState(false);

    const { uploadedUrl, bestMatchUrl, results, loading, error, doSearch, reset, clearError } = useImageSearch();

    useEffect(() => {
        // Trigger fade-in effect when screen changes
        setFadeIn(false);
        const timeout = setTimeout(() => setFadeIn(true), 10);
        return () => clearTimeout(timeout);
    }, [screen]);

    async function handleCapture(blob) {
        await doSearch(blob);
        setScreen("preview");
    }

    function handleGetStarted() {
        setScreen("capture");
    }

    function handleTryAgain() {
        reset();
        setScreen("capture");
    }

    // Render the appropriate screen based on current state
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className={`app-container${fadeIn ? " fade-in" : ""}`}>
                <AnimatePresence mode="wait">
                    {screen === "welcome" && (
                        <motion.div key="welcome" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                            <WelcomePage onGetStarted={handleGetStarted} />
                        </motion.div>
                    )}

                    {screen === "capture" && (
                        <motion.div key="capture" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                            <CapturePage onCapture={handleCapture} loading={loading} error={error} />
                        </motion.div>
                    )}

                    {screen === "preview" && (
                        <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                            <PreviewPage
                                uploadedUrl={uploadedUrl}
                                bestMatchUrl={bestMatchUrl}
                                results={results}
                                onDownload={undefined}
                                onRetry={handleTryAgain}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
                <Backdrop open={loading} sx={{ color: "#fff", zIndex: (t) => t.zIndex.drawer + 1 }}>
                    <CircularProgress color="inherit" />
                </Backdrop>

                <Dialog open={Boolean(error)} onClose={clearError}>
                    <DialogTitle>Error</DialogTitle>
                    <DialogContent>{error}</DialogContent>
                    <DialogActions>
                        <Button onClick={clearError}>OK</Button>
                    </DialogActions>
                </Dialog>
            </div>

            <Footer />
        </ThemeProvider>
    );
}
