import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In development, forward /api calls to the Python backend
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
