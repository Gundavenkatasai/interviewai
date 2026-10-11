import { Link } from "react-router-dom";
import { Shield, Sparkles, Lock, Heart, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md text-slate-400 text-xs mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-sm">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="tracking-tight text-base font-extrabold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Interview AI
              </span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed">
              AI-powered technical mock interview preparation, automated ATS resume studio, and verified career discovery.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Practice & Preparation */}
          <div className="space-y-2.5">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Practice</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/setup" className="hover:text-white transition-colors">
                  AI Mock Interview
                </Link>
              </li>
              <li>
                <Link to="/stories" className="hover:text-white transition-colors">
                  STAR Story Bank
                </Link>
              </li>
              <li>
                <Link to="/performance" className="hover:text-white transition-colors">
                  Performance Analytics
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-white transition-colors">
                  Session History
                </Link>
              </li>
            </ul>
          </div>

          {/* Career & Resumes */}
          <div className="space-y-2.5">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Career Tools</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/jobs" className="hover:text-white transition-colors">
                  Job Discovery
                </Link>
              </li>
              <li>
                <Link to="/resume" className="hover:text-white transition-colors">
                  Resume Studio
                </Link>
              </li>
              <li>
                <Link to="/ats" className="hover:text-white transition-colors">
                  ATS Scanner & Optimizer
                </Link>
              </li>
              <li>
                <Link to="/linkedin" className="hover:text-white transition-colors">
                  LinkedIn Optimization
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Security */}
          <div className="space-y-2.5">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Trust & Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-indigo-400" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-indigo-400" />
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-white transition-colors">
                  Data & Account Controls
                </Link>
              </li>
              <li>
                <a href="mailto:security@interviewai.app" className="hover:text-white transition-colors">
                  Security Disclosure
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} Interview AI. All rights reserved. Enterprise-grade career preparation.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">
              Terms
            </Link>
            <a href="mailto:support@interviewai.app" className="hover:text-slate-300 transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
