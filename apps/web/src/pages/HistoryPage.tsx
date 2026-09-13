import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  History as HistoryIcon, Trash2, ExternalLink, Calendar
} from "lucide-react";
import { ApiClient } from "../lib/api";

interface InterviewSession {
  id: string;
  role: string;
  company?: string;
  status: string;
  interview_type: string;
  difficulty: string;
  technologies?: string[];
  created_at: string;
  score?: { overall_score: number };
}

export default function HistoryPage() {
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    ApiClient.getInterviews()
      .then(setInterviews)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Delete this interview record permanently?")) return;
    setDeletingId(id);
    try {
      await ApiClient.deleteInterview(id);
      setInterviews((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Loading interview archives...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Interview Practice Archives</span>
            <span className="text-xs uppercase font-semibold tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-full">
              History
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Review past mock interview transcripts, feedback scores, and diagnostic reports.</p>
        </div>
        <Link to="/setup" className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-colors">
          Start New Practice
        </Link>
      </div>

      {interviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {interviews.map((sess) => {
            const isCompleted = sess.status === "completed";
            const linkHref = isCompleted ? `/report/${sess.id}` : `/interview/${sess.id}`;
            return (
              <div key={sess.id} className="group relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 backdrop-blur-md transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">{sess.role}</h3>
                      {sess.company && <p className="text-xs text-slate-400 mt-0.5 font-medium">@ {sess.company}</p>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isCompleted ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"}`}>
                      {sess.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/60">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-500" />{new Date(sess.created_at).toLocaleDateString()}</span>
                    <span>•</span><span>{sess.interview_type}</span><span>•</span><span>{sess.difficulty}</span>
                  </div>

                  {sess.technologies && sess.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {sess.technologies.slice(0, 4).map((tech) => (
                        <span key={tech} className="px-2 py-0.5 rounded text-[11px] bg-slate-950 border border-slate-800 text-slate-300">{tech}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <div className="text-xs">
                    {sess.score ? (
                      <span className="font-bold text-white">Score: <strong className="text-indigo-400">{sess.score.overall_score}</strong> / 10</span>
                    ) : (
                      <span className="text-slate-500">Incomplete</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={(e) => handleDelete(sess.id, e)} disabled={deletingId === sess.id}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Link to={linkHref} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 flex items-center gap-1.5 transition-colors">
                      <span>{isCompleted ? "View Report" : "Resume"}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
          <HistoryIcon className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Mock Interviews Recorded</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Ready to test your technical depth? Launch a session to start tracking your interview mastery.</p>
          <Link to="/setup" className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold">Start Your First Practice</Link>
        </div>
      )}
    </div>
  );
}
