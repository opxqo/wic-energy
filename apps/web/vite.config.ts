import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const clientPath = fileURLToPath(new URL("./client", import.meta.url));

export default defineConfig({
  root: clientPath,
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": clientPath } },
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(
        ["index", "login", "docs"].map((name) => [
          name,
          fileURLToPath(new URL(`./client/${name}.html`, import.meta.url)),
        ]),
      ),
    },
  },
});
