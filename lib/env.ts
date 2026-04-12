import "server-only"
import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  AUTH_URL: z.string().url().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
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
  CLOUDINARY_CLOUD_NAME: parsedEnv.data.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: parsedEnv.data.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: parsedEnv.data.CLOUDINARY_API_SECRET,
  RESEND_API_KEY: parsedEnv.data.RESEND_API_KEY,
}
