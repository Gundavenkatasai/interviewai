import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase, Plus, Calendar, ExternalLink, Trash2, Edit3, CheckCircle2,
  Clock, AlertCircle, Search, Filter, PlayCircle, Building2, DollarSign,
  FileText, Sparkles, X, ChevronRight, Check
} from "lucide-react";
import { ApiClient } from "../lib/api";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  applied: { label: "Applied", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  review: { label: "In Review", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  interviewing: { label: "Interviewing", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  offer: { label: "Offer Received", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  rejected: { label: "Rejected", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" },
  saved: { label: "Saved / Draft", color: "text-slate-400", bg: "bg-slate-800/40", border: "border-slate-700" },
};

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<any | null>(null);

  const [form, setForm] = useState({
    companyName: "",
    jobTitle: "",
    status: "applied",
    appliedDate: new Date().toISOString().split("T")[0],
    nextInterviewDate: "",
    salaryRange: "",
    url: "",
    notes: "",
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => ApiClient.getApplications(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => ApiClient.createApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setIsAddModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ApiClient.updateApplication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setEditingApp(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiClient.deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const resetForm = () => {
    setForm({
      companyName: "",
      jobTitle: "",
      status: "applied",
      appliedDate: new Date().toISOString().split("T")[0],
      nextInterviewDate: "",
      salaryRange: "",
      url: "",
      notes: "",
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.jobTitle) return;

    if (editingApp) {
      updateMutation.mutate({ id: editingApp._id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const openEdit = (app: any) => {
    setEditingApp(app);
    setForm({
      companyName: app.companyName,
      jobTitle: app.jobTitle,
      status: app.status || "applied",
      appliedDate: app.appliedDate ? new Date(app.appliedDate).toISOString().split("T")[0] : "",
      nextInterviewDate: app.nextInterviewDate ? new Date(app.nextInterviewDate).toISOString().split("T")[0] : "",
      salaryRange: app.salaryRange || "",
      url: app.url || "",
      notes: app.notes || "",
    });
  };

  const startInterviewPrep = (app: any) => {
    const params = new URLSearchParams({
      role: app.jobTitle,
      company: app.companyName,
    });
    navigate(`/setup?${params.toString()}`);
  };

  // Filter applications
  const filteredApps = applications.filter((app: any) => {
    const matchesTab = activeTab === "all" || (app.status || "applied").toLowerCase() === activeTab.toLowerCase();
    const matchesSearch =
      (app.companyName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.jobTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Metrics
  const totalCount = applications.length;
  const interviewingCount = applications.filter((a: any) => (a.status || "").toLowerCase() === "interviewing").length;
  const offerCount = applications.filter((a: any) => (a.status || "").toLowerCase() === "offer").length;
  const activeCount = applications.filter((a: any) => !["rejected", "saved"].includes((a.status || "").toLowerCase())).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Job Applications Tracker</span>
            <span className="text-xs uppercase font-bold tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-full">
              ATS Pipeline
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track every job application, scheduled interview rounds, compensation notes, and follow-ups.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/jobs"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" /> Find More Jobs
          </Link>
          <button
            onClick={() => { resetForm(); setEditingApp(null); setIsAddModalOpen(true); }}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Add Application
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Applications", value: totalCount, color: "text-white", sub: "Pipeline entries" },
          { label: "Active Pipelines", value: activeCount, color: "text-indigo-400", sub: "In progress" },
          { label: "Interviews Scheduled", value: interviewingCount, color: "text-purple-400", sub: "Rounds active" },
          { label: "Offers Received", value: offerCount, color: "text-emerald-400", sub: "Successful" },
        ].map((m) => (
          <div key={m.label} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
            <span className="text-xs text-slate-400 uppercase font-semibold">{m.label}</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-extrabold ${m.color}`}>{m.value}</span>
              <span className="text-[11px] text-slate-500">{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {["all", "applied", "interviewing", "offer", "rejected", "saved"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60"
              }`}
            >
              {tab === "all" ? "All" : tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company, role, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-900/60 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Applications Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? "No applications match your search query."
              : "Track your job hunt progress in one place. Add your first application or apply directly from Job Discovery."}
          </p>
          <button
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
          >
            Add Your First Application
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredApps.map((app: any) => {
            const statusStyle = STATUS_CONFIG[(app.status || "applied").toLowerCase()] || STATUS_CONFIG.applied;
            return (
              <div
                key={app._id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 backdrop-blur-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {app.jobTitle}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{app.companyName}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.color}`}
                    >
                      {statusStyle.label}
                    </span>
                  </div>

                  {/* Dates & Compensation */}
                  <div className="space-y-1.5 text-xs text-slate-400 pt-3 border-t border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" /> Applied:
                      </span>
                      <span className="text-slate-300 font-medium">
                        {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : "Recently"}
                      </span>
                    </div>

                    {app.nextInterviewDate && (
                      <div className="flex items-center justify-between text-purple-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5" /> Next Round:
                        </span>
                        <span className="font-semibold">
                          {new Date(app.nextInterviewDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {app.salaryRange && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <DollarSign className="w-3.5 h-3.5" /> Target / CTC:
                        </span>
                        <span className="text-slate-300 font-medium">{app.salaryRange}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes snippet */}
                  {app.notes && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-400 line-clamp-2">
                      {app.notes}
                    </div>
                  )}

                  {/* Application Timeline */}
                  {app.timeline && app.timeline.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Timeline</span>
                      <div className="relative pl-3 space-y-3">
                        <div className="absolute left-[3px] top-1.5 bottom-1.5 w-0.5 bg-slate-800/60"></div>
                        {app.timeline.map((event: any, i: number) => (
                          <div key={i} className="relative flex items-start gap-3">
                            <div className="absolute -left-3 mt-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-slate-900/60 z-10"></div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-300 capitalize">{event.status}</span>
                                <span className="text-[10px] text-slate-500">{new Date(event.date).toLocaleDateString()}</span>
                              </div>
                              {event.note && <p className="text-[11px] text-slate-400 mt-0.5">{event.note}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {app.url && (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Open Job Posting"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => openEdit(app)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete application for ${app.companyName}?`)) {
                          deleteMutation.mutate(app._id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Application"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {app.status === "SUBMITTED" || app.status === "INTERVIEWING" ? (
                    <button
                      onClick={() => startInterviewPrep(app)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600 hover:border-transparent flex items-center gap-1 transition-all"
                    >
                      <PlayCircle className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white" />
                      <span>Practice Drill</span>
                    </button>
                  ) : (
                    <Link
                      to={app.jobId ? `/jobs/${app.jobId}/apply` : "#"}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600 hover:border-transparent flex items-center gap-1 transition-all ${!app.jobId && 'opacity-50 cursor-not-allowed'}`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white" />
                      <span>{app.status === "SAVED" ? "Prepare" : "Resume Application"}</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingApp) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <span>{editingApp ? "Edit Application" : "New Application"}</span>
              </h2>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingApp(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="e.g. Stripe"
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Pipeline Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="applied">Applied</option>
                    <option value="review">In Review</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offer">Offer Received</option>
                    <option value="rejected">Rejected</option>
                    <option value="saved">Saved / Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Applied Date</label>
                  <input
                    type="date"
                    value={form.appliedDate}
                    onChange={(e) => setForm({ ...form, appliedDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Next Interview Round Date</label>
                  <input
                    type="date"
                    value={form.nextInterviewDate}
                    onChange={(e) => setForm({ ...form, nextInterviewDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Salary Range / Expectation</label>
                  <input
                    type="text"
                    value={form.salaryRange}
                    onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
                    placeholder="e.g. $140,000 - $160,000"
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Job URL / Portal Link</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://company.com/careers/..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notes & Follow-up Details</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Add recruiter names, referral notes, questions asked in screening, etc."
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingApp(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-md shadow-indigo-600/20"
                >
                  {editingApp ? "Save Changes" : "Create Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
