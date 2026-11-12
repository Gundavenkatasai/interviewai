import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, Activity, RefreshCw, CheckCircle2, AlertTriangle,
  XCircle, Clock, Database, Globe, Play, Server, Filter,
  Layers, ArrowUpRight, Check, AlertCircle, FileText
} from "lucide-react";
import { ApiClient } from "../lib/api";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"sources" | "syncLogs" | "validationLogs">("sources");

  // Queries
  const { data: sourcesData, isLoading: sourcesLoading, refetch: refetchSources } = useQuery({
    queryKey: ["admin-sources"],
    queryFn: () => ApiClient.getAdminSources(),
    refetchInterval: 15000,
  });

  const { data: syncLogsData } = useQuery({
    queryKey: ["admin-sync-logs"],
    queryFn: () => ApiClient.getAdminSyncLogs(),
    refetchInterval: 15000,
  });

  const { data: validationData } = useQuery({
    queryKey: ["admin-validation-logs"],
    queryFn: () => ApiClient.getAdminValidationLogs(),
    refetchInterval: 15000,
  });

  // Mutations
  const fullSyncMutation = useMutation({
    mutationFn: () => ApiClient.triggerAdminSync(),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["admin-sources"] });
        queryClient.invalidateQueries({ queryKey: ["admin-sync-logs"] });
        queryClient.invalidateQueries({ queryKey: ["admin-validation-logs"] });
      }, 2000);
    },
  });

  const sourceSyncMutation = useMutation({
    mutationFn: (src: string) => ApiClient.triggerAdminSync(src),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["admin-sources"] });
        queryClient.invalidateQueries({ queryKey: ["admin-sync-logs"] });
        queryClient.invalidateQueries({ queryKey: ["admin-validation-logs"] });
      }, 2000);
    },
  });

  const sources: any[] = sourcesData?.sources || [];
  const syncLogs: any[] = syncLogsData?.logs || [];
  const validationLogs: any[] = validationData?.logs || [];
  const validationSummary: any = validationData?.summary || {};

  // Metrics
  const totalAccepted72h = sources.reduce((acc, s) => acc + (s.jobsAccepted72h || 0), 0);
  const totalRejectedAge = sources.reduce((acc, s) => acc + (s.jobsRejectedAge || 0), 0);
  const totalDuplicates = sources.reduce((acc, s) => acc + (s.duplicatesDetected || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Successfully synchronized":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#EBF3EE] text-[#2E6347] border border-[#D0E3D6] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Syncing
          </span>
        );
      case "Partially synchronized":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#FDF6E9] text-[#A36114] border border-[#A36114]/20 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Partial
          </span>
        );
      case "Requires credentials":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#FCEEEE] text-[#9E2A2B] border border-[#9E2A2B]/20 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Auth Required
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#F5F3EE] text-[#181614]/70 border border-[#E5E0D4] flex items-center gap-1">
            <Clock className="w-3 h-3" /> Standby
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E0D4] pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#172535] text-white font-mono text-[11px] font-semibold mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>CONTROL TOWER — 72-HOUR REQUISITION AUDIT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#181614] tracking-tight">
              Job Intelligence Aggregator Control Deck
            </h1>
            <p className="text-xs text-[#181614]/70 mt-1 font-mono">
              Real-time monitoring across 14 Indian job & internship portals. Automated 15-minute background sync.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fullSyncMutation.mutate()}
              disabled={fullSyncMutation.isPending}
              className="px-4 py-2 rounded-md bg-[#C84B26] hover:bg-[#B53E1B] text-white font-mono text-xs font-bold shadow-[0_2px_0_0_#983416] flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${fullSyncMutation.isPending ? "animate-spin" : ""}`} />
              <span>{fullSyncMutation.isPending ? "Syncing 14 Portals..." : "Trigger Full 14-Portal Sync"}</span>
            </button>

            <button
              onClick={() => refetchSources()}
              className="p-2 rounded-md bg-white border border-[#E5E0D4] text-[#181614]/70 hover:text-[#181614] cursor-pointer transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Telemetry Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-lg bg-white border border-[#E5E0D4] shadow-xs">
            <div className="flex items-center justify-between text-xs font-mono text-[#181614]/60 mb-2">
              <span className="uppercase font-semibold">Active Ingested Portals</span>
              <Globe className="w-4 h-4 text-[#172535]" />
            </div>
            <div className="text-3xl font-mono font-bold text-[#181614]">14 / 14</div>
            <div className="text-[11px] font-mono text-[#2E6347] mt-1">
              All 14 specified connectors registered
            </div>
          </div>

          <div className="p-5 rounded-lg bg-white border border-[#E5E0D4] shadow-xs">
            <div className="flex items-center justify-between text-xs font-mono text-[#181614]/60 mb-2">
              <span className="uppercase font-semibold">Eligible Jobs (≤ 72h)</span>
              <CheckCircle2 className="w-4 h-4 text-[#2E6347]" />
            </div>
            <div className="text-3xl font-mono font-bold text-[#2E6347]">{totalAccepted72h}</div>
            <div className="text-[11px] font-mono text-[#181614]/50 mt-1">
              Verified publication dates only
            </div>
          </div>

          <div className="p-5 rounded-lg bg-white border border-[#E5E0D4] shadow-xs">
            <div className="flex items-center justify-between text-xs font-mono text-[#181614]/60 mb-2">
              <span className="uppercase font-semibold">Rejected (Age &gt; 72h)</span>
              <XCircle className="w-4 h-4 text-[#9E2A2B]" />
            </div>
            <div className="text-3xl font-mono font-bold text-[#9E2A2B]">{totalRejectedAge}</div>
            <div className="text-[11px] font-mono text-[#181614]/50 mt-1">
              Strictly filtered at ingestion boundary
            </div>
          </div>

          <div className="p-5 rounded-lg bg-white border border-[#E5E0D4] shadow-xs">
            <div className="flex items-center justify-between text-xs font-mono text-[#181614]/60 mb-2">
              <span className="uppercase font-semibold">Duplicates Consolidated</span>
              <Layers className="w-4 h-4 text-[#A36114]" />
            </div>
            <div className="text-3xl font-mono font-bold text-[#A36114]">{totalDuplicates}</div>
            <div className="text-[11px] font-mono text-[#181614]/50 mt-1">
              Multi-source unified listings
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#E5E0D4]">
          <button
            onClick={() => setActiveTab("sources")}
            className={`px-4 py-2 font-mono text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "sources"
                ? "border-[#C84B26] text-[#C84B26]"
                : "border-transparent text-[#181614]/60 hover:text-[#181614]"
            }`}
          >
            14 Ingestion Sources ({sources.length})
          </button>
          <button
            onClick={() => setActiveTab("syncLogs")}
            className={`px-4 py-2 font-mono text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "syncLogs"
                ? "border-[#C84B26] text-[#C84B26]"
                : "border-transparent text-[#181614]/60 hover:text-[#181614]"
            }`}
          >
            15-Minute Sync Runs ({syncLogs.length})
          </button>
          <button
            onClick={() => setActiveTab("validationLogs")}
            className={`px-4 py-2 font-mono text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "validationLogs"
                ? "border-[#C84B26] text-[#C84B26]"
                : "border-transparent text-[#181614]/60 hover:text-[#181614]"
            }`}
          >
            72h Validation Audit Log ({validationLogs.length})
          </button>
        </div>

        {/* TAB 1: 14 Ingestion Sources Grid */}
        {activeTab === "sources" && (
          <div className="bg-white rounded-lg border border-[#E5E0D4] overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-[#E5E0D4] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#181614]">Configured Portals & Collection Telemetry</h3>
                <p className="text-xs text-[#181614]/60 font-mono mt-0.5">Transparent status reporting for each independent connector</p>
              </div>
              <div className="text-xs font-mono text-[#181614]/60">
                15-Min Cadence Active
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#FAF8F5] text-[#181614]/70 border-b border-[#E5E0D4] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Portal / Source</th>
                    <th className="py-3 px-4 font-bold">Connection Status</th>
                    <th className="py-3 px-4 font-bold">Accepted (≤ 72h)</th>
                    <th className="py-3 px-4 font-bold">Rejected (&gt; 72h)</th>
                    <th className="py-3 px-4 font-bold">Duplicates</th>
                    <th className="py-3 px-4 font-bold">Last Sync (IST)</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D4]">
                  {sources.map((src) => (
                    <tr key={src.name} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#181614] flex items-center gap-1.5">
                          <span>{src.name}</span>
                        </div>
                        <div className="text-[10px] text-[#181614]/50">{src.provider}</div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(src.connectionStatus)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#2E6347]">
                        {src.jobsAccepted72h}
                      </td>
                      <td className="py-3 px-4 text-[#9E2A2B]">
                        {src.jobsRejectedAge}
                      </td>
                      <td className="py-3 px-4 text-[#A36114]">
                        {src.duplicatesDetected}
                      </td>
                      <td className="py-3 px-4 text-[#181614]/70">
                        {new Date(src.lastSuccessfulSync).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => sourceSyncMutation.mutate(src.name)}
                          disabled={sourceSyncMutation.isPending}
                          className="px-2.5 py-1 rounded bg-white hover:bg-[#FAF8F5] border border-[#E5E0D4] text-[#181614] text-[11px] font-semibold cursor-pointer transition-colors"
                          title={`Run collection for ${src.name}`}
                        >
                          Sync Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Sync Runs History */}
        {activeTab === "syncLogs" && (
          <div className="bg-white rounded-lg border border-[#E5E0D4] overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-[#E5E0D4] bg-[#FAF8F5]">
              <h3 className="font-serif font-bold text-sm text-[#181614]">Recent Automated Synchronization Cycles</h3>
              <p className="text-xs text-[#181614]/60 font-mono mt-0.5">Execution logs captured every 15 minutes across all sources</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#FAF8F5] text-[#181614]/70 border-b border-[#E5E0D4] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Source</th>
                    <th className="py-3 px-4 font-bold">Timestamp (IST)</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Fetched</th>
                    <th className="py-3 px-4 font-bold">Accepted</th>
                    <th className="py-3 px-4 font-bold">Rejected (&gt; 72h)</th>
                    <th className="py-3 px-4 font-bold">Duplicates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D4]">
                  {syncLogs.slice(0, 30).map((log: any) => (
                    <tr key={log._id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#181614]">{log.source}</td>
                      <td className="py-3 px-4 text-[#181614]/70">
                        {new Date(log.startedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === "completed" || log.status === "running"
                            ? "bg-[#EBF3EE] text-[#2E6347]"
                            : "bg-[#FCEEEE] text-[#9E2A2B]"
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">{log.jobsFetched || 0}</td>
                      <td className="py-3 px-4 font-bold text-[#2E6347]">{log.jobsAccepted || 0}</td>
                      <td className="py-3 px-4 text-[#9E2A2B]">{log.jobsRejected || 0}</td>
                      <td className="py-3 px-4 text-[#A36114]">{log.duplicates || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: 72-Hour Validation Audit Logs */}
        {activeTab === "validationLogs" && (
          <div className="bg-white rounded-lg border border-[#E5E0D4] overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-[#E5E0D4] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#181614]">Strict 72-Hour Decision Audit Trail</h3>
                <p className="text-xs text-[#181614]/60 font-mono mt-0.5">Every job processed by the eligibility engine is recorded with exact reason</p>
              </div>
              <div className="flex gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-[#EBF3EE] text-[#2E6347] font-bold">
                  Accepted: {validationSummary.ACCEPTED || 0}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#FCEEEE] text-[#9E2A2B] font-bold">
                  Rejected: {validationSummary.REJECTED || 0}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#FDF6E9] text-[#A36114] font-bold">
                  Merged: {validationSummary.DUPLICATE_CONSOLIDATED || 0}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#FAF8F5] text-[#181614]/70 border-b border-[#E5E0D4] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Job Title & Employer</th>
                    <th className="py-3 px-4 font-bold">Source</th>
                    <th className="py-3 px-4 font-bold">Decision</th>
                    <th className="py-3 px-4 font-bold">Audit Reason</th>
                    <th className="py-3 px-4 font-bold">Age at Evaluation</th>
                    <th className="py-3 px-4 font-bold">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D4]">
                  {validationLogs.slice(0, 50).map((v: any) => (
                    <tr key={v._id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#181614] truncate max-w-xs">{v.title}</div>
                        <div className="text-[10px] text-[#181614]/60">{v.companyName || "Enterprise"}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#172535]">{v.source}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.decision === "ACCEPTED"
                            ? "bg-[#EBF3EE] text-[#2E6347]"
                            : v.decision === "DUPLICATE_CONSOLIDATED"
                            ? "bg-[#FDF6E9] text-[#A36114]"
                            : "bg-[#FCEEEE] text-[#9E2A2B]"
                        }`}>
                          {v.decision}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#181614]/80 text-[11px] max-w-sm truncate" title={v.reason}>
                        {v.reason}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {v.ageHours != null ? `${v.ageHours}h` : "—"}
                      </td>
                      <td className="py-3 px-4 text-[#2E6347]">
                        {v.timeRemainingHours != null ? `${v.timeRemainingHours}h` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
