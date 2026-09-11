import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/DANARA/",
  plugins: [react()],
  resolve: { alias: { "@": resolve(dirname(fileURLToPath(import.meta.url)), "src") } },
});
