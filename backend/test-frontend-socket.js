// Test script to simulate frontend sending frames
import { io } from "socket.io-client";

const socket = io(`${process.env.VITE_API_URL}`, {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("✅ Connected to backend socket");

  // Start detection session
  socket.emit("detection:start", { userId: "test-user-123" });
});

socket.on("detection:started", (data) => {
  console.log("🎬 Detection session started:", data);

  // Create a test frame (small black image)
  const canvas = document ? document.createElement("canvas") : null;
  let testFrameBase64;

  if (canvas) {
    // Browser environment
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 640, 480);
    testFrameBase64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
  } else {
    // Node.js environment - use a simple test image
    testFrameBase64 =
      "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A";
  }

  console.log("📸 Sending test frame...");

  // Send a test frame every 2 seconds
  const interval = setInterval(() => {
    socket.emit("detection:frame", {
      frame: testFrameBase64,
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
    });
    console.log("📡 Frame sent");
  }, 2000);

  // Stop after 30 seconds
  setTimeout(() => {
    clearInterval(interval);
    socket.emit("detection:stop");
    console.log("🛑 Stopping detection");
  }, 30000);
});

socket.on("detection:pothole", (detection) => {
  console.log("🕳️  Pothole detected!", detection);
});

socket.on("detection:processed", () => {
  console.log("✅ Frame processed");
});

socket.on("detection:error", (error) => {
  console.log("❌ Detection error:", error);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from backend");
});

socket.on("connect_error", (error) => {
  console.log("❌ Connection error:", error);
});
