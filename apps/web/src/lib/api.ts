const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("interviewai_token");
  }

  public static setToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("interviewai_token", token);
    }
  }

  public static clearToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("interviewai_token");
      localStorage.removeItem("interviewai_user");
    }
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
        window.location.href = "/auth/login";
      }
      throw new Error("Unauthorized. Please log in.");
    }

    if (!res.ok) {
      let errorMsg = `Request failed (${res.status})`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    if (res.status === 204) {
      return null as T;
    }

    return res.json();
  }

  // ================= Auth =================
  static async register(data: { email: string; password: string; full_name: string }) {
    const res = await this.request<any>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.access_token) {
      this.setToken(res.access_token);
      localStorage.setItem("interviewai_user", JSON.stringify(res.user));
    }
    return res;
  }

  static async login(data: { email: string; password: string }) {
    const res = await this.request<any>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.access_token) {
      this.setToken(res.access_token);
      localStorage.setItem("interviewai_user", JSON.stringify(res.user));
    }
    return res;
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
    return this.request<any[]>("/api/interviews");
  }

  static async getInterview(id: string) {
    return this.request<any>(`/api/interviews/${id}`);
  }

  static async submitAnswer(sessionId: string, data: { question_id: string; answer_text: string; code_submission?: string; duration_seconds?: number }) {
    return this.request<any>(`/api/interviews/${sessionId}/answers`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Requests the backend to generate and return the next question for this session.
   * The backend runs the full dedup + category-rotation + AI pipeline.
   * The frontend MUST call this instead of computing the next question locally.
   */
  static async getNextQuestion(sessionId: string) {
    return this.request<any>(`/api/interviews/${sessionId}/next-question`, {
      method: "POST",
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
    });
  }

  static async deleteInterview(sessionId: string) {
    return this.request<any>(`/api/interviews/${sessionId}`, {
      method: "DELETE",
    });
  }

  // ================= Dashboard & Performance Analytics =================
  static async getDashboardStats() {
    return this.request<any>("/api/dashboard/stats");
  }

  static async getPerformance() {
    return this.request<any>("/api/performance");
  }

  static async getPerformanceSummary() {
    return this.request<any>("/api/performance/summary");
  }

  // ================= Admin =================
  static async getAdminHealth() {
    return this.request<any>("/api/admin/system-health");
  }

  static async getAdminMetrics() {
    return this.request<any>("/api/admin/metrics");
  }

  static async updateAdminThresholds(data: { duplicate_threshold?: number; question_candidates_count?: number; default_max_questions?: number }) {
    return this.request<any>("/api/admin/thresholds", {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  // ================= Audio Transcription =================
  static async transcribeAudio(audioBlob: Blob, filename = "audio.webm") {
    const formData = new FormData();
    formData.append("file", audioBlob, filename);
    return this.request<{ transcript: string; provider: string }>("/api/transcription", {
      method: "POST",
      body: formData,
    });
  }

  // ================= Resume & JD =================
  static async uploadResume(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<any>("/api/resume/analyze", {
      method: "POST",
      body: formData,
    });
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

  // ================= AI Direct Helpers =================
  static async getPracticeHint(questionText: string, expectedConcepts: string[] = [], role = "Software Engineer") {
    return this.request<any>("/api/ai/hint", {
      method: "POST",
      body: JSON.stringify({ question_text: questionText, expected_concepts: expectedConcepts, role }),
    });
  }

  // ================= Privacy =================
  static async deleteAllUserData() {
    return this.request<any>("/api/users/me/data", {
      method: "DELETE",
    });
  }
}
