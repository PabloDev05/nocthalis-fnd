import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),

    // 👇 Plugin para silenciar el warning del .well-known
    {
      name: "suppress-chrome-devtools-request",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith("/.well-known/appspecific/")) {
            res.statusCode = 204; // No Content
            return res.end();
          }
          next();
        });
      }
    }
  ]
});
