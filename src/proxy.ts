import type { IncomingMessage, ServerResponse } from "node:http";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { URL } from "node:url";

export interface ProxyConfig {
  maxRedirects?: number;
  removeHeaders?: string[];
  allowedHosts?: string[];
  originWhitelist?: string[];
  originBlacklist?: string[];
}

interface ProxyResponse {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: Buffer;
  redirectChain: string[];
}

export class CorsProxyError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
  ) {
    super(message);
    this.name = "CorsProxyError";
  }
}

export async function proxyRequest(
  targetUrl: string,
  clientRequest: IncomingMessage,
  config: ProxyConfig = {},
): Promise<ProxyResponse> {
  const maxRedirects = config.maxRedirects ?? 5;
  const removeHeaders = new Set(config.removeHeaders?.map((h) => h.toLowerCase()) ?? []);

  let url: URL;
  try {
    // Add protocol if missing
    const urlWithProtocol = targetUrl.match(/^https?:\/\//)
      ? targetUrl
      : `http${targetUrl.includes(":443") ? "s" : ""}://${targetUrl}`;
    url = new URL(urlWithProtocol);
  } catch (_error) {
    throw new CorsProxyError("Invalid target URL", 400);
  }

  // Validate allowed hosts
  if (config.allowedHosts && config.allowedHosts.length > 0) {
    if (!config.allowedHosts.includes(url.hostname)) {
      throw new CorsProxyError(
        `The request host "${url.hostname}" isn't allowed by the operator for proxy`,
        403,
      );
    }
  }

  const redirectChain: string[] = [];
  let redirectCount = 0;

  while (true) {
    // Prepare headers
    const headers: Record<string, string | string[]> = {};

    // Copy headers from client request, excluding forbidden ones
    for (const [key, value] of Object.entries(clientRequest.headers)) {
      const lowerKey = key.toLowerCase();
      if (
        !removeHeaders.has(lowerKey) &&
        lowerKey !== "host" &&
        lowerKey !== "connection" &&
        value
      ) {
        headers[key] = value;
      }
    }

    // Set proper host header
    headers.host = url.host;

    // Make the request
    const response = await makeRequest(url, {
      method: clientRequest.method || "GET",
      headers,
    });

    // Handle redirects
    if (
      response.statusCode &&
      response.statusCode >= 300 &&
      response.statusCode < 400 &&
      response.headers.location
    ) {
      if (redirectCount >= maxRedirects) {
        // Return the redirect response to the client
        return {
          statusCode: response.statusCode,
          headers: response.headers,
          body: response.body,
          redirectChain,
        };
      }

      // Follow redirect
      const location = response.headers.location as string;
      const newUrl = new URL(location, url);
      redirectChain.push(url.toString());
      url = newUrl;
      redirectCount++;
      continue;
    }

    // Add redirect chain headers
    redirectChain.forEach((redirectUrl, index) => {
      response.headers[`x-cors-redirect-${index + 1}`] = redirectUrl;
    });

    // Add original URL header
    response.headers["x-request-url"] = targetUrl;
    response.headers["x-final-url"] = url.toString();

    return {
      statusCode: response.statusCode || 200,
      headers: response.headers,
      body: response.body,
      redirectChain,
    };
  }
}

interface RequestOptions {
  method: string;
  headers: Record<string, string | string[]>;
}

function makeRequest(
  url: URL,
  options: RequestOptions,
): Promise<{ statusCode: number; headers: Record<string, string | string[]>; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const requestFn = url.protocol === "https:" ? httpsRequest : httpRequest;

    const req = requestFn(
      url,
      {
        method: options.method,
        headers: options.headers,
      },
      (res) => {
        const chunks: Buffer[] = [];

        res.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });

        res.on("end", () => {
          resolve({
            statusCode: res.statusCode || 200,
            headers: res.headers as Record<string, string | string[]>,
            body: Buffer.concat(chunks),
          });
        });
      },
    );

    req.on("error", (error) => {
      reject(new CorsProxyError(`Failed to proxy request: ${error.message}`, 502));
    });

    // Set timeout
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new CorsProxyError("Request timeout", 504));
    });

    req.end();
  });
}

export function addCorsHeaders(res: ServerResponse, origin?: string): void {
  // Always allow all origins for a public CORS proxy
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Range",
  );
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Range, X-Request-URL, X-Final-URL",
  );
  res.setHeader("Access-Control-Allow-Credentials", "false");
  res.setHeader("Access-Control-Max-Age", "86400");
}

export function validateOrigin(
  origin: string | undefined,
  whitelist: string[],
  blacklist: string[],
): boolean {
  if (!origin) {
    return true; // Allow requests without origin header
  }

  // Check blacklist first
  if (blacklist.length > 0 && blacklist.includes(origin)) {
    return false;
  }

  // Check whitelist
  if (whitelist.length > 0 && !whitelist.includes(origin)) {
    return false;
  }

  return true;
}
