import React from "react";
import { Activity, Clock, ShieldCheck, CheckCircle2, GitBranch, Cpu, Terminal } from "lucide-react";

export const ActivityTab: React.FC = () => {
  const activities = [
    { id: 1, action: "LinkedIn Post Drafted", detail: "Formula F7: Odd-Precision Ledger ('We cut latency by 35%')", timestamp: "10 mins ago", status: "SUCCESS" },
    { id: 2, action: "Humanizer Pass Executed", detail: "Scrubbed generic AI openers, broken stacked triads", timestamp: "15 mins ago", status: "SUCCESS" },
    { id: 3, action: "Profile Recommendation Approved", detail: "Headline updated with high-demand keywords", timestamp: "1 hour ago", status: "SUCCESS" },
    { id: 4, action: "Profile Analysis Completed", detail: "9 sections scored against 2026 technical recruitment rubric", timestamp: "1 hour ago", status: "SUCCESS" },
    { id: 5, action: "Story Bank Interview Turn", detail: "Extracted P99 latency database migration achievement", timestamp: "3 hours ago", status: "SUCCESS" },
  ];

  return (
    <div className="space-y-6">
      {/* Diagnostics Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="h-4 w-4 text-indigo-400" /> Runtime Diagnostics & Integrity
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block mb-1">Upstream Repository</span>
            <span className="font-semibold text-white">sergebulaev/linkedin-skills</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block mb-1">Pinned Commit SHA</span>
            <span className="font-mono text-purple-400 font-semibold">baa9c90...</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block mb-1">Installed Skills</span>
            <span className="font-semibold text-emerald-400">12 Dynamic SKILL.md</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block mb-1">Self-Test Validation</span>
            <span className="font-semibold text-emerald-400">102 Offline Tests Passed</span>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-400" /> Activity & Audit Timeline
        </h3>

        <div className="space-y-3">
          {activities.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/40"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">{item.action}</h4>
                  <p className="text-xs text-slate-400">{item.detail}</p>
                </div>
              </div>

              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {item.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
