import { Request, Response } from "express";
import { detectionService } from "@/services/detectionService.js";
import { cloudStorageService } from "@/services/cloudStorageService.js";

export const DebugController = {
  testRoboflow: async (_req: Request, res: Response) => {
    try {
      console.log("🧪 Testing Roboflow API integration...");

      // Create a simple test image (1x1 pixel JPEG)
      const testImageBase64 =
        "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A";
      const testImageBuffer = Buffer.from(testImageBase64, "base64");

      // Process the test image
      const result = await detectionService.processFrame(testImageBuffer);

      res.json({
        success: true,
        message: "Roboflow API test completed",
        roboflowResponse: result,
        hasValidResponse: result !== null,
        predictionCount: result?.predictions?.length || 0,
      });
    } catch (error) {
      console.error("🚨 Roboflow test error:", error);
      res.status(500).json({
        success: false,
        message: "Roboflow API test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  testGcs: async (_req: Request, res: Response) => {
    try {
      console.log("🧪 Testing Google Cloud Storage integration...");

      // Check bucket access
      const isAccessible = await cloudStorageService.checkBucketAccess();

      if (!isAccessible) {
        res.status(500).json({
          success: false,
          message: "GCS bucket is not accessible",
        });
        return;
      }

      // Test upload with a small test file
      const testContent = Buffer.from("OpenPotholeMap GCS Test", "utf8");
      const fileName = cloudStorageService.generateFileName(
        37.7749,
        -122.4194,
        0.95
      );

      const uploadedUrl = await cloudStorageService.uploadImage(
        testContent,
        fileName
      );

      res.json({
        success: true,
        message: "GCS integration test completed",
        uploadedUrl,
        fileName,
      });
    } catch (error) {
      console.error("🚨 GCS test error:", error);
      res.status(500).json({
        success: false,
        message: "GCS integration test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  testDetectionFlow: async (_req: Request, res: Response) => {
    try {
      console.log("🧪 Testing complete pothole detection flow...");

      const testLocation = {
        latitude: 37.7749,
        longitude: -122.4194,
      };

      // Create a test image
      const testImageBase64 =
        "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A";
      const testImageBuffer = Buffer.from(testImageBase64, "base64");

      // Test the detection flow
      const potholeId = await detectionService.savePothole({
        latitude: testLocation.latitude,
        longitude: testLocation.longitude,
        confidence: 0.85,
        imageBuffer: testImageBuffer,
        userId: "test-user",
      });

      res.json({
        success: true,
        message: "Detection flow test completed",
        potholeId,
        testLocation,
      });
    } catch (error) {
      console.error("🚨 Detection flow test error:", error);
      res.status(500).json({
        success: false,
        message: "Detection flow test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
