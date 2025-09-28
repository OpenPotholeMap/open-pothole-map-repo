import app from "@/app";
import { connectDB } from "@/config/database";
import { PORT, ROBOFLOW_API_KEY, ROBOFLOW_PROJECT_ID, GOOGLE_CLOUD_BUCKET } from "@/config/envs";
import { createServer } from "http";
import { SocketService } from "@/services/socketService.js";

// Startup logs for debugging
console.log('🚀 Starting OpenPotholeMap Backend Server...');
console.log(`📱 Port: ${PORT}`);
console.log(`🤖 Roboflow API Key: ${ROBOFLOW_API_KEY ? `${ROBOFLOW_API_KEY.substring(0, 8)}...` : 'NOT SET'}`);
console.log(`📁 Roboflow Project: ${ROBOFLOW_PROJECT_ID || 'NOT SET'}`);
console.log(`☁️  GCS Bucket: ${GOOGLE_CLOUD_BUCKET || 'NOT SET'}`);

// Connect to database
console.log('🔌 Connecting to database...');
await connectDB();
console.log('✅ Database connected successfully');

// Create HTTP server
const server = createServer(app);

// Initialize Socket.io
console.log('🔗 Initializing Socket.io service...');
const socketService = new SocketService(server);
console.log('✅ Socket.io service initialized');

// Optionally broadcast recent potholes every 30 seconds
setInterval(async () => {
  try {
    await socketService.broadcastRecentPotholes();
  } catch (error) {
    console.error('Error broadcasting potholes:', error);
  }
}, 30000);

// Start server

server.listen(PORT, () => {
  console.log(`🎯 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Socket.io server ready for connections`);
  console.log(`📡 Ready to receive camera frames and process pothole detection`);
  console.log(`🔍 Roboflow Universe integration ready`);
  console.log('=====================================');
});

// Mobile Same network Debugging
// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server running on http://0.0.0.0:${PORT}`);
// });
