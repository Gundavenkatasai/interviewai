import { useQuery } from "@tanstack/react-query";
import { Shield, Activity, Users, Server } from "lucide-react";
import { ApiClient } from "../lib/api";

export default function AdminPage() {
  const { data: health } = useQuery({ queryKey: ["adminHealth"], queryFn: () => ApiClient.getAdminHealth() });
  const { data: metrics } = useQuery({ queryKey: ["adminMetrics"], queryFn: () => ApiClient.getAdminMetrics() });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-400" /> Admin Panel
        </h1>
        <p className="text-sm text-slate-400 mt-1">System health and operational metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: "API Status", value: health?.status || "Unknown", icon: Server, color: health?.status === "healthy" ? "text-emerald-400" : "text-rose-400" },
          { label: "Total Users", value: metrics?.total_users ?? "—", icon: Users, color: "text-indigo-400" },
          { label: "Total Sessions", value: metrics?.total_sessions ?? "—", icon: Activity, color: "text-purple-400" },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${m.color}`} />
                <span className="text-xs text-slate-400 font-semibold uppercase">{m.label}</span>
              </div>
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            </div>
          );
        })}
      </div>

      {health && (
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <h2 className="text-sm font-bold text-white mb-4">System Health Details</h2>
          <pre className="text-xs text-slate-300 overflow-x-auto">{JSON.stringify(health, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
