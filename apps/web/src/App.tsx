import { Routes, Route, useLocation } from 'react-router-dom';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';

import { ProtectedRoute } from './components/common/ProtectedRoute'
import { Sidebar } from './components/common/Sidebar'

// Public pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PrivacyPage from './pages/PrivacyPage'
import PublicResumePage from './pages/PublicResumePage'

// Protected pages
import DashboardPage from './pages/DashboardPage'
import SetupPage from './pages/SetupPage'
import InterviewRoomPage from './pages/InterviewRoomPage'
import ReportPage from './pages/ReportPage'
import HistoryPage from './pages/HistoryPage'
import PerformancePage from './pages/PerformancePage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'

// Job Discovery & Career Tools (protected)
import JobsPage from './pages/JobsPage'
import JobDetailPage from './pages/JobDetailPage'
import TailorResumePage from './pages/TailorResumePage'
import JobApplicationPage from './pages/JobApplicationPage'
import SavedJobsPage from './pages/SavedJobsPage'
import SourceHealthPage from './pages/SourceHealthPage'
import ApplicationsPage from './pages/ApplicationsPage'
import AutoApplyPage from './pages/AutoApplyPage'
import OutreachPage from './pages/OutreachPage'
import LinkedInPage from './pages/LinkedInPage'
import PortfolioPage from './pages/PortfolioPage'
import ResumeStudioPage from './pages/ResumeStudioPage'
import InterviewIntelligencePage from './pages/InterviewIntelligencePage'
import StoryBankPage from './pages/StoryBankPage'
import InterviewDebriefPage from './pages/InterviewDebriefPage'
import ImportedDocxEditorPage from './pages/ImportedDocxEditorPage'

export default function App() {
  const location = useLocation();
  const isBuilderRoute = location.pathname.includes('/resume') || location.pathname.includes('/ats') || location.pathname.includes('/studio');

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-emerald-500/5 blur-3xl rounded-full" />
        <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-indigo-500/5 blur-3xl rounded-full" />
      </div>

      {/* Responsive Sidebar (replaces old Navbar) */}
      {!isBuilderRoute && <Sidebar />}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-x-hidden ${isBuilderRoute ? 'w-screen h-screen' : ''}`}>
        <main className="flex-1 relative z-10">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/resume/public/:slug" element={<PublicResumePage />} />
            <Route path="/ats" element={<ResumeStudioPage />} />
            <Route path="/resume-checker" element={<ResumeStudioPage />} />

            {/* Core Practice routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/setup" element={<ProtectedRoute><SetupPage /></ProtectedRoute>} />
            <Route path="/interview/:id" element={<ProtectedRoute><InterviewRoomPage /></ProtectedRoute>} />
            <Route path="/report/:id" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/performance" element={<ProtectedRoute><PerformancePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />

            {/* Job Discovery & Career Copilot routes */}
            <Route path="/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
            <Route path="/jobs/saved" element={<ProtectedRoute><SavedJobsPage /></ProtectedRoute>} />
            <Route path="/jobs/:id/apply" element={<ProtectedRoute><JobApplicationPage /></ProtectedRoute>} />
            <Route path="/jobs/:id" element={<ProtectedRoute><JobDetailPage /></ProtectedRoute>} />
            <Route path="/jobs/:id/tailor" element={<ProtectedRoute><TailorResumePage /></ProtectedRoute>} />
            <Route path="/applications" element={<ProtectedRoute><ApplicationsPage /></ProtectedRoute>} />
            <Route path="/auto-apply" element={<ProtectedRoute><AutoApplyPage /></ProtectedRoute>} />
            <Route path="/resume" element={<ProtectedRoute><ResumeStudioPage /></ProtectedRoute>} />
            <Route path="/resume/studio" element={<ProtectedRoute><ResumeStudioPage /></ProtectedRoute>} />
            <Route path="/resume/imported/:id" element={<ProtectedRoute><ImportedDocxEditorPage /></ProtectedRoute>} />
            <Route path="/outreach" element={<ProtectedRoute><OutreachPage /></ProtectedRoute>} />
            <Route path="/linkedin" element={<ProtectedRoute><LinkedInPage /></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
            <Route path="/studio" element={<ProtectedRoute><ResumeStudioPage /></ProtectedRoute>} />
            <Route path="/intelligence/:id" element={<ProtectedRoute><InterviewIntelligencePage /></ProtectedRoute>} />
            <Route path="/stories" element={<ProtectedRoute><StoryBankPage /></ProtectedRoute>} />
            <Route path="/debrief/:id" element={<ProtectedRoute><InterviewDebriefPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/admin/sources" element={<ProtectedRoute><SourceHealthPage /></ProtectedRoute>} />

            {/* 404 fallback */}
            <Route path="*" element={<div className="min-h-[80vh] flex items-center justify-center text-slate-400 text-sm">Page not found</div>} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
