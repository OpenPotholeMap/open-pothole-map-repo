import mongoose, { Document } from "mongoose";

export interface IConfirmation extends Document {
  potholeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'still_there' | 'not_there';
  confirmedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConfirmationSchema = new mongoose.Schema<IConfirmation>({
  potholeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pothole',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['still_there', 'not_there'],
    required: true
  },
  confirmedAt: {
    type: Date,
    default: Date.now
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

// Ensure a user can only confirm a pothole once
ConfirmationSchema.index({ potholeId: 1, userId: 1 }, { unique: true });

export const ConfirmationModel = mongoose.model<IConfirmation>("Confirmation", ConfirmationSchema);