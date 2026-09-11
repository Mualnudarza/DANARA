import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  base: "/DANARA/",
  plugins: [react()],
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
});
