import type { IncomingMessage, ServerResponse } from "node:http";
import { handleRequest } from "../src/handler.js";

// Serverless function handler for Vercel
// This simply wraps the shared handler from src/handler.ts
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleRequest(req, res);
}
