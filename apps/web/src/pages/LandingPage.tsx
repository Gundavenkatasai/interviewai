import { Link } from "react-router-dom";
import { Sparkles, Mic, BarChart2, Briefcase, ArrowRight, CheckCircle, Star, Zap } from "lucide-react";

const features = [
  { icon: Briefcase, title: "AI Job Discovery", desc: "Search 8 Tier-1 job boards aggregated in real-time. Filter by role, skills, location, salary.", color: "text-indigo-400" },
  { icon: BarChart2, title: "Resume Matching", desc: "AI scores your match to each job, identifies skill gaps, and recommends preparation paths.", color: "text-emerald-400" },
  { icon: Mic, title: "AI Mock Interviews", desc: "Practice with a live AI interviewer tailored to the exact job and company.", color: "text-purple-400" },
  { icon: Zap, title: "Performance Analytics", desc: "Deep analytics on strengths, weaknesses, topic breakdown, and improvement over time.", color: "text-amber-400" },
];

export default function LandingPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8">
          <Star className="w-3.5 h-3.5 text-yellow-400" />
          AI-Powered Career Platform — Job Discovery + Mock Interviews
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">
          Land Your Dream Job<br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            With AI at Every Step
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10">
          Discover jobs matched to your resume, identify skill gaps, and practice with an AI interviewer that knows the exact role and company. From discovery to offer.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register"
            className="px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-2xl shadow-indigo-500/25 flex items-center gap-2 transition-all hover:scale-[1.02]">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/jobs"
            className="px-8 py-4 rounded-2xl text-base font-semibold text-slate-300 bg-slate-900/60 border border-slate-800 hover:bg-slate-900 hover:text-white flex items-center gap-2 transition-all">
            <Briefcase className="w-5 h-5" /> Browse Jobs
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition-all group">
                <div className={`w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${feat.color}`} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-12">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Discover Jobs", desc: "Browse AI-curated jobs from 8 Tier-1 sources. Match score shows you which ones fit best.", icon: Briefcase },
            { step: "02", title: "Analyze Your Fit", desc: "Upload your resume. Our AI identifies skill gaps and tells you exactly what to prepare.", icon: BarChart2 },
            { step: "03", title: "Mock Interview", desc: "Practice a tailored mock interview for the exact role. Get scored and improve.", icon: Mic },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-indigo-400" />
                </div>
                <span className="text-xs font-bold text-indigo-400/60 uppercase tracking-widest">Step {item.step}</span>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-500/20">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Land Your Next Role?</h2>
          <p className="text-slate-400 mb-8">Join thousands of candidates using AI to supercharge their job search and interview preparation.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all">
              <Sparkles className="w-4 h-4" /> Create Free Account
            </Link>
            <Link to="/setup" className="px-8 py-3.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 flex items-center gap-2 transition-all">
              Try Demo Interview
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
