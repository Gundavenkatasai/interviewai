export type ApprovalStatus =
  | "DRAFT"
  | "REVIEW"
  | "USER_EDITED"
  | "APPROVED"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED"
  | "REJECTED"
  | "CANCELLED";

export class LinkedInPolicy {
  /**
   * Check if draft can be published.
   * STRICT POLICY: Publishing is ONLY allowed from 'APPROVED' state.
   */
  public static canPublish(status: ApprovalStatus): boolean {
    return status === "APPROVED";
  }

  /**
   * Validate state transition for approval machine
   */
  public static validateTransition(currentStatus: ApprovalStatus, nextStatus: ApprovalStatus): boolean {
    if (currentStatus === nextStatus) return true; // Idempotent

    const validTransitions: Record<ApprovalStatus, ApprovalStatus[]> = {
      DRAFT: ["REVIEW", "USER_EDITED", "APPROVED", "REJECTED", "CANCELLED"],
      REVIEW: ["USER_EDITED", "APPROVED", "REJECTED", "CANCELLED"],
      USER_EDITED: ["REVIEW", "APPROVED", "REJECTED", "CANCELLED"],
      APPROVED: ["EXECUTING", "USER_EDITED", "CANCELLED"],
      EXECUTING: ["COMPLETED", "FAILED"],
      COMPLETED: [],
      FAILED: ["APPROVED", "CANCELLED"],
      REJECTED: ["DRAFT", "USER_EDITED"],
      CANCELLED: ["DRAFT"],
    };

    return validTransitions[currentStatus]?.includes(nextStatus) ?? false;
  }

  /**
   * Verify ownership of a resource to prevent IDOR vulnerabilities
   */
  public static enforceOwnership(resourceUserId: string, requestUserId: string): void {
    if (resourceUserId !== requestUserId) {
      const error: any = new Error("Access forbidden: resource does not belong to user");
      error.statusCode = 403;
      throw error;
    }
  }
}
