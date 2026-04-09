import "server-only"
import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "DATABASE_URL must start with postgresql:// or postgres://"
    ),
  AUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  AUTH_URL: z.string().url().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ")
  throw new Error(`Invalid server environment variables: ${details}`)
}

const authSecret = parsedEnv.data.AUTH_SECRET ?? parsedEnv.data.NEXTAUTH_SECRET

if (!authSecret) {
  throw new Error("Missing auth secret: define AUTH_SECRET (preferred) or NEXTAUTH_SECRET")
}

export const env = {
  ...parsedEnv.data,
  AUTH_SECRET: authSecret,
  AUTH_URL: parsedEnv.data.AUTH_URL ?? parsedEnv.data.NEXTAUTH_URL,
}
