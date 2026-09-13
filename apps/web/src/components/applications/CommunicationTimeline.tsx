import React, { useEffect, useState } from "react";
import { useOutreach, CommunicationActivity, FollowUpTask } from "../../hooks/useOutreach";

export function CommunicationTimeline({ applicationId }: { applicationId: string }) {
  const { getTimeline, loading } = useOutreach();
  const [data, setData] = useState<{ activities: CommunicationActivity[], pendingFollowUps: FollowUpTask[] } | null>(null);

  useEffect(() => {
    if (applicationId) {
      getTimeline(applicationId).then(res => {
        if (res?.success) {
          setData(res);
        }
      });
    }
  }, [applicationId, getTimeline]);

  if (loading && !data) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6">
      <h3 className="text-lg font-bold text-white mb-4">Communication Timeline</h3>
      
      {data.pendingFollowUps.length > 0 && (
        <div className="mb-6 space-y-3">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Pending Tasks</h4>
          {data.pendingFollowUps.map(task => (
            <div key={task._id} className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-indigo-300">{task.type.replace(/_/g, " ")}</p>
                <p className="text-xs text-indigo-400/70">Due: {new Date(task.dueAt).toLocaleDateString()}</p>
              </div>
              <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded border border-indigo-500/30">
                {task.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">History</h4>
        {data.activities.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No communication history yet.</p>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
            {data.activities.map(activity => (
              <div key={activity._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-slate-900 bg-slate-700 text-slate-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow"></div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl bg-slate-950 border border-slate-800 shadow">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-200">{activity.type.replace(/_/g, " ")}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {activity.status}
                    </span>
                  </div>
                  <time className="text-xs text-slate-400">{new Date(activity.createdAt).toLocaleDateString()} via {activity.channel}</time>
                  <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap line-clamp-3 hover:line-clamp-none transition-all">{activity.subject ? `Subject: ${activity.subject}\n\n${activity.body}` : activity.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
