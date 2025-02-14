import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      crypto: 'crypto-browserify'
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          // Disable Buffer injection to avoid duplicate declarations
          buffer: false,
          process: true,
        }),
        // Removed NodeModulesPolyfillPlugin to prevent an additional Buffer polyfill.
      ]
    }
  },
  build: {
    rollupOptions: {},
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  }
});
