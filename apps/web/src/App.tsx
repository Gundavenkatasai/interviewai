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

// Warm Industrial Editorial Archetype Pages
const JobsPage = lazy(() => import('./pages/JobsPage'));
const JobsFlightBoardPage = lazy(() => import('./pages/JobsFlightBoardPage'));
const ResumeDraftingDeskPage = lazy(() => import('./pages/ResumeDraftingDeskPage'));
const ATSScanningBenchPage = lazy(() => import('./pages/ATSScanningBenchPage'));
const InterviewBroadcastStudioPage = lazy(() => import('./pages/InterviewBroadcastStudioPage'));
const ApplicationCardCatalogPage = lazy(() => import('./pages/ApplicationCardCatalogPage'));
const StoryBankRolodexPage = lazy(() => import('./pages/StoryBankRolodexPage'));
const CareerSwissChronometerPage = lazy(() => import('./pages/CareerSwissChronometerPage'));

// Core Practice & Management Pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SetupPage = lazy(() => import('./pages/SetupPage'));
const InterviewRoomPage = lazy(() => import('./pages/InterviewRoomPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const InterviewIntelligencePage = lazy(() => import('./pages/InterviewIntelligencePage'));
const InterviewDebriefPage = lazy(() => import('./pages/InterviewDebriefPage'));

// Job Discovery & Resume Pages
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const TailorResumePage = lazy(() => import('./pages/TailorResumePage'));
const SavedJobsPage = lazy(() => import('./pages/SavedJobsPage'));
const SourceHealthPage = lazy(() => import('./pages/SourceHealthPage'));
const LinkedInPage = lazy(() => import('./pages/LinkedIn/LinkedInWorkspacePage'));
const ResumeStudioPage = lazy(() => import('./pages/ResumeStudioPage'));
const ImportedDocxEditorPage = lazy(() => import('./pages/ImportedDocxEditorPage'));

function RouteLoadingFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 bg-[#F5F3EE]">
      <div className="w-8 h-8 rounded-md bg-[#C84B26] shadow-[0_2px_0_0_#983416] animate-pulse" />
      <span className="text-xs font-mono text-[#8C8479] tracking-wider uppercase">Calibrating Instrument...</span>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isBuilderRoute =
    location.pathname.includes('/resume/imported') ||
    location.pathname.includes('/studio/legacy');

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row bg-[#F5F3EE] text-[#181614] antialiased selection:bg-[#F4D4C9] selection:text-[#983416]">
      {/* Background Architectural Canvas Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[#F5F3EE]" />

      {/* Responsive Architectural Drawer */}
      {!isBuilderRoute && <Sidebar />}

      {/* Main Content Instrument Viewport */}
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

              {/* 1. Job Discovery (Live Requisition Feed) */}
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/flight-board" element={<JobsFlightBoardPage />} />
              <Route
                path="/jobs/saved"
                element={
                  <ProtectedRoute>
                    <SavedJobsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/jobs/:id" element={<JobDetailPage />} />
              <Route
                path="/jobs/:id/tailor"
                element={
                  <ProtectedRoute>
                    <TailorResumePage />
                  </ProtectedRoute>
                }
              />

              {/* 2. Resume Studio (Architect's Drafting Desk) */}
              <Route
                path="/resume"
                element={
                  <ProtectedRoute>
                    <ResumeDraftingDeskPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume/studio"
                element={
                  <ProtectedRoute>
                    <ResumeDraftingDeskPage />
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

              {/* 3. ATS Resume Checker (Optical Scanning Bench) */}
              <Route
                path="/resume/ats-checker"
                element={
                  <ProtectedRoute>
                    <ATSScanningBenchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ats"
                element={
                  <ProtectedRoute>
                    <ATSScanningBenchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume-checker"
                element={
                  <ProtectedRoute>
                    <ATSScanningBenchPage />
                  </ProtectedRoute>
                }
              />

              {/* 4. AI Mock Interview Stage (Broadcast Studio) */}
              <Route
                path="/interview/session/:id"
                element={
                  <ProtectedRoute>
                    <InterviewBroadcastStudioPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview/:id"
                element={
                  <ProtectedRoute>
                    <InterviewBroadcastStudioPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/setup"
                element={
                  <ProtectedRoute>
                    <InterviewBroadcastStudioPage />
                  </ProtectedRoute>
                }
              />

              {/* 5. Application Management (Card Catalog Rack) */}
              <Route
                path="/pipeline"
                element={
                  <ProtectedRoute>
                    <ApplicationCardCatalogPage />
                  </ProtectedRoute>
                }
              />

              {/* 6. STAR Story Bank (Journalist's Story Rolodex) */}
              <Route
                path="/stories"
                element={
                  <ProtectedRoute>
                    <StoryBankRolodexPage />
                  </ProtectedRoute>
                }
              />

              {/* 7. AI Career Analytics (Swiss Chronometer Deck) */}
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <CareerSwissChronometerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/performance"
                element={
                  <ProtectedRoute>
                    <CareerSwissChronometerPage />
                  </ProtectedRoute>
                }
              />

              {/* Other core routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
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
                path="/report/:id"
                element={
                  <ProtectedRoute>
                    <ReportPage />
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
                path="/settings"
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
              <Route
                path="/linkedin"
                element={
                  <ProtectedRoute>
                    <LinkedInPage />
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
                path="/debrief/:id"
                element={
                  <ProtectedRoute>
                    <InterviewDebriefPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/source-health"
                element={
                  <ProtectedRoute>
                    <SourceHealthPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
