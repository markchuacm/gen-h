import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function memberCleanUrl(): Plugin {
  const middleware = () => (req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse, next: () => void) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname === "/member.html") {
      res.statusCode = 302;
      res.setHeader("Location", `/member${url.search}`);
      res.end();
      return;
    }

    if (url.pathname === "/member" || url.pathname.startsWith("/member/")) {
      req.url = `/member.html${url.search}`;
    }

    next();
  };

  return {
    name: "member-clean-url",
    configureServer(server) {
      server.middlewares.use(middleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware());
    },
  };
}

export default defineConfig({
  plugins: [memberCleanUrl(), react()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        memberV2: "member.html",
      },
    },
  },
});
