export class NextBestActionEngine {
  static calculateNextActions(gaps: any[]): any[] {
    const actions: any[] = [];
    
    // Sort gaps by priority
    const sortedGaps = [...gaps].sort((a, b) => b.priorityScore - a.priorityScore);
    
    // Take the top 3 gaps and map them to actions
    for (let i = 0; i < Math.min(3, sortedGaps.length); i++) {
      const gap = sortedGaps[i];
      actions.push({
        title: gap.action,
        reason: gap.title,
        priority: i === 0 ? 'URGENT' : 'HIGH',
        gapId: gap.id
      });
    }

    if (actions.length === 0) {
      actions.push({
        title: 'Review Jobs',
        reason: 'Keep your pipeline active',
        priority: 'MEDIUM',
        gapId: 'none'
      });
    }

    return actions;
  }
}
