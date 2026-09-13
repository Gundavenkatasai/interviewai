import { Shield, Lock, Eye, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Privacy & Data Policy</h1>
        <p className="text-sm text-slate-400">Last updated: September 2026</p>
      </div>

      {[
        { icon: Lock, title: "Data We Collect", content: "We collect only the data required to provide our service: your email, name, interview transcripts, resume content (if uploaded), and performance scores. We do not sell your data." },
        { icon: Eye, title: "How We Use Your Data", content: "Your data is used exclusively to generate personalized interview questions, evaluate your answers, track performance, and improve question quality. We never share it with third parties." },
        { icon: Trash2, title: "Your Right to Deletion", content: "You may delete all your data at any time from Settings > Danger Zone. This permanently removes your interview history, resume data, and performance records. No backup is retained." },
        { icon: Shield, title: "Security", content: "All data is encrypted in transit (TLS) and at rest. Passwords are hashed with bcrypt. JWT tokens expire automatically." },
      ].map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.title} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="flex items-center gap-3 mb-3">
              <Icon className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">{section.title}</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{section.content}</p>
          </div>
        );
      })}

      <div className="text-center">
        <Link to="/settings" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
          Go to Settings to manage your data →
        </Link>
      </div>
    </div>
  );
}
