import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
