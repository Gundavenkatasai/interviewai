import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Sidebar } from './components/common/Sidebar';

// Public pages - code-split with lazy loading
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PublicResumePage = lazy(() => import('./pages/PublicResumePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Protected practice & intelligence pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SetupPage = lazy(() => import('./pages/SetupPage'));
const InterviewRoomPage = lazy(() => import('./pages/InterviewRoomPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const PerformancePage = lazy(() => import('./pages/PerformancePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const InterviewIntelligencePage = lazy(() => import('./pages/InterviewIntelligencePage'));
const StoryBankPage = lazy(() => import('./pages/StoryBankPage'));
const InterviewDebriefPage = lazy(() => import('./pages/InterviewDebriefPage'));

// Job discovery & resume pages
const JobsPage = lazy(() => import('./pages/JobsPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const TailorResumePage = lazy(() => import('./pages/TailorResumePage'));
const SavedJobsPage = lazy(() => import('./pages/SavedJobsPage'));
const SourceHealthPage = lazy(() => import('./pages/SourceHealthPage'));
const LinkedInPage = lazy(() => import('./pages/LinkedIn/LinkedInWorkspacePage'));
const ResumeStudioPage = lazy(() => import('./pages/ResumeStudioPage'));
const ImportedDocxEditorPage = lazy(() => import('./pages/ImportedDocxEditorPage'));

function RouteLoadingFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
      <div className="w-10 h-10 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      <span className="text-xs font-medium text-slate-400">Loading view...</span>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isBuilderRoute =
    location.pathname.includes('/resume') ||
    location.pathname.includes('/ats') ||
    location.pathname.includes('/studio');

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-emerald-500/5 blur-3xl rounded-full" />
        <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-indigo-500/5 blur-3xl rounded-full" />
      </div>

      {/* Responsive Sidebar */}
      {!isBuilderRoute && <Sidebar />}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 overflow-x-hidden ${
          isBuilderRoute ? 'w-screen h-screen' : ''
        }`}
      >
        <main className="flex-1 relative z-10 flex flex-col min-h-full">
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/resume/public/:slug" element={<PublicResumePage />} />
              <Route path="/ats" element={<ResumeStudioPage />} />
              <Route path="/resume-checker" element={<ResumeStudioPage />} />

              {/* Core Practice routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/setup"
                element={
                  <ProtectedRoute>
                    <SetupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview/:id"
                element={
                  <ProtectedRoute>
                    <InterviewRoomPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report/:id"
                element={
                  <ProtectedRoute>
                    <ReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <HistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/performance"
                element={
                  <ProtectedRoute>
                    <PerformancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />

              {/* Job Discovery & Career Copilot routes */}
              <Route
                path="/jobs"
                element={
                  <ProtectedRoute>
                    <JobsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/saved"
                element={
                  <ProtectedRoute>
                    <SavedJobsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/:id"
                element={
                  <ProtectedRoute>
                    <JobDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/:id/tailor"
                element={
                  <ProtectedRoute>
                    <TailorResumePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume"
                element={
                  <ProtectedRoute>
                    <ResumeStudioPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume/studio"
                element={
                  <ProtectedRoute>
                    <ResumeStudioPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume/imported/:id"
                element={
                  <ProtectedRoute>
                    <ImportedDocxEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/linkedin"
                element={
                  <ProtectedRoute>
                    <LinkedInPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/studio"
                element={
                  <ProtectedRoute>
                    <ResumeStudioPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/intelligence/:id"
                element={
                  <ProtectedRoute>
                    <InterviewIntelligencePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stories"
                element={
                  <ProtectedRoute>
                    <StoryBankPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/debrief/:id"
                element={
                  <ProtectedRoute>
                    <InterviewDebriefPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sources"
                element={
                  <ProtectedRoute>
                    <SourceHealthPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
