import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleApi } from "./src/server/api.ts";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** Dev-only dual-write /api middleware (disabled in production via handleApi). */
function mcApiPlugin(): Plugin {
  return {
    name: "mc-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (!url.startsWith("/api/")) return next();
        try {
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const body = Buffer.concat(chunks);
          const request = new Request(`http://local${url}`, {
            method: req.method,
            headers: req.headers as HeadersInit,
            body: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : body,
          });
          const response = await handleApi(request, url);
          if (!response) return next();
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              ok: false,
              error: { code: "internal", message: String(e) },
            }),
          );
        }
      });
    },
  };
}

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@": path.resolve(rootDir, "./src"),
      "@mc/protocol": path.resolve(rootDir, "../../packages/protocol/src/index.ts"),
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: "src",
    }),
    react(),
    nitro(),
    mcApiPlugin(),
  ],
});
