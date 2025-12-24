import axios from "axios";
import sharp from "sharp";
import { PotholeModel, DetectionSessionModel } from "@/models/index.js";
import type { IPothole } from "@/models/pothole.model.js";
import { cloudStorageService } from "./cloudStorageService.js";
import {
  ROBOFLOW_API_KEY,
  ROBOFLOW_PROJECT_ID,
  ROBOFLOW_MODEL_VERSION,
} from "@/config/envs.js";

export interface DetectionResult {
  predictions: Array<{
    class: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export interface PotholeDetection {
  latitude: number;
  longitude: number;
  confidence: number;
  imageBuffer: Buffer;
  userId?: string;
}

class DetectionService {
  private readonly CONFIDENCE_THRESHOLD = 0.2;
  private readonly CLUSTERING_DISTANCE = 10; // meters

  constructor() {
    this.initializeGCS();
  }

  private async initializeGCS(): Promise<void> {
    try {
      const isAccessible = await cloudStorageService.checkBucketAccess();
      if (isAccessible) {
        console.log("Google Cloud Storage initialized successfully");
      } else {
        console.warn(
          "Google Cloud Storage bucket access failed - images will use placeholder URLs"
        );
      }
    } catch (error) {
      console.error("GCS initialization error:", error);
      console.warn("Continuing without GCS - images will use placeholder URLs");
    }
  }

  async processFrame(imageBuffer: Buffer): Promise<DetectionResult | null> {
    try {
      console.log("🔍 Starting Roboflow detection...");

      // Compress and resize image for faster processing
      const processedImage = await sharp(imageBuffer)
        .resize(640, 480, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();

      console.log("Image processed: ${processedImage.length} bytes");

      // Convert to base64 for Roboflow API
      const base64Image = processedImage.toString("base64");
      console.log(`Base64 image length: ${base64Image.length} characters`);

      const roboflowUrl = `https://detect.roboflow.com/${ROBOFLOW_PROJECT_ID}/${ROBOFLOW_MODEL_VERSION}`;

      console.log("Roboflow API Request:");
      console.log(`   URL: ${roboflowUrl}`);
      console.log(`   API Key: ${ROBOFLOW_API_KEY.substring(0, 8)}...`);
      console.log(`   Project ID: ${ROBOFLOW_PROJECT_ID}`);
      console.log(`   Model Version: ${ROBOFLOW_MODEL_VERSION}`);
      console.log(`Confidence Threshold: ${this.CONFIDENCE_THRESHOLD * 100}%`);

      const startTime = Date.now();

      const response = await axios.post(roboflowUrl, base64Image, {
        params: {
          api_key: ROBOFLOW_API_KEY,
          confidence: this.CONFIDENCE_THRESHOLD * 100, // Roboflow expects percentage
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10000, // 10 second timeout
      });

      const endTime = Date.now();
      console.log(`API Response time: ${endTime - startTime}ms`);

      console.log("Roboflow API Response:");
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Response data:`, JSON.stringify(response.data, null, 2));

      if (response.data.predictions && response.data.predictions.length > 0) {
        console.log(`Found ${response.data.predictions.length} predictions:`);
        response.data.predictions.forEach(
          (
            pred: {
              class: string;
              confidence: number;
              x: number;
              y: number;
              width: number;
              height: number;
            },
            index: number
          ) => {
            console.log(
              `   [${index + 1}] Class: ${pred.class}, Confidence: ${(
                pred.confidence * 100
              ).toFixed(1)}%, Position: (${pred.x}, ${pred.y}), Size: ${
                pred.width
              }x${pred.height}`
            );
          }
        );
      } else {
        console.log("No predictions found in response");
      }

      return response.data;
    } catch (error: unknown) {
      const err = error as {
        response?: {
          status: number;
          statusText: string;
          data: unknown;
          headers: unknown;
        };
        request?: unknown;
        config?: { url?: string; method?: string; timeout?: number };
        message?: string;
      };
      console.error("Roboflow API error:");
      if (err.response) {
        console.error(
          `   Status: ${err.response.status} ${err.response.statusText}`
        );
        console.error(`   Response data:`, err.response.data);
        console.error(`   Headers:`, err.response.headers);
      } else if (err.request) {
        console.error("   No response received from server");
        console.error(`   Request config:`, {
          url: err.config?.url,
          method: err.config?.method,
          timeout: err.config?.timeout,
        });
      } else {
        console.error(`   Error message: ${err.message}`);
      }
      console.error(`   Full error:`, error);
      return null;
    }
  }

  async findNearbyPothole(
    latitude: number,
    longitude: number
  ): Promise<IPothole | null> {
    try {
      // Use MongoDB geospatial query to find nearby potholes
      const nearbyPotholes = await PotholeModel.find({
        latitude: {
          $gte: latitude - 0.0001, // ~11m at equator
          $lte: latitude + 0.0001,
        },
        longitude: {
          $gte: longitude - 0.0001,
          $lte: longitude + 0.0001,
        },
      })
        .sort({ detectedAt: -1 })
        .limit(1);

      return nearbyPotholes.length > 0 ? nearbyPotholes[0] : null;
    } catch (error) {
      console.error("Nearby pothole check error:", error);
      return null;
    }
  }

  async savePothole(detection: PotholeDetection): Promise<string | null> {
    try {
      // Check for nearby potholes first
      const nearbyPothole = await this.findNearbyPothole(
        detection.latitude,
        detection.longitude
      );

      if (nearbyPothole) {
        console.log("Uploading additional image for existing pothole...");
        const fileName = cloudStorageService.generateFileName(
          detection.latitude,
          detection.longitude,
          detection.confidence
        );

        let newImageUrl: string;
        try {
          newImageUrl = await cloudStorageService.uploadImage(
            detection.imageBuffer,
            fileName
          );
          console.log(`✅ Additional image uploaded: ${newImageUrl}`);
        } catch (uploadError) {
          console.error("Failed to upload additional image:", uploadError);
          // Use placeholder if upload fails
          newImageUrl = `placeholder_${Date.now()}.jpg`;
        }

        // Update existing pothole with new detection and add image to array
        const updatedPothole = await PotholeModel.findByIdAndUpdate(
          nearbyPothole._id,
          {
            $inc: { detectionCount: 1 },
            $push: { images: newImageUrl },
            detectedAt: new Date(),
            confidenceScore: Math.max(
              nearbyPothole.confidenceScore,
              detection.confidence
            ),
            updatedAt: new Date(),
          },
          { new: true }
        );

        console.log(`Updated existing pothole: ${updatedPothole?._id}`);
        console.log(
          `   New detection count: ${updatedPothole?.detectionCount}`
        );
        console.log(
          `   Updated confidence: ${
            (updatedPothole?.confidenceScore || 0) * 100
          }%`
        );
        console.log("Added image: ${newImageUrl}");
        console.log("Total images: ${updatedPothole?.images?.length || 0}");
        return updatedPothole?._id?.toString() || null;
      }

      // Upload image to Google Cloud Storage
      console.log("Uploading pothole image to Google Cloud Storage...");
      const fileName = cloudStorageService.generateFileName(
        detection.latitude,
        detection.longitude,
        detection.confidence
      );

      let imageUrl: string;
      try {
        imageUrl = await cloudStorageService.uploadImage(
          detection.imageBuffer,
          fileName
        );
        console.log(`✅ Image uploaded successfully: ${imageUrl}`);
      } catch (uploadError) {
        console.error(
          "Failed to upload image to GCS, using placeholder:",
          uploadError
        );
        imageUrl = `placeholder_${Date.now()}.jpg`;
      }

      const pothole = new PotholeModel({
        latitude: detection.latitude,
        longitude: detection.longitude,
        confidenceScore: detection.confidence,
        images: [imageUrl],
        userId: detection.userId,
        detectedAt: new Date(),
        verified: false,
        detectionCount: 1,
      });

      const savedPothole = await pothole.save();
      console.log(`New pothole saved to database: ${savedPothole._id}`);
      console.log(`Location: ${detection.latitude}, ${detection.longitude}`);
      console.log(`Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
      console.log(`Images: ${JSON.stringify([imageUrl])}`);

      return String(savedPothole._id);
    } catch (error) {
      console.error("Save pothole error:", error);
      return null;
    }
  }

  async startDetectionSession(userId?: string): Promise<string | null> {
    try {
      if (userId) {
        await DetectionSessionModel.updateMany(
          { userId, isActive: true },
          {
            isActive: false,
            endedAt: new Date(),
            updatedAt: new Date(),
          }
        );
      }

      const session = new DetectionSessionModel({
        userId,
        startedAt: new Date(),
        isActive: true,
        totalDetections: 0,
      });

      const savedSession = await session.save();
      return String(savedSession._id);
    } catch (error) {
      console.error("Start session error:", error);
      return null;
    }
  }

  async endDetectionSession(sessionId: string): Promise<boolean> {
    try {
      await DetectionSessionModel.findByIdAndUpdate(sessionId, {
        isActive: false,
        endedAt: new Date(),
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error("End session error:", error);
      return false;
    }
  }

  async incrementSessionCount(sessionId: string): Promise<boolean> {
    try {
      await DetectionSessionModel.findByIdAndUpdate(sessionId, {
        $inc: { totalDetections: 1 },
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error("Increment session count error:", error);
      return false;
    }
  }

  async getRecentPotholes(limit: number = 100): Promise<IPothole[]> {
    try {
      return (await PotholeModel.find({})
        .sort({ detectedAt: -1 })
        .limit(limit)
        .select(
          "latitude longitude confidenceScore detectedAt verified detectionCount images"
        )
        .lean()) as unknown as IPothole[];
    } catch (error) {
      console.error("Get potholes error:", error);
      return [];
    }
  }
}

export const detectionService = new DetectionService();
