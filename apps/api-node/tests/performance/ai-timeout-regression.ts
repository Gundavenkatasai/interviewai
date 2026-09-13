import { OptimizationService } from "../../src/modules/resume/optimization/optimization.service";
import { ResumeParser } from "../../src/modules/resume/resume.parser";
import { AtsEvaluator } from "../../src/modules/resume/ats-engine/ats.evaluator";
import fs from "fs";
import path from "path";

const PDF_PATH = path.join(__dirname, "../../uploads/51aa0bcf-856b-45e8-8795-07b3a7c130c8/venkatasai_cv.pdf");

export async function runTimeoutRegression() {
  console.log("Starting 20-run Optimization Timeout Regression Test");

  if (!fs.existsSync(PDF_PATH)) {
    console.error("Test PDF not found at:", PDF_PATH);
    return;
  }

  const pdfBuf = fs.readFileSync(PDF_PATH);
  const extracted = await ResumeParser.extractRawText(pdfBuf, "pdf");
  
  const atsReport = AtsEvaluator.analyze({
    resumeText: extracted.text,
    roleName: "Full Stack Developer",
    roleCategory: "software-engineering"
  });

  const times: number[] = [];
  let timeouts = 0;
  let failures = 0;

  for (let i = 1; i <= 20; i++) {
    console.log(`[Run ${i}/20] Executing optimization...`);
    const start = Date.now();
    try {
      // Set an internal abort controller if supported or track time
      const plan = await OptimizationService.generatePlan({
        resumeId: "venkata-cv",
        resumeText: extracted.text,
        atsReport,
        targetRole: "Full Stack Developer"
      });
      const duration = Date.now() - start;
      times.push(duration);
      console.log(`[Run ${i}/20] Success in ${duration}ms. Proposals: ${plan.proposals.length}`);
    } catch (err: any) {
      const duration = Date.now() - start;
      if (duration > 60000 || err.message?.includes('timeout')) {
        timeouts++;
        console.error(`[Run ${i}/20] Timeout after ${duration}ms`);
      } else {
        failures++;
        console.error(`[Run ${i}/20] Failure after ${duration}ms: ${err.message}`);
      }
    }
  }

  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.50)] || 0;
  const p95 = times[Math.floor(times.length * 0.95)] || 0;
  const max = times[times.length - 1] || 0;

  console.log("\n=== Timeout Regression Results ===");
  console.log(`Total Runs: 20`);
  console.log(`Timeouts: ${timeouts}`);
  console.log(`Failures: ${failures}`);
  console.log(`P50: ${p50}ms`);
  console.log(`P95: ${p95}ms`);
  console.log(`Max: ${max}ms`);
}

if (require.main === module) {
  runTimeoutRegression().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
