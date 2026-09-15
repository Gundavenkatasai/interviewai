import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Globe, Github, Linkedin, ExternalLink, Mail, MapPin, Briefcase,
  GraduationCap, Code, Sparkles, Edit3, ArrowUpRight, Award, CheckCircle2
} from "lucide-react";
import { ApiClient } from "../lib/api";

export default function PortfolioPage() {
  const { data: portfolioRes, isLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => ApiClient.getPortfolio(),
  });

  const portfolio = portfolioRes?.data || portfolioRes?.portfolio || portfolioRes;
  const personal = portfolio?.personal || {};
  const links = portfolio?.links || {};
  const skills = portfolio?.skills || [];
  const projects = portfolio?.projects || [];
  const experience = portfolio?.experience || [];
  const education = portfolio?.education || [];

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner & Edit Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-white">
            Live Developer Portfolio • Generated dynamically from your profile
          </span>
        </div>
        <Link
          to="/profile"
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Edit3 className="w-3.5 h-3.5" /> Edit Profile & Portfolio
        </Link>
      </div>

      {/* Hero Section */}
      <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl relative overflow-hidden space-y-6">
        <div className="space-y-3 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Available for Opportunities</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {personal.fullName || "Full Stack Engineer"}
          </h1>
          <p className="text-lg sm:text-xl font-medium text-indigo-400">
            {personal.title || "Senior Software Developer"}
          </p>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {personal.bio ||
              "Passionate engineer focused on crafting high-performance, fault-tolerant software architectures and delighting users with intuitive web interfaces."}
          </p>
        </div>

        {/* Social Links */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800 relative z-10">
          {links.github && (
            <a
              href={links.github}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-950 border border-slate-800 hover:text-white hover:border-slate-700 flex items-center gap-2 transition-colors"
            >
              <Github className="w-4 h-4" /> GitHub
            </a>
          )}
          {links.linkedin && (
            <a
              href={links.linkedin}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-950 border border-slate-800 hover:text-white hover:border-slate-700 flex items-center gap-2 transition-colors"
            >
              <Linkedin className="w-4 h-4 text-blue-400" /> LinkedIn
            </a>
          )}
          {links.portfolioUrl && (
            <a
              href={links.portfolioUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-950 border border-slate-800 hover:text-white hover:border-slate-700 flex items-center gap-2 transition-colors"
            >
              <Globe className="w-4 h-4 text-emerald-400" /> Personal Website
            </a>
          )}
        </div>
      </div>

      {/* Skills Matrix */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Code className="w-5 h-5 text-indigo-400" /> Technical Skills & Domain Expertise
        </h2>
        <div className="flex flex-wrap gap-2.5">
          {skills.length > 0 ? (
            skills.map((skill: any, idx: number) => {
              const skillName = typeof skill === "string" ? skill : (typeof skill?.name === "string" ? skill.name : (skill?.name?.name || "Unknown"));
              return (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-200 shadow-sm"
                >
                  {skillName}
                </span>
              );
            })
          ) : (
            ["TypeScript", "React.js", "Node.js", "System Architecture", "MongoDB", "Fastify", "Docker", "REST APIs"].map((s, i) => (
              <span
                key={i}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-200"
              >
                {s}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Projects Showcase */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" /> Featured Projects
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {projects.length > 0 ? (
            projects.map((proj: any, idx: number) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">{proj.title || "Project Title"}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {proj.description || "A scalable web application built with modern architecture."}
                  </p>
                  {proj.technologies && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {proj.technologies.map((t: string, ti: number) => (
                        <span key={ti} className="px-2 py-0.5 rounded text-[10px] bg-slate-950 text-indigo-300 border border-slate-800">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {proj.url && (
                  <a
                    href={proj.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 pt-2 w-fit"
                  >
                    <span>View Project</span> <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-2 p-8 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400">No projects added yet.</p>
              <Link to="/profile" className="text-xs font-semibold text-indigo-400 hover:underline">
                Add projects in Profile settings →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Experience & Education */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Experience */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-400" /> Work Experience
          </h2>
          <div className="space-y-4">
            {experience.length > 0 ? (
              experience.map((exp: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{exp.role}</p>
                      <p className="text-xs text-slate-400">{exp.company}</p>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">{exp.duration}</span>
                  </div>
                  {exp.description && (
                    <p className="text-xs text-slate-400 leading-relaxed pt-1">{exp.description}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No experience listed.</p>
            )}
          </div>
        </div>

        {/* Education */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-400" /> Education & Background
          </h2>
          <div className="space-y-4">
            {education.length > 0 ? (
              education.map((edu: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
                  <p className="text-sm font-bold text-white">{edu.degree}</p>
                  <p className="text-xs text-slate-400">{edu.institution}</p>
                  {edu.year && <p className="text-[11px] text-slate-500 font-mono">{edu.year}</p>}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No education listed.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
