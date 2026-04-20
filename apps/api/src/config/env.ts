import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // GOV.BR OAuth2
  GOVBR_CLIENT_ID: z.string().optional(),
  GOVBR_CLIENT_SECRET: z.string().optional(),
  GOVBR_REDIRECT_URI: z.string().default('http://localhost:3000/auth/callback/govbr'),
  GOVBR_AUTH_URL: z.string().default('https://sso.staging.acesso.gov.br/authorize'),
  GOVBR_TOKEN_URL: z.string().default('https://sso.staging.acesso.gov.br/token'),
  GOVBR_USERINFO_URL: z.string().default('https://sso.staging.acesso.gov.br/userinfo'),

  // SendGrid
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().default('alertas@regtelecom.com.br'),
  SENDGRID_FROM_NAME: z.string().default('RegTelecom'),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // API
  API_PORT: z.coerce.number().default(3001),
  API_HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // AWS S3
  AWS_REGION: z.string().default('sa-east-1'),
  S3_BUCKET_DOCUMENTS: z.string().default('regtelecom-documents'),
  S3_BUCKET_REPORTS: z.string().default('regtelecom-reports'),
})

export const config = envSchema.parse(process.env)
export type Config = z.infer<typeof envSchema>
