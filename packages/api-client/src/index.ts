import axios, { AxiosInstance } from "axios";
import type {
  LoginRequest,
  RegisterRequest,
  JobQuery,
  CreateInterviewSession,
  SubmitAnswer,
  SkipQuestion,
  UpdateState,
} from "@interview-ai/contracts";

export class ApiClient {
  public client: AxiosInstance;

  constructor(baseURL: string = "http://localhost:8001") {
    this.client = axios.create({
      baseURL,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Auth Domain
  auth = {
    login: (data: LoginRequest) => this.client.post("/api/auth/login", data),
    register: (data: RegisterRequest) => this.client.post("/api/auth/register", data),
    logout: () => this.client.post("/api/auth/logout"),
    me: () => this.client.get("/api/auth/me"),
  };

  // Jobs Domain
  jobs = {
    search: (params?: JobQuery) => this.client.get("/api/jobs", { params }),
    getById: (id: string) => this.client.get(`/api/jobs/${id}`),
    saveJob: (id: string) => this.client.post(`/api/jobs/${id}/save`),
    getSavedJobs: () => this.client.get("/api/jobs/saved"),
  };

  // Interview Domain
  interview = {
    createSession: (data: CreateInterviewSession) => this.client.post("/api/interviews", data),
    getSession: (id: string) => this.client.get(`/api/interviews/${id}`),
    submitAnswer: (id: string, data: SubmitAnswer) => this.client.post(`/api/interviews/${id}/answer`, data),
    skipQuestion: (id: string, data: SkipQuestion) => this.client.post(`/api/interviews/${id}/skip`, data),
    updateState: (id: string, data: UpdateState) => this.client.patch(`/api/interviews/${id}/state`, data),
    completeSession: (id: string) => this.client.post(`/api/interviews/${id}/complete`),
    getReport: (id: string) => this.client.get(`/api/interviews/${id}/report`),
    generateReport: (id: string) => this.client.post(`/api/interviews/${id}/report/generate`),
  };

  // Resumes Domain
  resumes = {
    list: () => this.client.get("/api/resumes"),
    getById: (id: string) => this.client.get(`/api/resumes/${id}`),
    upload: (formData: FormData) =>
      this.client.post("/api/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    tailor: (id: string, jobDescription: string) =>
      this.client.post(`/api/resumes/${id}/tailor`, { jobDescription }),
    calculateAtsScore: (id: string, jobDescription?: string) =>
      this.client.post(`/api/resumes/${id}/ats-score`, { jobDescription }),
  };

  // Applications Domain
  applications = {
    list: () => this.client.get("/api/applications"),
    create: (data: any) => this.client.post("/api/applications", data),
    updateStatus: (id: string, status: string) =>
      this.client.patch(`/api/applications/${id}/status`, { status }),
  };

  // Profile Domain
  profile = {
    get: () => this.client.get("/api/profile"),
    update: (data: any) => this.client.put("/api/profile", data),
  };

  // Analytics Domain
  analytics = {
    getDashboard: () => this.client.get("/api/analytics/dashboard"),
    getCareerGaps: () => this.client.get("/api/analytics/career-gaps"),
  };
}

export const createApiClient = (baseURL?: string) => new ApiClient(baseURL);
