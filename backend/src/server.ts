import app from "@/app";
import { connectDB } from "@/config/database";
import { PORT } from "@/config/envs";
import { createServer } from "http";
import { SocketService } from "@/services/socketService.js";

// Connect to database
await connectDB();

// Create HTTP server
const server = createServer(app);

// Initialize Socket.io
const socketService = new SocketService(server);

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
  console.log(`Server running on ${PORT}`);
  console.log(`Socket.io server ready`);
});

// Mobile Same network Debugging
// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server running on http://0.0.0.0:${PORT}`);
// });
