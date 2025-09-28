import { Storage } from "@google-cloud/storage";
import {
  GOOGLE_CLOUD_BUCKET,
  GOOGLE_APPLICATION_CREDENTIALS,
} from "@/config/envs.js";

class CloudStorageService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS_BASE64 env var");
    }

    // Decode JSON from base64
    const decoded = Buffer.from(
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
      "base64"
    ).toString("utf8");

    const credentials = JSON.parse(decoded);

    // Fix private_key line breaks (important!)
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");

    // Initialize client using credentials object
    this.storage = new Storage({ credentials });
    this.bucketName = process.env.GOOGLE_CLOUD_BUCKET!;
  }

  getBucket() {
    return this.storage.bucket(this.bucketName);
  }

  /**
   * Upload image buffer to Google Cloud Storage
   * @param imageBuffer - The image data as Buffer
   * @param fileName - The desired filename (without path)
   * @returns Promise<string> - The public URL of the uploaded image
   */
  async uploadImage(imageBuffer: Buffer, fileName: string): Promise<string> {
    try {
      console.log(`☁️  Starting GCS upload for file: ${fileName}`);
      console.log(`   Bucket: ${this.bucketName}`);
      console.log(`   File size: ${imageBuffer.length} bytes`);

      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(`potholes/${fileName}`);

      // Create a write stream to upload the buffer
      const stream = file.createWriteStream({
        metadata: {
          contentType: "image/jpeg",
          cacheControl: "public, max-age=31536000", // Cache for 1 year
        },
        resumable: false, // Use simple upload for small files
      });

      return new Promise((resolve, reject) => {
        stream.on("error", (error) => {
          console.error("🚨 GCS upload error:", error);
          reject(error);
        });

        stream.on("finish", async () => {
          try {
            // Generate a signed URL for public access (valid for 1 year)
            const [signedUrl] = await file.getSignedUrl({
              action: "read",
              expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
            });

            console.log(`✅ GCS upload successful!`);
            console.log(`   Signed URL: ${signedUrl.substring(0, 100)}...`);

            resolve(signedUrl);
          } catch (error) {
            console.error("🚨 Error generating signed URL:", error);
            reject(error);
          }
        });

        // Write the buffer to the stream
        stream.end(imageBuffer);
      });
    } catch (error) {
      console.error("🚨 GCS upload failed:", error);
      throw error;
    }
  }

  /**
   * Generate a unique filename for the pothole image
   * @param latitude - Latitude of the pothole
   * @param longitude - Longitude of the pothole
   * @param confidence - Detection confidence score
   * @returns string - Unique filename
   */
  generateFileName(
    latitude: number,
    longitude: number,
    confidence: number
  ): string {
    const timestamp = Date.now();
    const lat = latitude.toFixed(6);
    const lng = longitude.toFixed(6);
    const conf = Math.round(confidence * 100);

    return `pothole_${lat}_${lng}_${conf}_${timestamp}.jpg`;
  }

  /**
   * Delete an image from Google Cloud Storage
   * @param fileName - The filename to delete (including path)
   * @returns Promise<boolean> - Success status
   */
  async deleteImage(fileName: string): Promise<boolean> {
    try {
      console.log(`🗑️  Deleting image from GCS: ${fileName}`);

      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      await file.delete();

      console.log(`✅ Image deleted successfully: ${fileName}`);
      return true;
    } catch (error) {
      console.error("🚨 Error deleting image:", error);
      return false;
    }
  }

  /**
   * Check if the bucket exists and is accessible
   * @returns Promise<boolean> - Bucket accessibility status
   */
  async checkBucketAccess(): Promise<boolean> {
    try {
      console.log(`🔍 Checking GCS bucket access: ${this.bucketName}`);

      const bucket = this.storage.bucket(this.bucketName);
      const [exists] = await bucket.exists();

      if (!exists) {
        console.error(`❌ Bucket does not exist: ${this.bucketName}`);
        return false;
      }

      console.log(`✅ Bucket access confirmed: ${this.bucketName}`);
      return true;
    } catch (error) {
      console.error("🚨 Bucket access check failed:", error);
      return false;
    }
  }
}

export const cloudStorageService = new CloudStorageService();
