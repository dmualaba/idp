import { createServer } from "node:http";
import { RPCHandler } from "@orpc/server/node";
import { CORSPlugin } from "@orpc/server/plugins";
import { onError } from "@orpc/server";
import "dotenv/config";

import { router } from "./routes";

const PORT = process.env.PORT || 3001;

// Create the oRPC handler
const handler = new RPCHandler(router, {
  plugins: [
    new CORSPlugin({
      origin: "*",
      credentials: true,
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error("[oRPC Error]", error);
    }),
  ],
});

// Create HTTP server
const server = createServer(async (req, res) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    });
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
    );
    return;
  }

  // Handle oRPC requests
  const result = await handler.handle(req, res, {
    prefix: "/rpc",
    context: {
      headers: req.headers,
    },
  });

  if (!result.matched) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Not Found",
        message: `No procedure matched for ${req.url}`,
      }),
    );
  }
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Bible Quiz API Server                                    ║
║                                                            ║
║   Server running at http://localhost:${PORT}                 ║
║   Health check: http://localhost:${PORT}/health              ║
║   RPC endpoint: http://localhost:${PORT}/rpc                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
