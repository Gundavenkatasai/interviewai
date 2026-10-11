import { Link } from "react-router-dom";
import { Compass, Home, LayoutDashboard, Briefcase, PlayCircle, FileText, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl text-center space-y-8">
        {/* Glow & Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Compass className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Error 404 • Resource Not Found</span>
        </div>

        {/* 404 Headline */}
        <div className="space-y-3">
          <h1 className="text-6xl sm:text-7xl font-extrabold text-white tracking-tight">
            4<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">0</span>4
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Page Not Found
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            The page or resource you are looking for may have been moved, renamed, expired, or does not exist.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Quick Links Section */}
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm text-left space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Popular Destinations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <Link
              to="/jobs"
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all group flex items-center gap-2.5"
            >
              <Briefcase className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div className="text-xs">
                <div className="font-semibold text-white">Browse Jobs</div>
                <div className="text-[11px] text-slate-500">Tier-1 listings</div>
              </div>
            </Link>

            <Link
              to="/resume"
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all group flex items-center gap-2.5"
            >
              <FileText className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="text-xs">
                <div className="font-semibold text-white">Resume Studio</div>
                <div className="text-[11px] text-slate-500">ATS optimization</div>
              </div>
            </Link>

            <Link
              to="/setup"
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all group flex items-center gap-2.5"
            >
              <PlayCircle className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <div className="text-xs">
                <div className="font-semibold text-white">Mock Interview</div>
                <div className="text-[11px] text-slate-500">AI practice session</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
