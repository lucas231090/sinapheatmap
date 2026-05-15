import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultApiTarget = "http://localhost:3333";

function normalizeTarget(rawTarget) {
  const target = String(rawTarget || defaultApiTarget).trim();

  if (/^https?:\/\//i.test(target)) {
    return target;
  }

  if (/^\d+$/.test(target)) {
    return `http://localhost:${target}`;
  }

  return `http://${target}`;
}

const apiTarget = normalizeTarget(process.env.VITE_API_BASE_URL);

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
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
