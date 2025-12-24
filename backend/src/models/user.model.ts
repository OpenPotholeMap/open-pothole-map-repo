import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  firebaseId?: string;
  email: string;
  encryptedPassword?: string;
  username: string;
  avatarUrl?: string;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  firebaseId: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  encryptedPassword: { type: String, required: false },
  username: { type: String, required: true },
  avatarUrl: { type: String, required: false },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.model<IUser>("User", UserSchema);
