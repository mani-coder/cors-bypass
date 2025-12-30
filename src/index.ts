import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { parseEnv, parseEnvList } from "./env.js";
import { CorsProxyError, addCorsHeaders, proxyRequest, validateOrigin } from "./proxy.js";

// Parse and validate environment variables
const env = parseEnv();
const port = env.PORT;

// Parse environment lists
const originBlacklist = parseEnvList(env.ORIGIN_BLACKLIST);
const originWhitelist = parseEnvList(env.ORIGIN_WHITELIST);
const allowedHosts = parseEnvList(env.ALLOWED_PROXY_HOSTS);

// Add 'iscorsneeded' to allowed hosts if any hosts are configured
if (allowedHosts.length > 0) {
  allowedHosts.push("iscorsneeded");
}

const HELP_TEXT = `
CORS Bypass Proxy

Usage:
  /                 Shows this help message
  /iscorsneeded     Test endpoint (served without CORS headers)
  /<url>            Proxy request to <url> with CORS headers

Examples:
  ${env.NODE_ENV === "development" ? `http://localhost:${port}` : "https://cors.mani-coder.dev"}/https://api.example.com/data
  ${env.NODE_ENV === "development" ? `http://localhost:${port}` : "https://cors.mani-coder.dev"}/http://example.com

Features:
  - Automatic redirect following (up to 5 redirects)
  - Cookies are stripped from requests
  - CORS headers added to all responses
  - Protocol defaults to http (https for port 443)

Security:
  ${env.REQUIRE_HEADER ? "- Requires Origin or X-Requested-With header" : "- No header requirements"}
  ${allowedHosts.length > 0 ? `- Allowed hosts: ${allowedHosts.filter((h) => h !== "iscorsneeded").join(", ")}` : "- No host restrictions (open proxy)"}
  ${originWhitelist.length > 0 ? `- Origin whitelist: ${originWhitelist.join(", ")}` : ""}
  ${originBlacklist.length > 0 ? `- Origin blacklist: ${originBlacklist.join(", ")}` : ""}

Documentation: https://github.com/mani-coder/cors-bypass
`.trim();

// Request logger helper
function logRequest(method: string, targetUrl: string, statusCode: number, origin?: string): void {
  const timestamp = new Date().toISOString();
  const originText = origin ? `origin=${origin}` : "no-origin";
  const statusEmoji = statusCode >= 200 && statusCode < 300 ? "✓" : statusCode >= 400 ? "✗" : "•";

  console.log(`[${timestamp}] ${statusEmoji} ${method} ${statusCode} ${targetUrl} (${originText})`);
}

// Create HTTP server
const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const origin = req.headers.origin as string | undefined;

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    addCorsHeaders(res, origin);
    res.writeHead(200);
    res.end();
    logRequest("OPTIONS", req.url || "/", 200, origin);
    return;
  }

  try {
    const url = req.url || "/";

    // Root path - show help
    if (url === "/") {
      addCorsHeaders(res, origin);
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(HELP_TEXT);
      logRequest(req.method || "GET", "/", 200, origin);
      return;
    }

    // Special endpoint without CORS headers
    if (url === "/iscorsneeded") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("No CORS headers on this response");
      logRequest(req.method || "GET", "/iscorsneeded", 200, origin);
      return;
    }

    // Validate origin
    if (!validateOrigin(origin, originWhitelist, originBlacklist)) {
      addCorsHeaders(res, origin);
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end(`Origin "${origin}" is not allowed to use this proxy service`);
      logRequest(req.method || "GET", url, 403, origin);
      return;
    }

    // Optionally require Origin or X-Requested-With header to prevent casual browsing
    if (env.REQUIRE_HEADER) {
      const xRequestedWith = req.headers["x-requested-with"];
      if (!origin && !xRequestedWith) {
        addCorsHeaders(res, origin);
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Missing required header. Please set Origin or X-Requested-With header.");
        logRequest(req.method || "GET", url, 400, origin);
        return;
      }
    }

    // Extract target URL (remove leading /)
    const targetUrl = url.slice(1);

    if (!targetUrl) {
      addCorsHeaders(res, origin);
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Please specify a URL to proxy. Example: /<url>");
      logRequest(req.method || "GET", url, 400, origin);
      return;
    }

    // Proxy the request
    const proxyConfig: {
      maxRedirects: number;
      removeHeaders: string[];
      allowedHosts?: string[];
      originWhitelist: string[];
      originBlacklist: string[];
    } = {
      maxRedirects: 5,
      removeHeaders: [
        "cookie",
        "cookie2",
        "x-request-start",
        "x-request-id",
        "via",
        "connect-time",
        "total-route-time",
      ],
      originWhitelist,
      originBlacklist,
    };

    if (allowedHosts.length > 0) {
      proxyConfig.allowedHosts = allowedHosts;
    }

    const response = await proxyRequest(targetUrl, req, proxyConfig);

    // Add CORS headers
    addCorsHeaders(res, origin);

    // Copy response headers (excluding hop-by-hop headers)
    const hopByHopHeaders = new Set([
      "connection",
      "keep-alive",
      "proxy-authenticate",
      "proxy-authorization",
      "te",
      "trailer",
      "transfer-encoding",
      "upgrade",
    ]);

    for (const [key, value] of Object.entries(response.headers)) {
      if (!hopByHopHeaders.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    // Send response
    res.writeHead(response.statusCode);
    res.end(response.body);
    logRequest(req.method || "GET", targetUrl, response.statusCode, origin);
  } catch (error) {
    // Handle errors
    addCorsHeaders(res, origin);
    const url = req.url || "/";
    const targetUrl = url.slice(1);

    if (error instanceof CorsProxyError) {
      res.writeHead(error.statusCode, { "Content-Type": "text/plain" });
      res.end(error.message);
      logRequest(req.method || "GET", targetUrl || url, error.statusCode, origin);
    } else {
      console.error("Unexpected error:", error);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal server error");
      logRequest(req.method || "GET", targetUrl || url, 500, origin);
    }
  }
});

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
