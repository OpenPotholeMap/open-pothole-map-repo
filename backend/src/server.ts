import app from "@/app.js";
import { connectDB } from "@/config/database";
import {
  PORT,
  ROBOFLOW_API_KEY,
  ROBOFLOW_PROJECT_ID,
  GOOGLE_CLOUD_BUCKET,
} from "@/config/envs";
import { createServer } from "http";
import https from "https";
import { SocketService } from "@/services/socketService.js";
import fs from "fs";

// Startup logs for debugging
console.log("🚀 Starting OpenPotholeMap Backend Server...");
console.log(`📱 Port: ${PORT}`);
console.log(
  `🤖 Roboflow API Key: ${
    ROBOFLOW_API_KEY ? `${ROBOFLOW_API_KEY.substring(0, 8)}...` : "NOT SET"
  }`
);
console.log(`📁 Roboflow Project: ${ROBOFLOW_PROJECT_ID || "NOT SET"}`);
console.log(`☁️  GCS Bucket: ${GOOGLE_CLOUD_BUCKET || "NOT SET"}`);

// Connect to database
console.log("🔌 Connecting to database...");
await connectDB();
console.log("✅ Database connected successfully");

const options = {
  key: fs.readFileSync("C:/Windows/System32/cert.key"),
  cert: fs.readFileSync("C:/Windows/System32/cert.crt"),
};

// Create HTTP server
const server = createServer(app);

// Initialize Socket.io
console.log("🔗 Initializing Socket.io service...");
const socketService = new SocketService(server);
console.log("✅ Socket.io service initialized");

// Optionally broadcast recent potholes every 30 seconds
setInterval(async () => {
  try {
    await socketService.broadcastRecentPotholes();
  } catch (error) {
    console.error("Error broadcasting potholes:", error);
  }
}, 30000);

// Start server with HTTPS
const httpsServer = https.createServer(options, app);

// Initialize Socket.io with HTTPS server
const socketService2 = new SocketService(httpsServer);

httpsServer.listen(parseInt(PORT), "0.0.0.0", () => {
  console.log(`🎯 HTTPS Server running on https://0.0.0.0:${PORT}`);
  console.log(`🔗 Socket.io server ready for connections`);
  console.log(
    `📡 Ready to receive camera frames and process pothole detection`
  );
  console.log(`🔍 Roboflow Universe integration ready`);
  console.log("=====================================");
});
