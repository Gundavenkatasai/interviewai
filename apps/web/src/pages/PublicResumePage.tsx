import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ApiClient } from "../lib/api";
import { Sparkles, Download, Lock, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ResumeRenderer } from "./ResumeStudio/components/templates/ResumeRenderer";

export default function PublicResumePage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [resumeData, setResumeData] = useState<any | null>(null);
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const fetchPublicResume = async (pwd?: string) => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.getPublicResume(slug, pwd);
      if (res.resume) {
        setResumeData(res.resume);
        setPasswordRequired(false);
      }
    } catch (err: any) {
      if (err.message?.includes("Password required") || err.message?.includes("Incorrect password")) {
        setPasswordRequired(true);
        setError(err.message);
      } else {
        setError(err.message || "Failed to load public resume");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicResume();
  }, [slug]);

  const handleDownloadPdf = async () => {
    if (!previewRef.current || !resumeData) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      const filename = `${(resumeData.profileData?.personal?.fullName || "Resume").replace(/\s+/g, "_")}_Resume.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF export failed", err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading verified resume...</span>
        </div>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Password Protected Resume</h2>
            <p className="text-xs text-slate-400 mt-1">This candidate has restricted access to authorized recruiters.</p>
          </div>
          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">{error}</div>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchPublicResume(passwordInput);
            }}
            className="space-y-4"
          >
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password..."
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 text-center"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              Unlock Resume
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error || !resumeData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Resume Unavailable</h2>
          <p className="text-xs text-slate-400">{error || "This resume does not exist or the link has expired."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4 sm:px-6">
      {/* Top Banner */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-white">
            INTERVIEW AI <span className="text-indigo-400">Verified</span> Resume
          </span>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={exporting}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? "Generating PDF..." : "Download PDF"}
        </button>
      </div>

      {/* Rendered Template */}
      <div className="flex justify-center">
        <ResumeRenderer
          ref={previewRef}
          resume={resumeData}
          paperSize="a4"
        />
      </div>

      <div className="max-w-4xl mx-auto mt-6 text-center text-xs text-slate-500">
        Verified & Rendered with INTERVIEW AI Resume Studio
      </div>
    </div>
  );
}
