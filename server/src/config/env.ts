import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from server directory or root
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/classsathi'),
  JWT_SECRET: z.string().default('classsathi_super_secret_jwt_key_2026_production_grade'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SCHOOL_TIMEZONE: z.string().default('Asia/Kolkata'),
  LOW_ATTENDANCE_THRESHOLD: z.string().transform(Number).default('75'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
