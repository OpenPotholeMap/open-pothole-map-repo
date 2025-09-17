import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

// Define schema for env variables
const envSchema = z.object({
  PORT: z.string().default("5000"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  MONGO_URI: z.string().default("mongodb://localhost:27017/myapp"),
  JWT_SECRET: z.string().default("your_jwt_secret_key"),
  NODE_ENV: z.string(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
});

// Validate process.env directly
const env = envSchema.parse(process.env);

// Export typed values
export const PORT = env.PORT;
export const CLIENT_URL = env.CLIENT_URL;
export const MONGO_URI = env.MONGO_URI;
export const JWT_SECRET = env.JWT_SECRET;
export const NODE_ENV = env.NODE_ENV || "development";
export const GOOGLE_APPLICATION_CREDENTIALS =
  env.GOOGLE_APPLICATION_CREDENTIALS;
