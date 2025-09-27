import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

// Define schema for env variables
const envSchema = z.object({
  PORT: z.string(),
  CLIENT_URL: z.string(),
  MONGO_URI: z.string(),
  JWT_SECRET: z.string(),
  NODE_ENV: z.string(),
  FIREBASE_APPLICATION_CREDENTIALS: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  ROBOFLOW_API_KEY: z.string(),
  ROBOFLOW_PROJECT_ID: z.string(),
  ROBOFLOW_MODEL_VERSION: z.string(),
  GOOGLE_CLOUD_BUCKET: z.string(),
});

// Validate process.env directly
const env = envSchema.parse(process.env);

// Export typed values
export const PORT = env.PORT;
export const CLIENT_URL = env.CLIENT_URL;
export const MONGO_URI = env.MONGO_URI;
export const JWT_SECRET = env.JWT_SECRET;
export const NODE_ENV = env.NODE_ENV;
export const FIREBASE_APPLICATION_CREDENTIALS = env.FIREBASE_APPLICATION_CREDENTIALS;
export const GOOGLE_APPLICATION_CREDENTIALS = env.GOOGLE_APPLICATION_CREDENTIALS;
export const ROBOFLOW_API_KEY = env.ROBOFLOW_API_KEY;
export const ROBOFLOW_PROJECT_ID = env.ROBOFLOW_PROJECT_ID;
export const ROBOFLOW_MODEL_VERSION = env.ROBOFLOW_MODEL_VERSION;
export const GOOGLE_CLOUD_BUCKET = env.GOOGLE_CLOUD_BUCKET;
