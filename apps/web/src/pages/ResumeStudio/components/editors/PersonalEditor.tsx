import React from "react";
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe, CheckCircle2, AlertCircle } from "lucide-react";

interface PersonalEditorProps {
  personal: any;
  onChange: (field: string, value: string) => void;
  targetRole: string;
}

export const PersonalEditor: React.FC<PersonalEditorProps> = ({
  personal = {},
  onChange,
  targetRole
}) => {
  const isEmailValid = Boolean(personal.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email));
  const isPhoneValid = Boolean(personal.phone && personal.phone.trim().length >= 7);
  const isNameValid = Boolean(personal.fullName && personal.fullName.trim().length >= 2);

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            Personal &amp; Contact Information
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ATS parsers require clear, accurate contact headers to create your candidate record.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Full Name *</span>
            {isNameValid ? (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Valid</span>
            ) : (
              <span className="text-[10px] text-amber-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Required</span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              value={personal.fullName || ""}
              onChange={(e) => onChange("fullName", e.target.value)}
              placeholder="e.g. Alex Chen"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Professional Title */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Professional Title / Target Role</span>
            <span className="text-[10px] text-slate-500">Matches target job</span>
          </label>
          <input
            type="text"
            value={personal.professionalTitle || ""}
            onChange={(e) => onChange("professionalTitle", e.target.value)}
            placeholder={`e.g. ${targetRole || "Software Engineer"}`}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Email Address *</span>
            {isEmailValid ? (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Valid</span>
            ) : (
              <span className="text-[10px] text-amber-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Required for ATS</span>
            )}
          </label>
          <div className="relative">
            <input
              type="email"
              value={personal.email || ""}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="alex.chen@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Phone Number *</span>
            {isPhoneValid ? (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Valid</span>
            ) : (
              <span className="text-[10px] text-amber-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Required for ATS</span>
            )}
          </label>
          <input
            type="tel"
            value={personal.phone || ""}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="+1 (555) 234-5678"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Location */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-slate-300">Location (City, State / Country)</label>
          <input
            type="text"
            value={personal.location || ""}
            onChange={(e) => onChange("location", e.target.value)}
            placeholder="San Francisco, CA or Remote"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* LinkedIn */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Linkedin className="w-3.5 h-3.5 text-indigo-400" />
            LinkedIn Profile
          </label>
          <input
            type="url"
            value={personal.linkedin || ""}
            onChange={(e) => onChange("linkedin", e.target.value)}
            placeholder="https://linkedin.com/in/username"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* GitHub */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Github className="w-3.5 h-3.5 text-purple-400" />
            GitHub Profile
          </label>
          <input
            type="url"
            value={personal.github || ""}
            onChange={(e) => onChange("github", e.target.value)}
            placeholder="https://github.com/username"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Portfolio */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            Portfolio or Personal Website
          </label>
          <input
            type="url"
            value={personal.portfolio || ""}
            onChange={(e) => onChange("portfolio", e.target.value)}
            placeholder="https://mywebsite.dev"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
