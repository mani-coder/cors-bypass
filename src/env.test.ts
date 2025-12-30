import { describe, expect, it } from "vitest";
import { parseEnvList } from "./env.js";

describe("parseEnvList", () => {
  it("should parse comma-separated values", () => {
    const result = parseEnvList("host1.com,host2.com,host3.com");
    expect(result).toEqual(["host1.com", "host2.com", "host3.com"]);
  });

  it("should handle values with spaces", () => {
    const result = parseEnvList("host1.com, host2.com , host3.com");
    expect(result).toEqual(["host1.com", "host2.com", "host3.com"]);
  });

  it("should return empty array for empty string", () => {
    const result = parseEnvList("");
    expect(result).toEqual([]);
  });

  it("should handle single value", () => {
    const result = parseEnvList("singlehost.com");
    expect(result).toEqual(["singlehost.com"]);
  });
});
