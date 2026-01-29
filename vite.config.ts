// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import svgLoader from "vite-svg-loader";

function isLikelyDocker() {
  // Best-effort detection: works in many Docker images
  return (
    process.env.DOCKER === "1" ||
    process.env.DOCKER === "true" ||
    process.env.CONTAINER === "true" ||
    false
  );
}

export default defineConfig(({ mode }) => {
  // Load env vars for this mode (dev / prod)
  // Third arg '' means: include vars without the VITE_ prefix too
  const env = loadEnv(mode, process.cwd(), "");

  /**
   * IMPORTANT:
   * If Vite runs inside docker, `localhost:8001` is WRONG.
   * It must target the docker service name on the compose network.
   *
   * Set FLASK_URL in your client container env to override this cleanly.
   */
  const DEFAULT_FLASK = isLikelyDocker()
    ? "http://api-dev:8001"
    : "http://localhost:8001";

  const FLASK = env.FLASK_URL || DEFAULT_FLASK;

  const proxyOpts = {
    target: FLASK,
    changeOrigin: true,
    secure: false,
  };

  return {
    plugins: [vue(), svgLoader()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    publicDir: "public",
    server: {
      port: 5173,
      hmr: { overlay: true },
      cors: true,
      proxy: {
        // If you use any /api/* routes
        "/api": proxyOpts,

        // Auth routes (login/callback/logout)
        "/auth": proxyOpts,

        // ✅ Backend is /upload/<...> (NOT /uploads)
        "/upload": proxyOpts,

        // Keep this only if something still calls /uploads (optional)
        "/uploads": proxyOpts,

        "/runs": proxyOpts,
        "/billing": proxyOpts,
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});
