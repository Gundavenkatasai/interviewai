import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "../lib/api";
import { 
  Building2, MapPin, CheckCircle2, AlertCircle, FileText, 
  PlayCircle, RefreshCw, Sparkles, ExternalLink, ArrowLeft, Check
} from "lucide-react";
import { CommunicationTimeline } from "../components/applications/CommunicationTimeline";

export default function JobApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // We assume we navigate here with the job ID.
  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: () => ApiClient.getJob(id!),
    enabled: !!id
  });

  // Fetch the application for this job
  const { data: apps = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: () => ApiClient.getApplications(),
  });

  const application = apps?.find((a: any) => a.jobId === id);

  // Auto-create application if it doesn't exist
  const createMutation = useMutation({
    mutationFn: (data: any) => ApiClient.createApplication(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] })
  });

  useEffect(() => {
    if (job && !application && !createMutation.isPending && !createMutation.isSuccess) {
      createMutation.mutate({
        jobId: job.id,
        companyName: job.companyName || job.company,
        jobTitle: job.title,
        status: "SAVED"
      });
    }
  }, [job, application, createMutation]);

  // Fetch Resumes to select from
  const { data: resumes = [] } = useQuery({
    queryKey: ["resumes"],
    queryFn: () => ApiClient.getResumes()
  });

  const activeResume = resumes[0]; // Simplified for this prototype

  const prepareMutation = useMutation({
    mutationFn: (appId: string) => ApiClient.prepareApplication(appId, { resumeVersionId: activeResume?._id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] })
  });

  const answerMutation = useMutation({
    mutationFn: ({ appId, fieldId }: { appId: string, fieldId: string }) => ApiClient.generateApplicationAnswer(appId, fieldId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] })
  });

  const submitMutation = useMutation({
    mutationFn: (appId: string) => ApiClient.markApplicationSubmitted(appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      navigate("/applications");
    }
  });

  if (isJobLoading || createMutation.isPending || !application) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isPreparing = application.status === "PREPARING";
  const isReady = application.status === "READY_TO_APPLY" || application.status === "IN_PROGRESS";
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Application Workspace
          </h1>
          <p className="text-slate-400">
            {application.jobTitle} @ {application.companyName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Context */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4">Preparation</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Job Snapshot</p>
                  <p className="text-xs text-slate-400">Captured {new Date(application.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Resume Selected</p>
                  <p className="text-xs text-slate-400">v{activeResume?.version || 1} • ATS Score: 84</p>
                </div>
              </div>

              {application.status === "SAVED" && (
                <button 
                  onClick={() => prepareMutation.mutate(application._id)}
                  disabled={prepareMutation.isPending}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2"
                >
                  {prepareMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                  Prepare Application
                </button>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              Interview AI prepares this application using your verified profile. You retain full control. 
              <strong className="text-white"> We will never click Submit for you.</strong>
            </p>
          </div>
        </div>

        {/* Right Column: Fields & Review */}
        <div className="lg:col-span-2 space-y-6">
          
          {!isReady && !isPreparing && (
            <div className="p-12 text-center border border-dashed border-slate-700 rounded-2xl bg-slate-900/50">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Ready to prepare</h3>
              <p className="text-sm text-slate-400">
                Click Prepare Application to extract fields and map your evidence.
              </p>
            </div>
          )}

          {isPreparing && (
            <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/50">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white">Analyzing Form...</h3>
            </div>
          )}

          {isReady && (
            <div className="space-y-6">
              
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">Application Fields</h3>
                <div className="space-y-4">
                  {application.fields?.map((field: any) => (
                    <div key={field.fieldId} className="flex items-start gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-white">{field.label}</p>
                          {field.required && <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400 bg-rose-500/10 px-2 rounded">Required</span>}
                        </div>
                        
                        {field.status === "NEEDS_USER_INPUT" ? (
                          <p className="text-sm text-amber-400 flex items-center gap-1.5 mt-2">
                            <AlertCircle className="w-4 h-4" /> Manual input required
                          </p>
                        ) : field.status === "SUGGESTED" ? (
                          <div className="mt-2 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            <p className="text-sm text-slate-200">{field.suggestedValue}</p>
                            <p className="text-xs text-indigo-400 mt-1 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> {field.source}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">Unmapped</p>
                        )}
                      </div>
                      
                      {field.normalizedType === "TEXTAREA" && field.status === "UNKNOWN" && (
                        <button 
                          onClick={() => answerMutation.mutate({ appId: application._id, fieldId: field.fieldId })}
                          disabled={answerMutation.isPending}
                          className="shrink-0 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                        >
                          {answerMutation.isPending ? "Generating..." : "Generate AI Answer"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submission Action */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/30">
                <div className="flex items-start gap-4 justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Ready to Submit</h3>
                    <p className="text-sm text-slate-400">
                      Review the fields above, then open the application to apply manually.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <button
                      onClick={() => window.open(application.applicationUrl, '_blank')}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" /> Open Application
                    </button>
                    <button
                      onClick={() => submitMutation.mutate(application._id)}
                      disabled={submitMutation.isPending}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 border border-emerald-500/30 transition-colors"
                    >
                      <Check className="w-4 h-4" /> Mark Submitted
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {application && (
            <CommunicationTimeline applicationId={application._id} />
          )}

        </div>
      </div>
    </div>
  );
}
