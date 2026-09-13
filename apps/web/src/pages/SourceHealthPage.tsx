import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Activity } from "lucide-react";
import { ApiClient } from "../lib/api";
import { formatRelativeTime } from "../lib/utils";

export default function SourceHealthPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["sourceHealth"],
    queryFn: () => ApiClient.getJobSourceHealth(),
    refetchInterval: 30000,
  });

  const { mutate: triggerSync, isPending: isSyncing } = useMutation({
    mutationFn: () => ApiClient.triggerJobSync(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sourceHealth"] }),
  });

  const sources: any[] = data?.sources || data || [];

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" /> Source Health Monitor
          </h1>
          <p className="text-sm text-slate-400 mt-1">Real-time status of all job data sources</p>
        </div>
        <button onClick={() => triggerSync()} disabled={isSyncing}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold flex items-center gap-2 hover:bg-indigo-500 disabled:opacity-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Trigger Sync"}
        </button>
      </div>

      {/* Summary stats */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Sources", value: data.summary.total_sources },
            { label: "Active", value: data.summary.active_sources, color: "text-emerald-400" },
            { label: "Failing", value: data.summary.failing_sources, color: "text-rose-400" },
            { label: "Total Jobs", value: data.summary.total_jobs?.toLocaleString() || "—", color: "text-indigo-400" },
          ].map(m => (
            <div key={m.label} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <p className="text-xs text-slate-400 font-semibold">{m.label}</p>
              <p className={`text-2xl font-bold mt-1 ${m.color || "text-white"}`}>{m.value ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      {/* Source list */}
      <div className="space-y-3">
        {sources.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No source data available. Trigger a sync to populate.</p>
          </div>
        ) : (
          sources.map((source: any) => {
            const isOk = source.status === "ok" || source.status === "active";
            return (
              <div key={source.source_id || source.name} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-4">
                <div className={`p-2 rounded-lg ${isOk ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                  {isOk ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white capitalize">{source.name || source.source_id}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isOk ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                      {source.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {source.jobs_count != null ? `${source.jobs_count.toLocaleString()} jobs` : ""} 
                    {source.last_run ? ` • Last run: ${formatRelativeTime(source.last_run)}` : ""}
                    {source.error ? ` • Error: ${source.error}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {source.duration_ms != null && <p className="text-xs text-slate-500">{source.duration_ms}ms</p>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
