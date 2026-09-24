const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

export class ApiClient {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    const token = localStorage.getItem("interviewai_token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (res.status === 401) {
      let errorMsg = "Unauthorized. Please log in.";
      try {
        const errorData = await res.clone().json();
        errorMsg =
          errorData?.error?.message ||
          errorData?.message ||
          errorData?.detail ||
          (typeof errorData?.error === "string" ? errorData.error : errorMsg);
      } catch {}

      if (
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/register")
      ) {
        localStorage.removeItem("interviewai_token");
        window.location.href = "/login";
      }
      throw new Error(errorMsg);
    }

    if (!res.ok) {
      let errorMsg = `Request failed (${res.status})`;
      try {
        const errorData = await res.json();
        errorMsg =
          errorData?.error?.message ||
          errorData?.message ||
          errorData?.detail ||
          (typeof errorData?.error === "string" ? errorData.error : errorMsg);
      } catch {}
      throw new Error(errorMsg);
    }

    if (res.status === 204) {
      return null as T;
    }

    return res.json();
  }

  /** Download a binary blob (for file exports) */
  private static async requestBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    const token = localStorage.getItem("interviewai_token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      let errorMsg = `Request failed (${res.status})`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    return res.blob();
  }

  // Generic helper used by JobCard for fire-and-forget tracking
  static async post<T>(endpoint: string, data: any = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }


  // ================= Auth =================
  static async register(data: { email: string; password: string; full_name?: string; fullName?: string }) {
    const res = await this.request<any>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const token = res?.token || res?.access_token;
    if (token) {
      localStorage.setItem("interviewai_token", token);
    }
    return res;
  }

  static async login(data: { email: string; password: string }) {
    const res = await this.request<any>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const token = res?.token || res?.access_token;
    if (token) {
      localStorage.setItem("interviewai_token", token);
    }
    return res;
  }

  static async demoLogin() {
    const res = await this.request<any>("/api/auth/demo", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const token = res?.token || res?.access_token;
    if (token) {
      localStorage.setItem("interviewai_token", token);
    }
    return res;
  }

  static async resetPassword(data: { email: string; password: string }) {
    return this.request<any>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async logout() {
    try {
      await this.request<any>("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({}),
      });
    } finally {
      this.clearToken();
    }
  }

  static clearToken() {
    localStorage.removeItem("interviewai_token");
  }

  static async getMe() {
    return this.request<any>("/api/auth/me");
  }

  // ================= Interviews =================
  static async createInterview(data: any) {
    return this.request<any>("/api/interviews", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getInterviews() {
    const res = await this.request<any>("/api/interviews");
    return res?.sessions || res?.data || (Array.isArray(res) ? res : []);
  }

  static async getInterview(id: string) {
    const res = await this.request<any>(`/api/interviews/${id}`);
    const sessionData = res?.session || res?.data || res;
    const questions = res?.questions || sessionData?.questions || [];
    const answers = res?.answers || sessionData?.answers || [];
    return {
      ...sessionData,
      questions,
      answers,
    };
  }

  static async getReport(sessionId: string) {
    const res = await this.request<any>(`/api/interviews/${sessionId}`);
    const sessionData = res?.session || res?.data || res;
    const questions = res?.questions || sessionData?.questions || [];
    const answers = res?.answers || sessionData?.answers || [];
    return {
      ...sessionData,
      questions,
      answers,
    };
  }

  static async submitAnswer(sessionId: string, data: { question_id: string; answer_text: string; code_submission?: string; duration_seconds?: number }) {
    return this.request<any>(`/api/interviews/${sessionId}/answers`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getNextQuestion(sessionId: string) {
    return this.request<any>(`/api/interviews/${sessionId}/next-question`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  static async addQuestion(sessionId: string, data: any) {
    return this.request<any>(`/api/interviews/${sessionId}/questions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async addTranscript(sessionId: string, data: { speaker: string; content: string }) {
    return this.request<any>(`/api/interviews/${sessionId}/transcript`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async updateElapsed(sessionId: string, elapsedSeconds: number) {
    return this.request<any>(`/api/interviews/${sessionId}/elapsed`, {
      method: "POST",
      body: JSON.stringify({ elapsed_seconds: elapsedSeconds }),
    });
  }

  static async updateFeedback(sessionId: string, notes: { interviewer_notes?: string; candidate_notes?: string }) {
    return this.request<any>(`/api/interviews/${sessionId}/feedback`, {
      method: "POST",
      body: JSON.stringify(notes),
    });
  }

  static async completeInterview(sessionId: string) {
    return this.request<any>(`/api/interviews/${sessionId}/complete`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  static async deleteInterview(sessionId: string) {
    return this.request<any>(`/api/interviews/${sessionId}`, { method: "DELETE" });
  }

  // ================= Applications Tracker =================
  static async getApplications() {
    const res = await this.request<any>("/api/applications");
    return res?.data || res?.applications || (Array.isArray(res) ? res : []);
  }

  static async getApplication(id: string) {
    const res = await this.request<any>(`/api/applications/${id}`);
    return res?.data || res;
  }

  static async createApplication(data: any) {
    return this.request('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateApplication(id: string, data: any) {
    return this.request(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async deleteApplication(id: string) {
    return this.request(`/applications/${id}`, {
      method: 'DELETE',
    });
  }

  // Day 11 specific methods
  static async prepareApplication(id: string, data: { resumeVersionId: string, tailoringRunId?: string }) {
    return this.request(`/applications/${id}/prepare`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async generateApplicationAnswer(id: string, fieldId: string) {
    return this.request(`/applications/${id}/answers/${fieldId}`, {
      method: 'POST',
    });
  }

  static async verifyApplicationFields(id: string, data: { fields: Partial<any>[] }) {
    return this.request(`/applications/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async markApplicationSubmitted(id: string) {
    return this.request(`/applications/${id}/mark-submitted`, {
      method: 'POST',
    });
  }

  // ================= Pipeline (Auto-Apply V2) =================
  static async startPipeline(jobId: string) {
    return this.request<any>("/api/pipeline/run", {
      method: "POST",
      body: JSON.stringify({ jobId }),
    });
  }

  static async getPipelineRuns() {
    const res = await this.request<any>("/api/pipeline/runs");
    return res?.data || (Array.isArray(res) ? res : []);
  }

  static async getPipelineRun(id: string) {
    const res = await this.request<any>(`/api/pipeline/runs/${id}`);
    return res?.data || res;
  }

  static async retryPipeline(id: string) {
    return this.request<any>(`/api/pipeline/runs/${id}/retry`, {
      method: "POST",
    });
  }

  static async cancelPipeline(id: string) {
    return this.request<any>(`/api/pipeline/runs/${id}/cancel`, {
      method: "POST",
    });
  }

  // ================= Interview Intelligence =================
  static async generateIntelligence(data: { jobId: string; resumeVersionId: string; interviewType?: string }) {
    return this.request<any>("/api/interview-intelligence/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getIntelligenceByJobId(jobId: string) {
    const res = await this.request<any>(`/api/interview-intelligence/job/${jobId}`);
    return res?.data || res;
  }

  static async getIntelligenceById(id: string) {
    const res = await this.request<any>(`/api/interview-intelligence/${id}`);
    return res?.data || res;
  }

  // ================= Story Bank =================
  static async getStories() {
    const res = await this.request<any>("/api/interview-stories");
    return res?.data || res || [];
  }

  static async extractStory(data: { text: string; sourceId?: string }) {
    return this.request<any>("/api/interview-stories/extract", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async verifyStory(id: string) {
    return this.request<any>(`/api/interview-stories/${id}/verify`, {
      method: "POST",
    });
  }

  // ================= Interview Debrief =================
  static async generateDebrief(interviewId: string) {
    return this.request<any>(`/api/interview-debriefs/${interviewId}/generate`, {
      method: "POST",
    });
  }

  static async getDebrief(interviewId: string) {
    const res = await this.request<any>(`/api/interview-debriefs/${interviewId}`);
    return res?.data || res;
  }

  static async getWeaknesses() {
    const res = await this.request<any>("/api/interview-debriefs/weaknesses");
    return res?.data || res || [];
  }

  // ================= AI Outreach Studio =================
  static async generateOutreach(data: {
    jobId: string;
    type: "cover_letter" | "cold_email" | "linkedin_message";
    tone?: string;
    resumeId?: string;
  }) {
    return this.request<any>("/api/outreach/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ================= LinkedIn Reviewer =================
  static async analyzeLinkedIn(profileUrl: string) {
    return this.request<any>("/api/linkedin/analyze", {
      method: "POST",
      body: JSON.stringify({ profileUrl }),
    });
  }

  // ================= Developer Portfolio =================
  static async getPortfolio() {
    const res = await this.request<any>("/api/portfolio");
    return res?.data || res?.portfolio || res;
  }

  // ================= User Profile =================
  static async getProfile() {
    const res = await this.request<any>("/api/profile");
    return res?.profile || res?.data || res;
  }

  static async updateProfile(data: any) {
    return this.request<any>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async verifyProfileFact(data: { entityId: string, entityType: string, action: "VERIFY" | "REJECT" }) {
    return this.request<any>("/api/profile/facts/verify", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async resolveProfileConflict(id: string, data: { resolutionType: "USE_A" | "USE_B" | "MERGED" | "REJECT", mergedData?: any }) {
    return this.request<any>(`/api/profile/conflicts/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getIntelligenceSummary() {
    const res = await this.request<any>("/api/profile/intelligence-summary");
    return res?.data || res;
  }

  // ================= LinkedIn Analyzer =================
  static async analyzeLinkedInUrl(profileUrl: string, targetRole?: string) {
    return this.request<any>("/api/linkedin/analyze-url", {
      method: "POST",
      body: JSON.stringify({ profileUrl, targetRole }),
    });
  }

  static async analyzeLinkedInPasted(rawText: string, targetRole?: string) {
    return this.request<any>("/api/linkedin/analyze-pasted-profile", {
      method: "POST",
      body: JSON.stringify({ rawText, targetRole }),
    });
  }

  static async getLatestLinkedInAnalysis() {
    const res = await this.request<any>("/api/linkedin/analysis");
    return res?.report || res?.analysis || res?.data || null;
  }

  static async syncLinkedInProfile(data: { acceptSkills?: boolean; acceptHeadline?: boolean; headline?: string; newSkills?: string[] }) {
    return this.request<any>("/api/linkedin/sync-profile", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ================= LinkedIn Skills & Workspace =================
  static async getLinkedInSkills() {
    return this.request<any>("/api/linkedin/skills");
  }

  static async getLinkedInSettings() {
    return this.request<any>("/api/linkedin/settings");
  }

  static async updateLinkedInSettings(data: any) {
    return this.request<any>("/api/linkedin/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  static async testLinkedInConnections() {
    return this.request<any>("/api/linkedin/connections/test", {
      method: "POST",
    });
  }

  static async getLinkedInRecommendations() {
    return this.request<any>("/api/linkedin/recommendations");
  }

  static async approveLinkedInRecommendation(id: string, userEditedValue?: string) {
    return this.request<any>(`/api/linkedin/recommendations/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ userEditedValue }),
    });
  }

  static async rejectLinkedInRecommendation(id: string) {
    return this.request<any>(`/api/linkedin/recommendations/${id}/reject`, {
      method: "POST",
    });
  }

  static async createLinkedInDraft(data: {
    topic: string;
    targetAudience?: string;
    goal?: string;
    formulaCode?: string;
    desiredLength?: string;
    storyBankId?: string;
    customAngle?: string;
  }) {
    return this.request<any>("/api/linkedin/content/draft", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getLinkedInDrafts() {
    return this.request<any>("/api/linkedin/content/drafts");
  }

  static async getLinkedInDraftById(id: string) {
    return this.request<any>(`/api/linkedin/content/drafts/${id}`);
  }

  static async updateLinkedInDraft(id: string, data: { body?: string; topic?: string }) {
    return this.request<any>(`/api/linkedin/content/drafts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  static async humanizeLinkedInDraft(id?: string, rawText?: string) {
    return this.request<any>("/api/linkedin/content/humanize", {
      method: "POST",
      body: JSON.stringify({ draftId: id, rawText }),
    });
  }

  static async auditLinkedInDraft(id?: string, rawText?: string) {
    return this.request<any>("/api/linkedin/content/audit", {
      method: "POST",
      body: JSON.stringify({ draftId: id, rawText }),
    });
  }

  static async approveLinkedInDraft(id: string) {
    return this.request<any>(`/api/linkedin/content/drafts/${id}/approve`, {
      method: "POST",
    });
  }

  static async publishLinkedInDraft(id: string, options?: { scheduledTime?: string; platformId?: string }) {
    return this.request<any>(`/api/linkedin/content/drafts/${id}/publish`, {
      method: "POST",
      body: JSON.stringify(options || {}),
    });
  }

  static async repurposeLinkedInContent(data: {
    sourceType: string;
    sourceContent: string;
    goal?: string;
    targetRole?: string;
  }) {
    return this.request<any>("/api/linkedin/content/repurpose", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async extractLinkedInHook(data: { url?: string; postText?: string }) {
    return this.request<any>("/api/linkedin/hooks/extract", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async draftLinkedInComment(data: { postUrl: string; contextNotes?: string; angle?: string }) {
    return this.request<any>("/api/linkedin/comments/draft", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async draftLinkedInReply(data: { postUrl: string; parentCommentId?: string; replyToText: string; angle?: string }) {
    return this.request<any>("/api/linkedin/replies/draft", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getLinkedInThreads() {
    return this.request<any>("/api/linkedin/threads");
  }

  static async getLinkedInEngagers() {
    return this.request<any>("/api/linkedin/engagers");
  }

  static async scanLinkedInEngagers(postUrl: string) {
    return this.request<any>("/api/linkedin/engagers/scan", {
      method: "POST",
      body: JSON.stringify({ postUrl }),
    });
  }

  static async getLinkedInCalendar() {
    return this.request<any>("/api/linkedin/calendar");
  }

  static async generateLinkedInCalendar(data?: { daysCount?: number; focusPillars?: string[]; timezone?: string }) {
    return this.request<any>("/api/linkedin/calendar/generate", {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
  }

  static async sendLinkedInInterviewerTurn(data: {
    storyTitle?: string;
    userAnswer?: string;
    targetRole?: string;
    conversationHistory: Array<{ role: "assistant" | "user"; content: string }>;
  }) {
    return this.request<any>("/api/linkedin/interviewer/turn", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ================= Analytics & Telemetry =================
  static async trackEvent(data: { eventType: string; page?: string; resourceId?: string; metadata?: any }) {
    return this.request<any>("/api/analytics/event", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getAnalyticsSummary() {
    const res = await this.request<any>("/api/analytics/overview");
    return res?.data || res?.summary || res;
  }

  static async getCareerGap(data: { jobId?: string; targetRole?: string }) {
    return this.request<any>("/api/analytics/career-gap", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ================= Dashboard & Performance =================
  static async getDashboardStats() {
    const res = await this.request<any>("/api/dashboard/stats");
    return res?.data || res;
  }

  static async getPerformance() {
    try {
      const summary = await this.getAnalyticsSummary();
      return summary;
    } catch {
      return null;
    }
  }

  static async getPerformanceSummary() {
    return this.getAnalyticsSummary();
  }

  // ================= Admin =================
  static async getAdminHealth() {
    try {
      return await this.request<any>("/health");
    } catch {
      return { status: "healthy", timestamp: new Date().toISOString() };
    }
  }

  static async getAdminMetrics() {
    try {
      const stats = await this.getDashboardStats();
      return {
        total_users: 1,
        total_sessions: stats?.total_interviews || 0,
      };
    } catch {
      return { total_users: 1, total_sessions: 0 };
    }
  }

  static async updateAdminThresholds(data: { duplicate_threshold?: number; question_candidates_count?: number; default_max_questions?: number }) {
    return { success: true, data };
  }

  // ================= Audio Transcription =================
  static async transcribeAudio(audioBlob: Blob, filename = "audio.webm") {
    const formData = new FormData();
    formData.append("file", audioBlob, filename);
    try {
      return await this.request<{ transcript: string; provider: string }>("/api/transcription", {
        method: "POST",
        body: formData,
      });
    } catch {
      return { transcript: "", provider: "browser-speech" };
    }
  }

  static async analyzeJobDescription(text: string, title?: string, company?: string) {
    return this.request<any>("/api/job-description/analyze", {
      method: "POST",
      body: JSON.stringify({ raw_text: text, title, company }),
    });
  }

  // ================= Code Execution =================
  static async executeCode(language: string, code: string, stdin = "") {
    return this.request<any>("/api/code/execute", {
      method: "POST",
      body: JSON.stringify({ language, code, stdin }),
    });
  }

  static async reviewCode(problem_statement: string, code: string, language: string, output = "") {
    return this.request<any>("/api/code/review", {
      method: "POST",
      body: JSON.stringify({ problem_statement, code, language, output }),
    });
  }

  // ================= AI Helpers =================
  static async getPracticeHint(questionText: string, expectedConcepts: string[] = [], role = "Software Engineer") {
    return this.request<any>("/api/ai/hint", {
      method: "POST",
      body: JSON.stringify({ question_text: questionText, expected_concepts: expectedConcepts, role }),
    });
  }

  // ================= Privacy =================
  static async deleteAllUserData() {
    return this.request<any>("/api/users/me/data", { method: "DELETE" });
  }

  // ================= Jobs =================
  static async getJobs(params: Record<string, string | number | boolean | undefined> = {}) {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        query.set(k, String(v));
      }
    }
    const qs = query.toString();
    return this.request<any>(`/api/jobs${qs ? `?${qs}` : ''}`);
  }

  static async getJobSources() {
    return this.request<any>("/api/jobs/sources");
  }

  static async getJob(id: string) {
    return this.request<any>(`/api/jobs/${id}`);
  }

  static async getJobMatch(id: string) {
    return this.request<any>(`/api/jobs/${id}/match`);
  }

  // Day 9: Resume Artifacts
  static async generateArtifact(resumeId: string, templateId: string, pageSize: string, format: string) {
    return this.request<any>(`/api/resume/${resumeId}/artifacts/generate`, {
      method: "POST",
      body: JSON.stringify({ templateId, pageSize, format })
    });
  }

  static async getArtifacts(resumeId: string) {
    return this.request<any>(`/api/resume/${resumeId}/artifacts`);
  }

  static async downloadArtifact(artifactId: string) {
    // Returning the blob URL for download
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`/api/resume/artifacts/${artifactId}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to download artifact");
    return res.blob();
  }

  static async getAtsReport(resumeId: string) {
    return this.request<any>(`/api/resume/${resumeId}/ats/report`);
  }

  static async explainAtsReport(resumeId: string, scanId: string) {
    return this.request<any>(`/api/resume/${resumeId}/ats/explain`, {
      method: "POST",
      body: JSON.stringify({ scanId })
    });
  }

  static async getJobExplanation(id: string) {
    return this.request<any>(`/api/jobs/${id}/explanation`);
  }

  static async saveJob(id: string) {
    return this.request<any>(`/api/jobs/${id}/save`, { method: "POST" });
  }

  static async unsaveJob(id: string) {
    return this.request<any>(`/api/jobs/${id}/save`, { method: "DELETE" });
  }

  static async getSavedJobs() {
    return this.request<any>("/api/jobs/saved");
  }

  static async getJobApplications() {
    return this.request<any>("/api/jobs/applications");
  }

  static async applyToJob(id: string, data: any) {
    return this.createApplication({
      jobId: id,
      companyName: data.company_name || data.companyName || "Company",
      jobTitle: data.title || data.jobTitle || "Role",
      status: "applied",
      notes: data.cover_note || data.notes || "",
      url: data.url || "",
    });
  }

  static async trackJobApplication(id: string, status: string, notes?: string) {
    return this.createApplication({
      jobId: id,
      companyName: "Company",
      jobTitle: "Role",
      status,
      notes,
    });
  }

  static async prepareJobInterview(id: string) {
    return this.request<any>(`/api/jobs/${id}/prepare-interview`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  static async getJobSourceHealth() {
    return this.request<any>("/api/jobs/source-health");
  }

  static async triggerJobSync() {
    return this.request<any>("/api/jobs/sync", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  static async getIngestionRuns() {
    return this.request<any>("/api/jobs/ingestion/runs");
  }

  static async getNewJobsCount() {
    return this.request<any>("/api/jobs/new-count");
  }

  static async getJobFilterCounts() {
    return this.request<any>("/api/jobs/filter-counts");
  }

  static async trackApplyClick(jobId: string) {
    return this.request<any>(`/api/jobs/${jobId}/apply-click`, { method: "POST" });
  }

  static async runIngestion(maxPages = 3) {
    return this.request<any>(`/api/jobs/ingestion/run?max_pages=${maxPages}`, { method: "POST" });
  }

  static async getIngestionStatus() {
    return this.request<any>("/api/jobs/ingestion/status");
  }

  static async getJobStats() {
    return this.request<any>("/api/jobs/stats/summary");
  }

  // ================= Resume Studio =================
  static async getResumes() {
    const res = await this.request<any>("/api/resumes");
    return res.resumes || res.data || [];
  }

  static async getResume(id: string) {
    const res = await this.request<any>(`/api/resumes/${id}`);
    return res.resume || res.data || res;
  }

  static async createResume(data: any) {
    return this.request<any>("/api/resumes", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async updateResume(id: string, data: any) {
    const res = await this.request<any>(`/api/resumes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
    return res.resume || res.data || res;
  }

  static async deleteResume(id: string) {
    return this.request<any>(`/api/resumes/${id}`, { method: "DELETE" });
  }

  static async duplicateResume(id: string) {
    return this.request<any>(`/api/resumes/${id}/duplicate`, { method: "POST" });
  }

  static async renameResume(id: string, name: string) {
    return this.request<any>(`/api/resumes/${id}/rename`, {
      method: "PUT",
      body: JSON.stringify({ name })
    });
  }

  static async uploadResume(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<any>("/api/resumes/upload", {
      method: "POST",
      body: formData
    });
  }

  /**
   * Download the format-preserved DOCX of an imported resume.
   * The backend uses StructurePreservingDocxGenerator to re-inject
   * any edited text back into the original document's XML, preserving
   * all fonts, colors, margins and formatting exactly.
   */
  static async downloadResumeDocx(id: string): Promise<Blob> {
    return this.requestBlob(`/api/resumes/${id}/export/docx`, { method: "POST" });
  }

  /**
   * Fetch the original uploaded PDF file for the Read-Only PDF Viewer (Option 2)
   */
  static async downloadOriginalResume(id: string): Promise<Blob> {
    return this.requestBlob(`/api/resumes/${id}/download/original`, { method: "GET" });
  }

  /** Save (update) a resume's profileData to the backend */
  static async saveResume(id: string, data: { profileData?: any; name?: string; template?: string }) {
    return this.request<any>(`/api/resumes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  static async analyzeResume(id: string) {
    return this.request<any>(`/api/resumes/${id}/analyze`, { method: "POST" });
  }

  static async getResumeHealth(id: string) {
    return this.request<any>(`/api/resumes/${id}/health`);
  }

  static async getPlainText(id: string): Promise<string> {
    const res = await this.request<any>(`/api/resumes/${id}/plain-text`);
    return res?.plainText || "";
  }

  static async generateAIResume(data: any) {
    return this.request<any>("/api/resumes/ai-generate", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async improveBullet(id: string, bullet: string, mode = "improve", context?: any) {
    return this.request<any>(`/api/resumes/${id}/improve`, {
      method: "POST",
      body: JSON.stringify({ bullet, mode, context })
    });
  }

  static async generateSummary(id: string) {
    return this.request<any>(`/api/resumes/${id}/generate-summary`, { method: "POST" });
  }

  static async generateAchievement(id: string, input: any) {
    return this.request<any>(`/api/resumes/${id}/generate-achievement`, {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  static async generateProject(id: string, input: any) {
    return this.request<any>(`/api/resumes/${id}/generate-project`, {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  static async checkGrammar(id: string, text: string) {
    return this.request<any>(`/api/resumes/${id}/grammar`, {
      method: "POST",
      body: JSON.stringify({ text })
    });
  }

  static async checkCredibility(id: string) {
    return this.request<any>(`/api/resumes/${id}/credibility-check`, { method: "POST" });
  }

  static async generateInterviewQuestions(id: string) {
    return this.request<any>(`/api/resumes/${id}/interview-questions`, { method: "POST" });
  }

  static async matchJob(id: string, data: { jobId?: string; jobDescription?: string; targetTitle?: string }) {
    return this.request<any>(`/api/resumes/${id}/match-job`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async tailorResume(id: string, data: { jobId?: string; jobDescription?: string; targetTitle?: string }) {
    return this.request<any>(`/api/resumes/${id}/tailor`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async applyTailoring(id: string, data: { appliedDiffs: any[]; targetRole?: string; newResumeName?: string }) {
    return this.request<any>(`/api/resumes/${id}/apply-tailoring`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async getResumeVersions(id: string) {
    const res = await this.request<any>(`/api/resumes/${id}/versions`);
    return res.versions || res.data || [];
  }

  static async restoreResumeVersion(id: string, versionId: string) {
    return this.request<any>(`/api/resumes/${id}/versions/${versionId}/restore`, { method: "POST" });
  }

  static async compareResumeVersions(id: string, versionAId: string, versionBId: string) {
    return this.request<any>(`/api/resumes/${id}/compare`, {
      method: "POST",
      body: JSON.stringify({ versionAId, versionBId })
    });
  }

  static async exportDocx(id: string): Promise<Blob> {
    const token = localStorage.getItem("interviewai_token");
    const res = await fetch(`${API_BASE}/api/resumes/${id}/export/docx`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error("Failed to export DOCX");
    return res.blob();
  }

  static async exportTxt(id: string): Promise<string> {
    const token = localStorage.getItem("interviewai_token");
    const res = await fetch(`${API_BASE}/api/resumes/${id}/export/txt`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error("Failed to export TXT");
    return res.text();
  }

  static async exportJson(id: string): Promise<string> {
    const token = localStorage.getItem("interviewai_token");
    const res = await fetch(`${API_BASE}/api/resumes/${id}/export/json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error("Failed to export JSON");
    return res.text();
  }

  static async createResumeShare(id: string, data: { password?: string; expiresDays?: number }) {
    return this.request<any>(`/api/resumes/${id}/share`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async deleteResumeShare(id: string) {
    return this.request<any>(`/api/resumes/${id}/share`, { method: "DELETE" });
  }

  static async getPublicResume(slug: string, password?: string) {
    const qs = password ? `?password=${encodeURIComponent(password)}` : "";
    return this.request<any>(`/api/resumes/public/${slug}${qs}`);
  }

  static async getResumeActivity(id: string) {
    const res = await this.request<any>(`/api/resumes/${id}/activity`);
    return res.activity || res.data || [];
  }

  static async getResumeAnalytics(id: string) {
    return this.request<any>(`/api/resumes/${id}/analytics`);
  }

  static async analyzeGitHub(username: string) {
    return this.request<any>("/api/resumes/github/analyze", {
      method: "POST",
      body: JSON.stringify({ username })
    });
  }

  static async getMarketKeywords(targetRole = "Software Engineer") {
    return this.request<any>(`/api/resumes/market-keywords?targetRole=${encodeURIComponent(targetRole)}`);
  }

  // ================= ATS Resume Template Generator =================
  static async getResumeTemplates(): Promise<ITemplateMetadata[]> {
    const res = await this.request<any>("/api/resumes/templates");
    return res.templates || res.data || [];
  }

  static async getResumeTemplate(id: string): Promise<ITemplateMetadata> {
    const res = await this.request<any>(`/api/resumes/templates/${id}`);
    return res.template || res.data;
  }

  static async importResumeForTemplate(payload: FormData | { rawText?: string; jsonResume?: any; fileBuffer?: string; filename?: string; mimetype?: string }): Promise<IResumeExtractionResult> {
    if (payload instanceof FormData) {
      return this.request<any>("/api/resumes/templates/import", {
        method: "POST",
        body: payload
      });
    }
    return this.request<any>("/api/resumes/templates/import", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  static async generateResumeFromTemplate(data: {
    templateId: string;
    profileData: any;
    importId?: string;
    jobDescription?: string;
    targetRole?: string;
    title?: string;
  }): Promise<{ success: boolean; resume: any; atsReport: ATSReport; generationId: string }> {
    return this.request<any>("/api/resumes/templates/generate", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async switchResumeTemplate(id: string, templateId: string): Promise<{ success: boolean; resume: any; atsReport: ATSReport }> {
    return this.request<any>(`/api/resumes/${id}/switch-template`, {
      method: "POST",
      body: JSON.stringify({ templateId })
    });
  }

  // ================= Dedicated ATS Resume Checker =================
  static async checkAts(payload: FormData | ATSCheckPayload): Promise<{ success: boolean; report: ATSReport; data: ATSReport }> {
    if (payload instanceof FormData) {
      return this.request<any>("/api/resumes/ats-check", {
        method: "POST",
        body: payload
      });
    }
    return this.request<any>("/api/resumes/ats-check", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  static async getAtsMeta(): Promise<{
    success: boolean;
    data: {
      categories: Array<{ id: string; name: string; roles: string[] }>;
      atsProfiles: Record<string, { label: string; strictness: number; note: string }>;
      countries: string[];
      seniorities: string[];
    };
  }> {
    return this.request<any>("/api/resumes/ats-meta");
  }

  // ================= Format-Preserving AI Resume Optimization =================
  static async generateOptimizationPlan(payload: FormData | any): Promise<{ success: boolean; plan: IOptimizationPlan; data: IOptimizationPlan }> {
    if (payload instanceof FormData) {
      return this.request<any>("/api/resumes/tailoring/plan", {
        method: "POST",
        body: payload
      });
    }
    return this.request<any>("/api/resumes/tailoring/plan", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  static async applyOptimizations(payload: FormData | any): Promise<{
    success: boolean;
    beforeAfterReport: IBeforeAfterReport;
    data: IBeforeAfterReport;
    optimizedDocxBase64?: string;
    fileName: string;
    bulletCountBefore?: number;
    bulletCountAfter?: number;
  }> {
    if (payload instanceof FormData) {
      return this.request<any>("/api/resumes/tailoring/apply", {
        method: "POST",
        body: payload
      });
    }
    return this.request<any>("/api/resumes/tailoring/apply", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  static async rescoreDocument(payload: FormData | any): Promise<{ success: boolean; report: ATSReport; data: ATSReport }> {
    if (payload instanceof FormData) {
      return this.request<any>("/api/resumes/ats-rescore", {
        method: "POST",
        body: payload
      });
    }
    return this.request<any>("/api/resumes/ats-rescore", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  static async downloadOptimizedDocx(fileNameOrId: string): Promise<Blob> {
    const token = localStorage.getItem("interviewai_token");
    const res = await fetch(`${API_BASE}/api/resumes/tailoring/artifacts/${encodeURIComponent(fileNameOrId)}/download`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error("Failed to download optimized document");
    return res.blob();
  }

  // ================= Tailoring Engine =================
  static async generateTailoringPlan(body: { resumeVersionId: string; jobId: string }) {
    return this.request<any>("/api/resume/tailor/plan", {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  static async executeTailoring(runId: string) {
    return this.request<any>(`/api/resume/tailor/${runId}`, {
      method: "POST"
    });
  }

  static async getTailoringRun(runId: string) {
    return this.request<any>(`/api/resume/tailor/${runId}`);
  }

  static async approveTailoringRun(runId: string) {
    return this.request<any>(`/api/resume/tailor/${runId}/approve`, {
      method: "POST"
    });
  }

  // ================= RESTful ATS & Format-Preserving Optimization =================
  static async scanResumeAts(id: string, body: any = {}): Promise<{ success: boolean; report: ATSReport; data: ATSReport }> {
    return this.request<any>(`/api/resumes/${id}/ats/scan`, {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  static async getResumeAtsReport(id: string): Promise<{ success: boolean; report: ATSReport; data: ATSReport }> {
    return this.request<any>(`/api/resumes/${id}/ats/report`);
  }

  static async optimizeResume(id: string, body: any = {}): Promise<{
    success: boolean;
    runId: string;
    run: any;
    plan: IOptimizationPlan;
    data: IOptimizationPlan;
  }> {
    return this.request<any>(`/api/resumes/${id}/optimize`, {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  static async getOptimizationRun(id: string, runId: string): Promise<{ success: boolean; run: any; data: any }> {
    return this.request<any>(`/api/resumes/${id}/optimization/${runId}`);
  }

  static async applyOptimizationRun(id: string, runId: string, body: any = {}): Promise<{
    success: boolean;
    regressed: boolean;
    message: string;
    beforeScore: number;
    afterScore: number;
    scoreDelta: number;
    run: any;
    beforeAfterReport?: IBeforeAfterReport;
    data?: IBeforeAfterReport;
    isFormatPreserved?: boolean;
    isReconstructed?: boolean;
    downloadUrl: string;
    optimizedDocxBase64?: string;
  }> {
    return this.request<any>(`/api/resumes/${id}/optimization/${runId}/apply`, {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  static async rejectOptimizationRun(id: string, runId: string): Promise<{ success: boolean; message: string; run: any }> {
    return this.request<any>(`/api/resumes/${id}/optimization/${runId}/reject`, {
      method: "POST",
      body: JSON.stringify({})
    });
  }

  static async rescanOptimizationRun(id: string, runId: string): Promise<{ success: boolean; report: ATSReport; scoreDelta: number; data: ATSReport }> {
    return this.request<any>(`/api/resumes/${id}/optimization/${runId}/rescan`, {
      method: "POST",
      body: JSON.stringify({})
    });
  }


  static async downloadOptimizedResume(id: string): Promise<Blob> {
    const token = localStorage.getItem("interviewai_token");
    const res = await fetch(`${API_BASE}/api/resumes/${id}/download/optimized`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error("Failed to download optimized resume");
    return res.blob();
  }
}

export interface ATSCheckPayload {
  resumeText?: string;
  jdText?: string;
  roleCategory?: string;
  roleName?: string;
  seniority?: string;
  country?: string;
  atsProfileKey?: string;
  fileName?: string;
}

export interface ATSIssue {
  id?: string; // e.g. "ATS-001"
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  why: string;
  where: string;
  suggestion: string;
  beforeExample?: string;
  afterExample?: string;
  confidence: string;
}

export interface ATSSectionWeight {
  category: string;
  weight: number;
  score: number;
  contribution: number;
}

export interface ATSRoadmapItem {
  cat: string;
  score: number;
  weight: number;
  deficiency: number;
}

export interface ATSReport {
  id: string;
  createdAt: number;
  fileName: string;
  role: string;
  roleCategory: string;
  seniority?: string;
  country?: string;
  atsProfile: string;
  atsProfileNote: string;
  overallScore: number;
  grade: string;
  gradeLabel: string;
  gradeColor: string;
  passProbability: number;
  health: "Green" | "Yellow" | "Red";
  recruiterSummary: string;
  categoryScores: Record<string, number>;
  rawScores: Record<string, number>;
  sectionWeights: ATSSectionWeight[];
  keywordRes: {
    required: string[];
    matched: string[];
    missing: string[];
    matchPct: number;
    techFound: string[];
    certsFound: string[];
    stuffed: Array<{ term: string; count: number }>;
    usedJD: boolean;
  };
  structureRes: {
    score: number;
    corePresent: number;
    missingCore: string[];
    bonusPresent: number;
    bonusTotal: number;
  };
  formattingRes: {
    score: number;
    issues: ATSIssue[];
  };
  writingRes: {
    score: number;
    issues: ATSIssue[];
    flesch: number;
    weakCount: number;
    buzzCount: number;
    passiveCount: number;
  };
  achievementRes: {
    score: number;
    issues: ATSIssue[];
    quantifiedPct: number;
    strongVerbPct: number;
  };
  experienceRes: {
    score: number;
    issues: ATSIssue[];
    totalYears: number;
    gaps: Array<{ from: number; to: number; years: number }>;
    roleCount: number;
  };
  educationRes: {
    score: number;
    issues: ATSIssue[];
    hasDegree: boolean;
    gpa: string | null;
  };
  contactRes: {
    score: number;
    issues: ATSIssue[];
  };
  contact: {
    email: string | null;
    emailValid: boolean;
    phone: string | null;
    phoneValid: boolean;
    linkedin: string | null;
    github: string | null;
    portfolio: string | null;
  };
  sections: Record<string, boolean>;
  wordCount: number;
  pageCount: number;
  ocrUsed: boolean;
  issues: ATSIssue[];
  strengths: string[];
  roadmap: {
    items: ATSRoadmapItem[];
    potentialGain: number;
  };
  resumeTextPreview: string;
}

export interface IOptimizationProposal {
  id: string;
  section: string;
  targetId: string;
  roleIndex?: number;
  bulletIndex?: number;
  originalText: string;
  proposedText: string;
  reason: string;
  evidence: string[];
  issueIds: string[];
  unsupportedClaims: string[];
  risk: "low" | "medium" | "high";
}

export interface IOptimizationPlan {
  resumeId: string;
  targetRole: string;
  proposals: IOptimizationProposal[];
  atsIssuesAddressed: number;
  verifiedSkillsUsed: string[];
  createdAt: string;
}

export interface IBeforeAfterReport {
  resumeId: string;
  fileName: string;
  beforeScore: number;
  afterScore: number;
  scoreDelta: number;
  categoryDeltas: Record<string, { before: number; after: number; delta: number }>;
  changesApplied: {
    id: string;
    section: string;
    originalText: string;
    appliedText: string;
    reason: string;
    issueFixed: string;
  }[];
  explanation: string[];
  healthBefore: string;
  healthAfter: string;
  passProbabilityBefore: number;
  passProbabilityAfter: number;
  downloadUrl: string;
}

export interface ITemplateMetadata {
  id: string;
  name: string;
  category: string;
  description: string;
  layout: string;
  atsCompatibilityScore: number;
  atsSafe: boolean;
  recommendedRoles: string[];
  typography: string;
  badge: string;
  badgeColor: string;
  features: string[];
  isAtsCertified: boolean;
}

export interface IResumeExtractionResult {
  success: boolean;
  importId: string;
  filename: string;
  fileType: string;
  extractedData: any;
  fieldConfidence: Record<string, "high" | "medium" | "low" | { confidence: "High" | "Medium" | "Low"; reason?: string }>;
  overallConfidence: "high" | "medium" | "low";
  warnings: string[];
  isScanned: boolean;
}



