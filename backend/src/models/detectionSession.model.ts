import mongoose, { Document } from "mongoose";

export interface IDetectionSession extends Document {
  userId?: mongoose.Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  totalDetections: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DetectionSessionSchema = new mongoose.Schema<IDetectionSession>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  endedAt: {
    type: Date,
    required: false
  },
  totalDetections: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
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

// Add index for active sessions
DetectionSessionSchema.index({ isActive: 1, startedAt: -1 });

// Add index for user sessions
DetectionSessionSchema.index({ userId: 1, startedAt: -1 });

export const DetectionSessionModel = mongoose.model<IDetectionSession>("DetectionSession", DetectionSessionSchema);