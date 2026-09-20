import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@react-pdf")) return "react-pdf";
          if (id.includes("recharts")) return "charts";
          if (id.includes("@refinedev")) return "refine";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("react/") || id.includes("react-dom")) return "react-vendor";
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    testTimeout: 15000,
  },
});
