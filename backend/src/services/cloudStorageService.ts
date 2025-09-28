import { Storage } from '@google-cloud/storage';
import { GOOGLE_CLOUD_BUCKET, GOOGLE_APPLICATION_CREDENTIALS } from '@/config/envs.js';

class CloudStorageService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    // Initialize Google Cloud Storage client
    this.storage = new Storage({
      keyFilename: GOOGLE_APPLICATION_CREDENTIALS, // Optional: uses default credentials if not specified
    });
    this.bucketName = GOOGLE_CLOUD_BUCKET;
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
          contentType: 'image/jpeg',
          cacheControl: 'public, max-age=31536000', // Cache for 1 year
        },
        public: true, // Make the file publicly accessible
        resumable: false, // Use simple upload for small files
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
          console.error('🚨 GCS upload error:', error);
          reject(error);
        });

        stream.on('finish', async () => {
          try {
            // Make the file public
            await file.makePublic();

            // Generate the public URL
            const publicUrl = `https://storage.googleapis.com/${this.bucketName}/potholes/${fileName}`;

            console.log(`✅ GCS upload successful!`);
            console.log(`   Public URL: ${publicUrl}`);

            resolve(publicUrl);
          } catch (error) {
            console.error('🚨 Error making file public:', error);
            reject(error);
          }
        });

        // Write the buffer to the stream
        stream.end(imageBuffer);
      });
    } catch (error) {
      console.error('🚨 GCS upload failed:', error);
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
  generateFileName(latitude: number, longitude: number, confidence: number): string {
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
      console.error('🚨 Error deleting image:', error);
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
      console.error('🚨 Bucket access check failed:', error);
      return false;
    }
  }
}

export const cloudStorageService = new CloudStorageService();