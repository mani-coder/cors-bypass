import { describe, expect, it } from "vitest";
import { CorsProxyError, validateOrigin } from "./proxy.js";

describe("CorsProxyError", () => {
  it("should create error with correct message and status code", () => {
    const error = new CorsProxyError("Test error", 404);
    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("CorsProxyError");
  });

  it("should default to 500 status code", () => {
    const error = new CorsProxyError("Test error");
    expect(error.statusCode).toBe(500);
  });
});

describe("validateOrigin", () => {
  it("should allow requests without origin header", () => {
    expect(validateOrigin(undefined, [], [])).toBe(true);
  });

  it("should block origins in blacklist", () => {
    expect(validateOrigin("http://bad.com", [], ["http://bad.com"])).toBe(false);
  });

  it("should allow origins not in blacklist", () => {
    expect(validateOrigin("http://good.com", [], ["http://bad.com"])).toBe(true);
  });

  it("should allow origins in whitelist", () => {
    expect(validateOrigin("http://good.com", ["http://good.com"], [])).toBe(true);
  });

  it("should block origins not in whitelist when whitelist is set", () => {
    expect(validateOrigin("http://bad.com", ["http://good.com"], [])).toBe(false);
  });

  it("should prioritize blacklist over whitelist", () => {
    expect(
      validateOrigin("http://example.com", ["http://example.com"], ["http://example.com"]),
    ).toBe(false);
  });

  it("should allow all origins when both lists are empty", () => {
    expect(validateOrigin("http://any.com", [], [])).toBe(true);
  });
});
