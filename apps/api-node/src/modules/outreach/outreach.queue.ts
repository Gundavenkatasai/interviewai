import { FollowUpEngine } from "./followup.engine";

// In a real BullMQ setup, we would define a Worker here.
// Because the current infrastructure relies on a Mongoose lock/polling pattern,
// we will expose a polling loop that transitions due tasks.

let isRunning = false;
let timer: NodeJS.Timeout | null = null;

export class OutreachQueue {

  static start() {
    if (isRunning) return;
    isRunning = true;
    
    // Poll every 1 minute
    timer = setInterval(async () => {
      try {
        await FollowUpEngine.transitionDueTasks();
      } catch (err) {
        console.error("OutreachQueue error:", err);
      }
    }, 60000);
    
    // Run once immediately
    FollowUpEngine.transitionDueTasks().catch(console.error);
    console.log("OutreachQueue started.");
  }

  static stop() {
    if (timer) clearInterval(timer);
    isRunning = false;
    console.log("OutreachQueue stopped.");
  }
}
