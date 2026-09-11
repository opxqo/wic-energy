import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const clientPath = fileURLToPath(new URL("./client", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": clientPath } },
  test: {
    environment: "jsdom",
    include: ["test/*.test.tsx"],
    restoreMocks: true,
  },
});
