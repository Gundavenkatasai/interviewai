import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export interface IUser {
  _id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
  isActive: boolean;
  isAdmin: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    _id: { type: String, default: () => randomUUID() },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    avatarUrl: { type: String },
    role: { type: String, default: "user" },
    isActive: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
