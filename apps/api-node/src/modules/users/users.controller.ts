import { FastifyRequest, FastifyReply } from "fastify";
import { User } from "./users.model";
import { Profile } from "../profile/profile.model";
import { Resume, ResumeVersion } from "../resume/resume.model";
import { InterviewSession } from "../interview/interview.model";
import { SavedJob } from "../jobs/jobs.model";
import { ResumeTailoringRun } from "../resume/tailoring/tailoring.model";
import { InterviewIntelligence } from "../interview-intelligence/intelligence.model";
import { InterviewStory } from "../story-bank/story.model";
import { InterviewDebrief } from "../interview-debrief/debrief.model";
import { ResumeSecurity } from "../resume/resume.security";

export class UsersController {
  /**
   * DELETE /api/users/me/data
   * Permanently purges all user-associated data and the user account itself
   */
  public static async deleteUserData(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = ResumeSecurity.getUserId(req);
      if (!userId) {
        return reply.status(401).send({ success: false, message: "Unauthorized" });
      }

      await Promise.allSettled([
        Profile.deleteMany({ userId }),
        Resume.deleteMany({ userId }),
        ResumeVersion.deleteMany({ userId }),
        InterviewSession.deleteMany({ userId }),
        SavedJob.deleteMany({ userId }),
        ResumeTailoringRun.deleteMany({ userId }),
        InterviewIntelligence.deleteMany({ userId }),
        InterviewStory.deleteMany({ userId }),
        InterviewDebrief.deleteMany({ userId }),
        User.deleteOne({ _id: userId }),
      ]);

      reply.clearCookie("token", { path: "/" });

      return reply.status(200).send({
        success: true,
        message: "All user data and account records permanently purged.",
      });
    } catch (err: any) {
      console.error("[UsersController] deleteUserData error:", err);
      return reply.status(500).send({ success: false, message: err.message || "Failed to delete user data" });
    }
  }
}
