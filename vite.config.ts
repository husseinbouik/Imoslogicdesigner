import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      three: path.resolve(__dirname, "node_modules/three"),
    },
  },
  server: {
    proxy: {
      // Forward API calls to Express backend
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      // Forward uploaded GLB file requests to Express backend
      "/uploads": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
