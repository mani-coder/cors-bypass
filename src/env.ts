import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("3000").transform(Number),
  ORIGIN_BLACKLIST: z.string().optional().default(""),
  ORIGIN_WHITELIST: z.string().optional().default(""),
  ALLOWED_PROXY_HOSTS: z.string().optional().default(""),
  REQUIRE_HEADER: z
    .string()
    .optional()
    .default("false")
    .transform((val) => val === "true"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:");
      for (const issue of error.issues) {
        console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
      }
      process.exit(1);
    }
    throw error;
  }
}

export function parseEnvList(value: string): string[] {
  return value ? value.split(",").map((item) => item.trim()) : [];
}
