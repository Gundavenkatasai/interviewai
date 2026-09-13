import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Zap, Settings, Activity, CheckCircle2, AlertTriangle, Clock,
  Play, Pause, Plus, X, Shield, RefreshCw, Briefcase, MapPin, DollarSign,
  Sliders, ArrowRight, FileCheck, Check, Server
} from "lucide-react";
import { ApiClient } from "../lib/api";

export default function PipelineDashboardPage() {
  const queryClient = useQueryClient();

  const { data: pipelineRuns = [], isLoading, refetch } = useQuery({
    queryKey: ["pipelineRuns"],
    queryFn: () => ApiClient.getPipelineRuns(),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => ApiClient.retryPipeline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelineRuns"] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => ApiClient.cancelPipeline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelineRuns"] });
    }
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Server className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Auto-Pipeline Dashboard</h1>
          </div>
          <p className="text-slate-400 max-w-2xl text-lg">
            Monitor background pipelines converting job opportunities into review-ready application packs.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-indigo-400" />
          </div>
          <div className="text-slate-400 text-sm font-medium mb-1">Active Runs</div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {pipelineRuns.filter((r: any) => r.status === "RUNNING" || r.status === "PENDING").length}
          </div>
        </div>
        
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileCheck className="w-16 h-16 text-emerald-400" />
          </div>
          <div className="text-slate-400 text-sm font-medium mb-1">Ready for Review</div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {pipelineRuns.filter((r: any) => r.status === "SUCCEEDED" && r.applicationId).length}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield className="w-16 h-16 text-slate-400" />
          </div>
          <div className="text-slate-400 text-sm font-medium mb-1">Suppressed</div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {pipelineRuns.filter((r: any) => r.status === "BLOCKED").length}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-16 h-16 text-rose-400" />
          </div>
          <div className="text-slate-400 text-sm font-medium mb-1">Failed</div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {pipelineRuns.filter((r: any) => r.status === "FAILED").length}
          </div>
        </div>
      </div>

      {/* Pipeline Runs Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <h2 className="text-lg font-semibold text-white">Recent Pipeline Runs</h2>
        </div>
        
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
            <p>Loading pipelines...</p>
          </div>
        ) : pipelineRuns.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Server className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No pipeline runs yet</h3>
            <p className="max-w-md mx-auto mb-6">Trigger a pipeline from the Jobs page to automatically prepare an application.</p>
            <Link to="/jobs" className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2">
              Browse Jobs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 bg-slate-900/50">
                  <th className="p-4 font-medium">Job ID</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Stage</th>
                  <th className="p-4 font-medium">Started</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-800/50">
                {pipelineRuns.map((run: any) => (
                  <tr key={run._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono text-slate-300">
                      {run.jobId.slice(-8)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {run.status === "SUCCEEDED" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {run.status === "FAILED" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                        {run.status === "RUNNING" && <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />}
                        {run.status === "PENDING" && <Clock className="w-4 h-4 text-slate-400" />}
                        {run.status === "BLOCKED" && <Shield className="w-4 h-4 text-slate-400" />}
                        <span className={`font-medium ${
                          run.status === "SUCCEEDED" ? "text-emerald-400" :
                          run.status === "FAILED" ? "text-rose-400" :
                          run.status === "RUNNING" ? "text-indigo-400" :
                          "text-slate-400"
                        }`}>
                          {run.status}
                        </span>
                      </div>
                      {run.error && (
                        <div className="text-xs text-rose-400/80 mt-1 truncate max-w-xs" title={run.error.message}>
                          {run.error.code}: {run.error.message}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-300">
                      <div className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded inline-block">
                        {run.currentStage}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {run.stages?.length || 0} stages completed
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(run.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      {run.status === "SUCCEEDED" && run.applicationId && (
                        <Link
                          to={`/jobs/${run.jobId}/apply`}
                          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-md transition-colors text-xs font-medium inline-flex items-center gap-1.5"
                        >
                          Review Next <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                      {(run.status === "FAILED" || run.status === "BLOCKED") && (
                        <button
                          onClick={() => retryMutation.mutate(run._id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors text-xs font-medium inline-flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Retry
                        </button>
                      )}
                      {(run.status === "RUNNING" || run.status === "PENDING") && (
                        <button
                          onClick={() => cancelMutation.mutate(run._id)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-md transition-colors text-xs font-medium inline-flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
