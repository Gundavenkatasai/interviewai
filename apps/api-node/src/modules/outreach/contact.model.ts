import mongoose, { Schema } from "mongoose";
import { randomUUID } from "crypto";

export type RelationshipType = 
  | "RECRUITER"
  | "HIRING_MANAGER"
  | "INTERVIEWER"
  | "REFERRAL"
  | "TEAM_MEMBER"
  | "RECRUITING_COORDINATOR"
  | "ALUMNI"
  | "PROFESSIONAL_CONTACT"
  | "UNKNOWN";

export type VerificationStatus = "VERIFIED" | "UNVERIFIED" | "USER_PROVIDED";

export interface ICareerContact {
  _id: string;
  userId: string;
  
  firstName?: string;
  lastName?: string;
  name?: string;

  title?: string;
  company?: string;

  email?: string;
  linkedinUrl?: string;

  relationshipType: RelationshipType;
  source: string; // e.g., APPLICATION, INTERVIEW, USER_PROVIDED
  verificationStatus: VerificationStatus;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const careerContactSchema = new Schema<ICareerContact>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    
    firstName: { type: String },
    lastName: { type: String },
    name: { type: String },

    title: { type: String },
    company: { type: String, index: true },

    email: { type: String },
    linkedinUrl: { type: String },

    relationshipType: { type: String, default: "UNKNOWN" },
    source: { type: String, required: true },
    verificationStatus: { type: String, default: "UNVERIFIED" },
    confidence: { type: String, default: "UNKNOWN" },

    notes: { type: String },
  },
  { timestamps: true }
);

careerContactSchema.index({ userId: 1, company: 1 });
careerContactSchema.index({ userId: 1, email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true, $type: "string", $ne: "" } } });

export const CareerContact = mongoose.model<ICareerContact>("CareerContact", careerContactSchema);
