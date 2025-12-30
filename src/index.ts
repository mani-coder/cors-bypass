import { createServer } from "node:http";
import { parseEnv, parseEnvList } from "./env.js";
import { handleRequest } from "./handler.js";

// Parse and validate environment variables
const env = parseEnv();
const port = env.PORT;

// Parse environment lists
const allowedHosts = parseEnvList(env.ALLOWED_PROXY_HOSTS);

// Create HTTP server using the shared handler
const server = createServer(handleRequest);

// Start server
server.listen(port, () => {
  console.log(`✅ CORS Bypass proxy running on port ${port}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  if (allowedHosts.length > 0) {
    const hosts = allowedHosts.filter((h) => h !== "iscorsneeded");
    if (hosts.length > 0) {
      console.log(`   Allowed hosts: ${hosts.join(", ")}`);
    }
  } else {
    console.log("   ⚠️  No host restrictions (open proxy)");
  }
  if (env.NODE_ENV === "development") {
    console.log(`\n   Try: http://localhost:${port}/https://api.github.com`);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🛑 SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
