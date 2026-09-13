import { InterviewWeakness } from "../interview-debrief/debrief.model";
import { JobApplication } from "../applications/applications.model";
import { FollowUpTask } from "../outreach/followup.model";

export class CareerGapEngine {
  
  static async calculateGaps(userId: string, start: Date, end: Date) {
    const gaps: any[] = [];
    
    // 1. Interview Weakness Gaps (Layer C)
    const weaknesses = await InterviewWeakness.find({
      userId,
      status: { $in: ['NEW', 'RECURRING'] },
      updatedAt: { $gte: start, $lte: end }
    });

    const weaknessCounts = new Map<string, any>();
    for (const w of weaknesses) {
      if (!weaknessCounts.has(w.topic)) {
        weaknessCounts.set(w.topic, {
          topic: w.topic,
          occurrences: 0,
          evidenceIds: [],
          status: w.status
        });
      }
      const record = weaknessCounts.get(w.topic);
      record.occurrences += 1;
      record.evidenceIds.push(w._id);
    }

    for (const w of Array.from(weaknessCounts.values())) {
      let confidence = 'LOW_CONFIDENCE';
      let priorityScore = 0;
      
      if (w.occurrences >= 3) {
        confidence = 'HIGHER_CONFIDENCE';
        priorityScore = 90;
      } else if (w.occurrences === 2) {
        confidence = 'MEDIUM_CONFIDENCE';
        priorityScore = 60;
      } else {
        priorityScore = 30;
      }

      gaps.push({
        id: `gap-interview-${w.topic.replace(/\s+/g, '-').toLowerCase()}`,
        title: `Recurring Weakness: ${w.topic}`,
        type: 'INTERVIEW_GAP',
        description: `This weakness was observed in ${w.occurrences} interviews.`,
        evidenceCount: w.occurrences,
        evidenceIds: w.evidenceIds,
        confidence,
        priorityScore,
        action: 'Practice Interview'
      });
    }

    // 2. Process Gaps (Follow-ups)
    const overdueFollowUps = await FollowUpTask.countDocuments({
      userId,
      status: 'DUE',
      dueAt: { $lte: new Date() }
    });

    if (overdueFollowUps > 0) {
      gaps.push({
        id: `gap-process-followup`,
        title: `Overdue Follow-ups`,
        type: 'PROCESS_GAP',
        description: `You have ${overdueFollowUps} follow-ups that are overdue.`,
        evidenceCount: overdueFollowUps,
        evidenceIds: [],
        confidence: 'HIGHER_CONFIDENCE',
        priorityScore: overdueFollowUps >= 3 ? 85 : 50,
        action: 'Open Follow-Up Center'
      });
    }

    // 3. Strategy Gaps (Low application volume or low conversion)
    const apps = await JobApplication.countDocuments({
      userId,
      createdAt: { $gte: start, $lte: end }
    });

    if (apps < 3) {
      gaps.push({
        id: `gap-strategy-volume`,
        title: `Insufficient Application Volume`,
        type: 'STRATEGY_GAP',
        description: `You have only recorded ${apps} applications in this period. Analytics require more data.`,
        evidenceCount: apps,
        evidenceIds: [],
        confidence: 'HIGHER_CONFIDENCE',
        priorityScore: 70,
        action: 'Review Jobs'
      });
    }

    // Sort by Priority
    return gaps.sort((a, b) => b.priorityScore - a.priorityScore);
  }
}
