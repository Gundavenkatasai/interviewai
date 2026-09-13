export interface IOptimizationProposal {
  id: string;
  section: string;
  targetId: string;
  roleIndex?: number;
  bulletIndex?: number;
  originalText: string;
  proposedText: string;
  reason: string;
  evidence: string[];
  issueIds: string[];
  unsupportedClaims: string[];
  risk: "low" | "medium" | "high";
}

export interface IOptimizationPlan {
  resumeId: string;
  targetRole: string;
  proposals: IOptimizationProposal[];
  atsIssuesAddressed: number;
  verifiedSkillsUsed: string[];
  createdAt: string;
}

export interface IApplyOptimizationsRequest {
  resumeId: string;
  acceptedProposalIds: string[];
  editedProposals?: Record<string, string>; // proposalId -> userEditedText
  targetRole?: string;
  newResumeName?: string;
}

export interface IBeforeAfterReport {
  resumeId: string;
  fileName: string;
  beforeScore: number;
  afterScore: number;
  scoreDelta: number;
  categoryDeltas: Record<string, { before: number; after: number; delta: number }>;
  changesApplied: {
    id: string;
    section: string;
    originalText: string;
    appliedText: string;
    reason: string;
    issueFixed: string;
  }[];
  explanation: string[];
  healthBefore: string;
  healthAfter: string;
  passProbabilityBefore: number;
  passProbabilityAfter: number;
  downloadUrl: string;
}
