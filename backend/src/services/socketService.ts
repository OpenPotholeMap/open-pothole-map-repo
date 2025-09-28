import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { detectionService } from './detectionService.js';
import { CLIENT_URL } from '@/config/envs.js';

interface DetectionSocketData {
  frame: string; // base64 encoded image
  location: {
    latitude: number;
    longitude: number;
  };
  userId?: string;
}

interface SocketWithAuth extends Socket {
  userId?: string;
  sessionId?: string;
}

class SocketService {
  private io: SocketIOServer;
  private processingQueue = new Map<string, NodeJS.Timeout>();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: CLIENT_URL,
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: SocketWithAuth) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle detection start
      socket.on('detection:start', async (data: { userId?: string }) => {
        console.log('Detection started for user:', data.userId);
        socket.userId = data.userId;

        const sessionId = await detectionService.startDetectionSession(data.userId);
        socket.sessionId = sessionId || undefined;

        socket.emit('detection:started', { sessionId });
      });

      // Handle frame processing
      socket.on('detection:frame', async (data: DetectionSocketData) => {
        console.log(`🎬 Received detection:frame event from client ${socket.id}`);
        console.log(`   Frame data size: ${data.frame ? data.frame.length : 'NO_FRAME'} characters`);
        console.log(`   Location data: ${data.location ? JSON.stringify(data.location) : 'NO_LOCATION'}`);
        this.handleFrameProcessing(socket, data);
      });

      // Handle detection stop
      socket.on('detection:stop', async () => {
        console.log('Detection stopped for user:', socket.userId);

        if (socket.sessionId) {
          await detectionService.endDetectionSession(socket.sessionId);
        }

        // Clear any pending processing
        const timeout = this.processingQueue.get(socket.id);
        if (timeout) {
          clearTimeout(timeout);
          this.processingQueue.delete(socket.id);
        }

        socket.emit('detection:stopped');
      });

      // Handle map subscription for live updates
      socket.on('map:subscribe', (data: { bounds: { north: number, south: number, east: number, west: number } }) => {
        const room = `map_${Math.floor(data.bounds.north)}_${Math.floor(data.bounds.south)}_${Math.floor(data.bounds.east)}_${Math.floor(data.bounds.west)}`;
        socket.join(room);
        console.log(`Client ${socket.id} subscribed to map region: ${room}`);
      });

      socket.on('map:unsubscribe', (data: { bounds: { north: number, south: number, east: number, west: number } }) => {
        const room = `map_${Math.floor(data.bounds.north)}_${Math.floor(data.bounds.south)}_${Math.floor(data.bounds.east)}_${Math.floor(data.bounds.west)}`;
        socket.leave(room);
        console.log(`Client ${socket.id} unsubscribed from map region: ${room}`);
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        console.log(`Client disconnected: ${socket.id}`);

        if (socket.sessionId) {
          await detectionService.endDetectionSession(socket.sessionId);
        }

        const timeout = this.processingQueue.get(socket.id);
        if (timeout) {
          clearTimeout(timeout);
          this.processingQueue.delete(socket.id);
        }
      });
    });
  }

  private async handleFrameProcessing(socket: SocketWithAuth, data: DetectionSocketData) {
    const socketId = socket.id;

    console.log(`📥 Received frame from client ${socketId}`);
    console.log(`   Location: ${data.location.latitude}, ${data.location.longitude}`);
    console.log(`   User ID: ${data.userId || 'anonymous'}`);
    console.log(`   Frame size: ${data.frame.length} characters (base64)`);

    // Rate limiting: only process one frame per second per client
    if (this.processingQueue.has(socketId)) {
      console.log(`⏸️  Skipping frame processing - rate limit active for ${socketId}`);
      return; // Skip if already processing
    }

    // Set a timeout to prevent too frequent processing
    const timeout = setTimeout(() => {
      this.processingQueue.delete(socketId);
    }, 1000); // 1 second cooldown

    this.processingQueue.set(socketId, timeout);

    console.log(`🔄 Processing frame for client ${socketId}...`);

    try {
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(data.frame, 'base64');
      console.log(`🖼️  Converted to buffer: ${imageBuffer.length} bytes`);

      // Process frame with Roboflow
      const detectionResult = await detectionService.processFrame(imageBuffer);

      if (detectionResult && detectionResult.predictions?.length > 0) {
        console.log(`🔍 Filtering pothole detections from ${detectionResult.predictions.length} predictions...`);

        // Filter for pothole detections with high confidence
        const potholeDetections = detectionResult.predictions.filter(
          pred => pred.class.toLowerCase().includes('pothole') && pred.confidence > 0.7
        );

        console.log(`🎯 Found ${potholeDetections.length} valid pothole detection(s)`);

        if (potholeDetections.length > 0) {
          const maxConfidence = Math.max(...potholeDetections.map(p => p.confidence));
          console.log(`💾 Saving pothole with confidence: ${(maxConfidence * 100).toFixed(1)}%`);

          // Save the pothole to database
          const potholeId = await detectionService.savePothole({
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            confidence: maxConfidence,
            imageBuffer,
            userId: socket.userId
          });

          if (potholeId) {
            console.log(`✅ Pothole saved with ID: ${potholeId}`);

            // Update session count
            if (socket.sessionId) {
              await detectionService.incrementSessionCount(socket.sessionId);
              console.log(`📊 Updated session ${socket.sessionId} detection count`);
            }

            // Emit to client
            socket.emit('detection:pothole', {
              potholeId,
              location: data.location,
              confidence: maxConfidence,
              detectionCount: potholeDetections.length
            });
            console.log(`📡 Sent pothole detection to client ${socketId}`);

            // Broadcast to map subscribers in the area
            this.broadcastPotholeToMap(data.location, {
              id: potholeId,
              latitude: data.location.latitude,
              longitude: data.location.longitude,
              confidenceScore: maxConfidence,
              detectedAt: new Date(),
              verified: false
            });
            console.log(`📢 Broadcasted pothole to map subscribers`);
          } else {
            console.log(`❌ Failed to save pothole to database`);
          }
        } else {
          console.log(`🚫 No valid pothole detections found (confidence threshold: 70%)`);
        }
      } else {
        console.log(`❌ No predictions returned from Roboflow`);
      }

      // Always send processing confirmation
      socket.emit('detection:processed');
      console.log(`✅ Frame processing completed for client ${socketId}`);

    } catch (error) {
      console.error(`🚨 Frame processing error for client ${socketId}:`, error);
      socket.emit('detection:error', { message: 'Processing failed' });
    }
  }

  private broadcastPotholeToMap(location: { latitude: number, longitude: number }, potholeData: unknown) {
    // Create room based on geographic area (1-degree grid)
    const room = `map_${Math.floor(location.latitude)}_${Math.floor(location.latitude)}_${Math.floor(location.longitude)}_${Math.floor(location.longitude)}`;

    this.io.to(room).emit('map:new_pothole', potholeData);
  }

  // Method to broadcast potholes to all map subscribers
  public async broadcastRecentPotholes() {
    const potholes = await detectionService.getRecentPotholes(50);
    this.io.emit('map:potholes', potholes);
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export { SocketService };