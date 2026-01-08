import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/customer/",
  server: {
    port: 7002,
    open: "/customer/",
    strictPort: true,
  },
});
