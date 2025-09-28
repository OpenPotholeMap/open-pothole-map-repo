import { io, Socket } from "socket.io-client";

interface DetectionEvent {
  potholeId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  confidence: number;
  detectionCount: number;
}

interface PotholeData {
  id: string;
  latitude: number;
  longitude: number;
  confidenceScore: number;
  detectedAt: string;
  verified: boolean;
  detectionCount: number;
  images: string[];
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(serverUrl: string = "http://localhost:8000"): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(serverUrl, {
        transports: ["websocket"],
        timeout: 10000,
      });

      this.socket.on("connect", () => {
        console.log("Connected to server");
        this.isConnected = true;
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on("disconnect", () => {
        console.log("Disconnected from server");
        this.isConnected = false;
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Detection methods
  startDetection(userId?: string): Promise<{ sessionId: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error("Not connected to server"));
        return;
      }

      this.socket.emit("detection:start", { userId });

      this.socket.once("detection:started", (data) => {
        resolve(data);
      });

      setTimeout(() => {
        reject(new Error("Start detection timeout"));
      }, 5000);
    });
  }

  sendFrame(frame: string, location: { latitude: number; longitude: number }) {
    if (!this.socket || !this.isConnected) {
      console.error("Cannot send frame: not connected");
      return;
    }

    this.socket.emit("detection:frame", {
      frame,
      location,
    });
  }

  stopDetection(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        resolve();
        return;
      }

      this.socket.emit("detection:stop");

      this.socket.once("detection:stopped", () => {
        resolve();
      });

      // Resolve anyway after timeout
      setTimeout(resolve, 2000);
    });
  }

  // Event listeners
  onPotholeDetected(callback: (event: DetectionEvent) => void) {
    if (this.socket) {
      this.socket.on("detection:pothole", callback);
    }
  }

  onFrameProcessed(callback: () => void) {
    if (this.socket) {
      this.socket.on("detection:processed", callback);
    }
  }

  onDetectionError(callback: (error: { message: string }) => void) {
    if (this.socket) {
      this.socket.on("detection:error", callback);
    }
  }

  // Map methods
  subscribeToMapUpdates(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) {
    if (this.socket) {
      this.socket.emit("map:subscribe", { bounds });
    }
  }

  unsubscribeFromMapUpdates(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) {
    if (this.socket) {
      this.socket.emit("map:unsubscribe", { bounds });
    }
  }

  onNewPothole(callback: (pothole: PotholeData) => void) {
    if (this.socket) {
      this.socket.on("map:new_pothole", callback);
    }
  }

  onPotholesUpdate(callback: (potholes: PotholeData[]) => void) {
    if (this.socket) {
      this.socket.on("map:potholes", callback);
    }
  }

  // Remove event listeners
  off(event: string, callback?: (...args: unknown[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
