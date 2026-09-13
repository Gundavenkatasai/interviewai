import mongoose, { Schema, Document } from "mongoose";

export const provenanceSchema = new Schema({
  sourceType: { 
    type: String, 
    enum: ["USER_ENTERED", "RESUME", "LINKEDIN", "GITHUB", "PORTFOLIO", "INTERVIEW", "IMPORT", "AI_SUGGESTED", "SYSTEM_DERIVED"], 
    required: true, 
    default: "USER_ENTERED" 
  },
  sourceId: { type: String }, 
  confidence: { type: Number, default: 1.0 }, 
  status: { 
    type: String, 
    enum: ["VERIFIED", "USER_PROVIDED", "IMPORTED", "DERIVED", "AI_SUGGESTED", "UNVERIFIED", "REJECTED", "CONFLICT"], 
    required: true, 
    default: "UNVERIFIED" 
  },
  extractedAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date },
}, { _id: false });

export const conflictSchema = new Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  field: { type: String, required: true },
  description: { type: String },
  sourceA: { type: Schema.Types.Mixed },
  sourceB: { type: Schema.Types.Mixed },
  provenanceA: { type: provenanceSchema },
  provenanceB: { type: provenanceSchema },
  status: { type: String, enum: ["PENDING_REVIEW", "RESOLVED", "REJECTED"], default: "PENDING_REVIEW" },
  resolution: { type: String }
}, { timestamps: true });

const factHistorySchema = new Schema({
  field: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  reason: { type: String },
  changedBy: { type: String } // e.g. "USER", "SYSTEM", "IMPORT"
}, { timestamps: true });

export interface IProfile {
  userId: string;
  personal: {
    name?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    bio?: string;
    location?: string;
  };
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    provenance: any;
    verified_status: string; // legacy support
  }>;
  experience: Array<{
    id: string;
    company: string;
    title: string;
    role?: string;
    location?: string;
    current?: boolean;
    bullets?: string[];
    startDate?: string;
    endDate?: string;
    description?: string;
    achievements?: string[];
    provenance: any;
    verified_status: string; // legacy support
  }>;
  skills: Array<{
    id: string;
    name: string;
    level?: string;
    category?: string;
    provenance: any;
    verified_status: string; // legacy support
    source: string; // legacy support
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    url?: string;
    technologies?: string[];
    bullets?: string[];
    provenance: any;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date?: string;
    provenance: any;
  }>;
  achievements: any[];
  preferredRoles: string[];
  preferredLocations: string[];
  preferredSalary: Record<string, any>;
  preferredWorkMode: string[];
  employmentPreferences: string[];
  workAuthorization: string;
  linkedin: string;
  github: string;
  portfolio: string;
  careerGoals: {
    targetDirections: string[];
    hardConstraints: string[];
    preferences: string[];
  };
  interviewStories: Array<any>;
  conflicts: any[];
  factHistory: any[];
  updatedAt: Date;
}

const profileSchema = new Schema<IProfile>(
  {
    userId: { type: String, ref: "User", required: true, unique: true, index: true },
    personal: { 
      name: { type: String },
      fullName: { type: String },
      firstName: { type: String },
      lastName: { type: String },
      email: { type: String },
      phone: { type: String },
      bio: { type: String },
      location: { type: String }
    },
    location: {
      city: { type: String },
      state: { type: String },
      country: { type: String }
    },
    education: [{
      id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
      institution: { type: String, required: true },
      degree: { type: String },
      field: { type: String },
      startDate: { type: String },
      endDate: { type: String },
      provenance: { type: provenanceSchema, default: () => ({ sourceType: "USER_ENTERED", status: "VERIFIED" }) },
      verified_status: { type: String, enum: ["VERIFIED", "UNVERIFIED", "UNKNOWN"], default: "UNVERIFIED" } // Legacy
    }],
    experience: [{
      id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
      company: { type: String, required: true },
      title: { type: String, required: true },
      role: { type: String },
      location: { type: String },
      current: { type: Boolean },
      bullets: [{ type: String }],
      startDate: { type: String },
      endDate: { type: String },
      description: { type: String },
      achievements: [{ type: String }],
      provenance: { type: provenanceSchema, default: () => ({ sourceType: "USER_ENTERED", status: "VERIFIED" }) },
      verified_status: { type: String, enum: ["VERIFIED", "UNVERIFIED", "UNKNOWN"], default: "UNVERIFIED" } // Legacy
    }],
    skills: [{
      id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
      name: { type: String, required: true },
      level: { type: String },
      category: { type: String },
      provenance: { type: provenanceSchema, default: () => ({ sourceType: "USER_ENTERED", status: "VERIFIED" }) },
      verified_status: { type: String, enum: ["VERIFIED", "UNVERIFIED", "UNKNOWN"], default: "UNVERIFIED" }, // Legacy
      source: { type: String, default: "USER_INPUT" } // Legacy
    }],
    projects: [{
      id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
      name: { type: String },
      description: { type: String },
      url: { type: String },
      technologies: [{ type: String }],
      provenance: { type: provenanceSchema, default: () => ({ sourceType: "USER_ENTERED", status: "VERIFIED" }) }
    }],
    certifications: [{
      id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
      name: { type: String },
      issuer: { type: String },
      date: { type: String },
      provenance: { type: provenanceSchema, default: () => ({ sourceType: "USER_ENTERED", status: "VERIFIED" }) }
    }],
    achievements: { type: [Object], default: [] },
    preferredRoles: { type: [String], default: [] },
    preferredLocations: { type: [String], default: [] },
    preferredSalary: { type: Schema.Types.Mixed, default: {} },
    preferredWorkMode: { type: [String], default: [] },
    employmentPreferences: { type: [String], default: [] },
    workAuthorization: { type: String, default: "UNKNOWN" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    careerGoals: {
      targetDirections: { type: [String], default: [] },
      hardConstraints: { type: [String], default: [] },
      preferences: { type: [String], default: [] }
    },
    interviewStories: [{
      situation: { type: String },
      task: { type: String },
      action: { type: String },
      result: { type: String },
      reflection: { type: String },
      tags: [{ type: String }]
    }],
    conflicts: { type: [Object], default: [] },
    factHistory: { type: [Object], default: [] }
  },
  { timestamps: true }
);

// Indexes for intelligent querying
profileSchema.index({ "skills.name": 1 });
profileSchema.index({ "experience.company": 1 });
profileSchema.index({ "conflicts.status": 1 });

export const Profile = mongoose.model<IProfile>("Profile", profileSchema);
