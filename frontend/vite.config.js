import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const useHttps = env.VITE_USE_HTTPS === "true";
    const proxyTarget = env.VITE_DEV_PROXY_TARGET; // e.g., http://127.0.0.1:8000
    return {
        plugins: [react()],
        server: {
            host: true, // expose on LAN for mobile testing
            https: useHttps || false,
            proxy: proxyTarget
                ? {
                    "/api": {
                        target: proxyTarget,
                        changeOrigin: true,
                        rewrite: (p) => p.replace(/^\/api/, ""),
                    },
                    "/memes": {
                        target: proxyTarget,
                        changeOrigin: true,
                    },
                }
                : undefined,
        },
        preview: {
            host: true,
            https: useHttps || false,
        },
    };
});
