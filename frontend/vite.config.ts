import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiProxy = {
  // forward /api calls to FastAPI so the SPA + API share one origin (no CORS)
  "/api": {
    // Use IPv4 explicitly. On some hosts `localhost` resolves to ::1 first,
    // which can route the proxy to a different listener than the FastAPI app.
    target: "http://127.0.0.1:8000",
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/api/, ""),
  },
};

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: apiProxy },
  // `vite preview` serves the production build; used for the public Cloudflare demo.
  preview: {
    port: 5173,
    host: true,
    allowedHosts: true, // accept the random *.trycloudflare.com tunnel host
    proxy: apiProxy,
  },
});
