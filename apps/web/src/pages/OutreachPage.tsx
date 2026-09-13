import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useOutreach, FollowUpTask, CommunicationActivity } from "../hooks/useOutreach";

export default function OutreachPage() {
  const { getDashboard, generateDraft, submitCommunication, suppressFollowUp, loading } = useOutreach();
  
  const [data, setData] = useState<{ due: FollowUpTask[], upcoming: FollowUpTask[], recent: CommunicationActivity[] } | null>(null);
  
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<FollowUpTask | null>(null);
  const [currentDraft, setCurrentDraft] = useState<any>(null);
  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const d = await getDashboard();
    if (d) setData(d);
  };

  const handleStartDraft = async (task: FollowUpTask) => {
    setActiveTask(task);
    setDraftModalOpen(true);
    setCurrentDraft(null);
    setDrafting(true);

    const draftResult = await generateDraft({
      type: task.type,
      tone: "professional",
      applicationId: task.applicationId?._id,
      interviewId: task.interviewId?._id,
      contactId: task.contactId?._id,
    });

    if (draftResult?.success) {
      setCurrentDraft(draftResult);
    }
    setDrafting(false);
  };

  const handleSuppress = async (task: FollowUpTask) => {
    await suppressFollowUp(task._id);
    loadDashboard();
  };

  const handleSubmitDraft = async (action: "COPY" | "SEND") => {
    if (!currentDraft?.activity?._id) return;
    const res = await submitCommunication(currentDraft.activity._id, action);
    if (res?.success) {
      if (action === "COPY") {
        navigator.clipboard.writeText(`${currentDraft.activity.subject}\n\n${currentDraft.activity.body}`);
        alert("Copied to clipboard!");
      }
      setDraftModalOpen(false);
      loadDashboard();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Follow-Up Center</h1>
          <p className="text-slate-400 mt-1">Manage your post-interview communications and outreach.</p>
        </div>
      </div>

      {!data && loading && (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4 text-emerald-400">Due Today</h2>
              {data.due.length === 0 ? (
                <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 text-center text-slate-400">
                  You're all caught up! No follow-ups due today.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.due.map(task => (
                    <div key={task._id} className="p-5 bg-slate-800/50 rounded-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">DUE</span>
                          <span className="text-sm text-slate-300 font-medium">
                            {task.type.replace(/_/g, " ")}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium text-slate-100">
                          {task.interviewId?.role || task.applicationId?.jobTitle || "Outreach"} at {task.applicationId?.companyName || "Company"}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">Reason: {task.reason}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => handleSuppress(task)} className="text-sm text-slate-400 hover:text-slate-200">
                          Dismiss
                        </button>
                        <button 
                          onClick={() => handleStartDraft(task)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Draft Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-slate-200">Upcoming</h2>
              {data.upcoming.length === 0 ? (
                <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 text-center text-slate-400">
                  No upcoming follow-ups scheduled.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.upcoming.map(task => (
                    <div key={task._id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="text-slate-200 font-medium">{task.type.replace(/_/g, " ")}</p>
                        <p className="text-xs text-slate-400">
                          Due: {new Date(task.dueAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400">SCHEDULED</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4 text-slate-200">Recent Activity</h2>
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 space-y-4">
              {data.recent.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No recent communications.</p>
              ) : (
                data.recent.map(activity => (
                  <div key={activity._id} className="border-b border-slate-800 last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-slate-200">{activity.type.replace(/_/g, " ")}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {activity.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{new Date(activity.createdAt).toLocaleDateString()} via {activity.channel}</p>
                    <p className="text-sm text-slate-300 line-clamp-2">{activity.subject || activity.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Draft Modal */}
      {draftModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-100">Communication Workspace</h3>
              <button onClick={() => setDraftModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {drafting ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p>Analyzing context and generating personalized draft...</p>
                </div>
              ) : currentDraft ? (
                <div className="space-y-6">
                  
                  {currentDraft.validation?.status === "NEEDS_USER_REVIEW" && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <h4 className="text-amber-400 font-medium text-sm flex items-center gap-2 mb-1">
                        ⚠️ Claim Validation Warning
                      </h4>
                      <p className="text-xs text-amber-200/70">{currentDraft.validation.reasoning}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Subject</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                      value={currentDraft.activity?.subject || currentDraft.draft?.subject || ""}
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Message Body</label>
                    <textarea 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-3 text-slate-200 min-h-[250px] focus:outline-none focus:border-indigo-500"
                      value={currentDraft.activity?.body || currentDraft.draft?.body || ""}
                      readOnly
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
              <button 
                onClick={() => setDraftModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSubmitDraft("COPY")}
                disabled={drafting || !currentDraft}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Copy to Clipboard & Mark Sent
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
