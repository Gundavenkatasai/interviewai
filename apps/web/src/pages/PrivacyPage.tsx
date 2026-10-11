import { Shield, Lock, Eye, Trash2, Cpu, FileText, Database, Server, UserCheck, Mail, ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPage() {
  const lastUpdated = "October 2026";
  const policyVersion = "v2.0";

  const sections = [
    {
      id: "collection",
      icon: Lock,
      title: "1. Information We Collect",
      content: [
        "Account Credentials: Full name, email address, password hashes (via bcrypt), and account metadata.",
        "Candidate Profile Information: Professional title, target job roles, preferred work modes, salary preferences, location targets, and verified skill sets.",
        "Uploaded Resumes and Documents: Original binary files (PDF, DOCX), extracted plain text, structural layouts, parsed career history, and generated ATS optimization artifacts.",
        "Practice & Interview Recordings: Candidate answers, transcripts generated through speech recognition, AI evaluation scores, feedback debriefs, and performance rubrics.",
        "Technical Telemetry: IP addresses, user agent headers, browser types, session activity timestamps, and diagnostic error reports."
      ]
    },
    {
      id: "ai-processing",
      icon: Cpu,
      title: "2. AI Processing & External Providers",
      content: [
        "Language Model Inference: To provide mock interview simulations, question generation, and ATS analysis, text data (such as job descriptions, anonymized resume snippets, and candidate responses) is sent to external AI infrastructure providers including OpenAI, Groq Cloud, and open-source models.",
        "Speech Transcription: Voice input from mock interviews is transcribed using high-accuracy speech-to-text models (Whisper/Groq). Raw audio streams are processed in memory and not used to train public foundation models.",
        "Prompt Injection & Data Sanitization: All inputs undergo sanitization before LLM processing to prevent prompt injection and inadvertent exposure of private metadata.",
        "No Training on User Data: By default, enterprise API terms with our AI providers prohibit using candidate resume content or interview transcripts for model training."
      ]
    },
    {
      id: "resumes-and-jobs",
      icon: FileText,
      title: "3. Resume Studio & Job Discovery Data",
      content: [
        "Resume Artifact Preservation: Original uploaded document structures and styling are preserved in isolated storage containers. We generate derived versions strictly when explicitly requested by you.",
        "Job Aggregation & Match Scoring: Public job listings aggregated from Tier-1 career sources are cross-referenced with your verified profile to compute match scores. Your profile is never shared with external job boards without your explicit apply click.",
        "Application Links: When clicking external 'Apply' links, you are directed to employer career portals or applicant tracking systems (e.g., Greenhouse, Lever, Workday) under their respective privacy policies."
      ]
    },
    {
      id: "subprocessors",
      icon: Server,
      title: "4. Data Sharing & Subprocessors",
      content: [
        "No Selling of Data: We never sell, rent, or trade your personal information, resume documents, or interview transcripts to data brokers or third-party advertisers.",
        "Authorized Subprocessors: We work only with audited infrastructure partners who adhere to industry-standard data protection standards: MongoDB Atlas (encrypted database storage), Groq & OpenAI (AI inference), and cloud hosting/CDN providers.",
        "Legal & Regulatory Disclosure: We will only disclose customer data if required by enforceable legal process, subpoena, or urgent safety requirements, with prompt notification where legally permissible."
      ]
    },
    {
      id: "security",
      icon: Shield,
      title: "5. Security Safeguards",
      content: [
        "Encryption in Transit: All public API endpoints and web traffic enforce TLS 1.3/HTTPS transport security and Secure WebSockets (WSS).",
        "Encryption at Rest: Database volumes, backups, and artifact storage utilize AES-256 encryption at rest.",
        "Access Controls & Authentication: Strong password hashing via bcrypt, signed JSON Web Tokens (JWT) with automatic expiration, and strict ownership validation on every private resource (preventing IDOR).",
        "Continuous Vulnerability Management: Regular automated dependency auditing, rate-limiting against brute force attacks, and structured audit logging."
      ]
    },
    {
      id: "user-rights",
      icon: UserCheck,
      title: "6. User Rights, Data Export & Deletion",
      content: [
        "Right of Access & Portability: You can download your resume artifacts, interview transcripts, and diagnostic scoring reports at any time.",
        "Right to Rectification: Update your name, career targets, and profile details via Account Settings.",
        "Permanent Data Deletion: You can trigger complete, permanent deletion of your account, resumes, and interview history via Settings > Danger Zone. Deletion permanently erases your records from active production databases.",
        "GDPR & CCPA Rights: Depending on your jurisdiction, you have the right to lodge inquiries with your local data protection authority regarding our processing."
      ]
    },
    {
      id: "retention",
      icon: Database,
      title: "7. Data Retention & Cookies",
      content: [
        "Retention Period: We retain your account data and practice records for as long as your account remains active, or until you initiate deletion.",
        "Session Cookies: We utilize strictly necessary cookies for session persistence and CSRF mitigation. We do not deploy cross-site tracking cookies.",
        "Inactive Accounts: Accounts dormant for more than 24 consecutive months are scheduled for automated pruning following prior email notification."
      ]
    },
    {
      id: "contact",
      icon: Mail,
      title: "8. Contact & Legal Representatives",
      content: [
        `Policy Version: ${policyVersion} | Last Updated: ${lastUpdated}`,
        "Data Protection Officer / Privacy Inquiries: privacy@interviewai.app",
        "Security Incidents & Vulnerability Disclosure: security@interviewai.app",
        "Operating Entity: [Configurable Entity: Interview AI Inc., Delaware / San Francisco, CA]"
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Privacy & Data Protection Policy ({policyVersion})</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          At Interview AI, we prioritize candidate confidentiality and data integrity. This policy clearly explains how we process your personal data, resumes, voice transcripts, and AI evaluations.
        </p>
        <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-800/80 pt-4">
          <span>Effective: {lastUpdated}</span>
          <span>•</span>
          <span>Version: {policyVersion}</span>
          <span>•</span>
          <Link to="/terms" className="text-indigo-400 hover:underline">
            View Terms of Service
          </Link>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              id={section.id}
              className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {section.title}
                </h2>
              </div>
              <div className="space-y-2.5 text-sm text-slate-300 leading-relaxed pl-1 sm:pl-2">
                {section.content.map((point, idx) => (
                  <p key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold mt-1 text-xs">•</span>
                    <span>{point}</span>
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Account controls banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">
            Ready to manage or export your personal data?
          </h3>
          <p className="text-xs text-slate-400">
            Access your profile settings to download artifacts or permanently delete your account history.
          </p>
        </div>
        <Link
          to="/settings"
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shrink-0 transition-colors shadow-lg shadow-indigo-600/20"
        >
          Manage Data in Settings
        </Link>
      </div>
    </div>
  );
}
