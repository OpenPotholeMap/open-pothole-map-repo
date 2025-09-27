import mongoose, { Document } from "mongoose";

export interface IPothole extends Document {
  latitude: number;
  longitude: number;
  detectedAt: Date;
  confidenceScore: number;
  imageUrl: string;
  userId?: mongoose.Types.ObjectId;
  verified: boolean;
  detectionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PotholeSchema = new mongoose.Schema<IPothole>({
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  detectedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  confidenceScore: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  imageUrl: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  detectionCount: {
    type: Number,
    default: 1,
    min: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
});

// Add geospatial index for location-based queries
PotholeSchema.index({ latitude: 1, longitude: 1 });

// Add compound index for efficient nearby queries
PotholeSchema.index({
  latitude: 1,
  longitude: 1,
  detectedAt: -1
});

export const PotholeModel = mongoose.model<IPothole>("Pothole", PotholeSchema);