import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  History as HistoryIcon, Trash2, ExternalLink, Calendar, Compass, Plus
} from "lucide-react";
import { ApiClient } from "../lib/api";
import { MechanicalButton } from "../components/ui/MechanicalButton";

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
    if (!confirm("Delete this session record permanently from archive?")) return;
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F5F3EE] space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#C84B26]/20 border-t-[#C84B26] animate-spin" />
        <span className="font-mono text-xs uppercase tracking-widest text-[#181614]/60">
          Retrieving Archival Flight Vault...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EE] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E0D4] pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#EBF3EE] border border-[#D0E3D6] text-[#2E6347] font-mono text-[11px] font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>FLIGHT SESSION LOGBOOK — ARCHIVE v2.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#181614] tracking-tight">
              Archival Interview Log
            </h1>
            <p className="text-xs text-[#181614]/70 max-w-xl">
              Chronological debrief records, diagnostic scoring transcripts, and rehearsal session telemetry.
            </p>
          </div>
          <Link to="/setup">
            <MechanicalButton
              variant="vermilion"
              icon={<Plus className="w-4 h-4" />}
            >
              Start New Session
            </MechanicalButton>
          </Link>
        </div>

        {interviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {interviews.map((sess) => {
              const isCompleted = sess.status === "completed";
              const linkHref = isCompleted ? `/report/${sess.id}` : `/interview/${sess.id}`;
              return (
                <div
                  key={sess.id}
                  className="p-6 rounded-lg bg-white border border-[#E5E0D4] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-serif font-bold text-base text-[#181614] hover:text-[#C84B26] transition-colors">
                          {sess.role}
                        </h3>
                        {sess.company && (
                          <p className="font-mono text-xs text-[#181614]/70 mt-0.5">
                            @ {sess.company}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider ${
                          isCompleted
                            ? "bg-[#EBF3EE] text-[#2E6347] border-[#D0E3D6]"
                            : "bg-[#FDF6E9] text-[#A36114] border-[#A36114]/20"
                        }`}
                      >
                        {sess.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px] text-[#181614]/60 mt-3 pt-3 border-t border-dashed border-[#E5E0D4]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#181614]/40" />
                        {new Date(sess.created_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{sess.interview_type}</span>
                      <span>•</span>
                      <span>{sess.difficulty}</span>
                    </div>

                    {sess.technologies && sess.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {sess.technologies.slice(0, 4).map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-0.5 rounded text-[11px] bg-[#F5F3EE] border border-[#E5E0D4] text-[#181614] font-mono"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E5E0D4]">
                    <div className="text-xs font-mono">
                      {sess.score ? (
                        <span className="text-[#181614] font-medium">
                          SCORE: <strong className="font-serif text-sm font-bold text-[#C84B26]">{sess.score.overall_score}</strong> / 10
                        </span>
                      ) : (
                        <span className="text-[#181614]/50 italic">Incomplete Session</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDelete(sess.id, e)}
                        disabled={deletingId === sess.id}
                        className="p-1.5 rounded text-[#181614]/40 hover:text-[#9E2A2B] hover:bg-[#FCEEEE] transition-colors"
                        title="Purge session record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link
                        to={linkHref}
                        className="px-3 py-1.5 rounded text-xs font-mono font-medium text-white bg-[#172535] hover:bg-[#181614] flex items-center gap-1.5 transition-colors"
                      >
                        <span>{isCompleted ? "Inspect Debrief" : "Resume Stage"}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 rounded-lg bg-white border border-[#E5E0D4] text-center space-y-4 shadow-sm">
            <HistoryIcon className="w-10 h-10 text-[#181614]/30 mx-auto" />
            <h3 className="font-serif font-bold text-base text-[#181614]">
              No Archival Flight Records
            </h3>
            <p className="text-xs text-[#181614]/70 max-w-sm mx-auto">
              Ready to test your technical depth? Launch a broadcast rehearsal stage to begin building your telemetry log.
            </p>
            <Link to="/setup" className="inline-block pt-2">
              <MechanicalButton variant="vermilion">
                Launch Initial Flight Rehearsal
              </MechanicalButton>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
