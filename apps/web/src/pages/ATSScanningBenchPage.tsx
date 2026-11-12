import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ScanLine, CheckCircle2, AlertTriangle, XCircle, FileText, ArrowRight,
  ShieldCheck, RefreshCw, Upload, Eye, EyeOff, Zap, Check, AlertCircle
} from 'lucide-react';
import { MechanicalButton } from '../components/ui/MechanicalButton';
import { InkBleedButton } from '../components/ui/InkBleedButton';
import { MorphingActionPill } from '../components/ui/MorphingActionPill';

interface RedlineIssue {
  id: string;
  category: 'PARSER_RISK' | 'MISSING_KEYWORD' | 'VAGUE_METRIC' | 'FORMAT_COMPAT';
  title: string;
  snippet: string;
  recommendation: string;
  severity: 'CRITICAL' | 'WARNING' | 'PASS';
  resolved?: boolean;
}

export default function ATSScanningBenchPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [atsScore, setAtsScore] = useState(88);
  const [showScanBar, setShowScanBar] = useState(true);
  const [issues, setIssues] = useState<RedlineIssue[]>([
    {
      id: 'iss-1',
      category: 'MISSING_KEYWORD',
      title: 'Crucial Architecture Token Omitted: "gRPC Streaming"',
      snippet: 'Wrote Go microservices for real-time cluster telemetry monitoring.',
      recommendation: 'Explicitly inject "gRPC streaming" and protobuf serialization protocols into bullet #2.',
      severity: 'CRITICAL',
    },
    {
      id: 'iss-2',
      category: 'VAGUE_METRIC',
      title: 'Vague Impact Metric Detected',
      snippet: 'Optimized PostgreSQL connection pooling and high-concurrency payment webhook routing.',
      recommendation: 'Attach a quantitative throughput multiplier (e.g. "reduced p99 query latency from 320ms to 48ms").',
      severity: 'WARNING',
    },
    {
      id: 'iss-3',
      category: 'FORMAT_COMPAT',
      title: 'Single-Column Linear Hierarchy Confirmed',
      snippet: 'No floating text boxes or multi-column flex containers detected.',
      recommendation: 'Format is 100% parse-safe for Taleo, Workday, and Greenhouse ATS engines.',
      severity: 'PASS',
      resolved: true,
    },
  ]);

  const resolveIssue = (id: string) => {
    setIssues(prev => prev.map(iss => iss.id === id ? { ...iss, resolved: true } : iss));
    setAtsScore(prev => Math.min(prev + 5, 99));
  };

  const runOpticalScan = () => {
    setIsScanning(true);
    setShowScanBar(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#181614] flex flex-col font-sans">
      {/* Bench Header */}
      <header className="border-b border-[#E5E0D4] bg-white px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#172535] bg-[#EFECE6] px-2 py-0.5 rounded border border-[#DCD5C6]">
                OPTICAL BENCH v3
              </span>
              <span className="text-xs font-mono text-[#8C8479]">ILLUMINATED LIGHT-TABLE MODE</span>
            </div>
            <h1 className="text-xl font-serif font-bold text-[#181614] tracking-tight mt-1">
              Optical ATS Scanning Bench
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <MechanicalButton
              variant="stone"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />}
              onClick={runOpticalScan}
            >
              Re-Illuminate Scan
            </MechanicalButton>
            <MechanicalButton
              variant="vermilion"
              size="sm"
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Export Certification Seal
            </MechanicalButton>
          </div>
        </div>
      </header>

      {/* Main Light-Table Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Stage (Col 1-7): Original Document Preview with Laser Scan Bar */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs font-mono text-[#8C8479]">
            <span>RAW DOCUMENT SURFACE [ILLUMINATED]</span>
            <span>A4 METRIC SHEET</span>
          </div>

          <div className="relative bg-white border border-[#E5E0D4] rounded-lg shadow-[0_8px_24px_rgba(24,22,20,0.06)] p-8 sm:p-12 overflow-hidden min-h-[640px]">
            {/* The Gliding Laser Scan Bar */}
            {showScanBar && (
              <motion.div
                animate={{ y: [0, 560, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C84B26] to-transparent shadow-[0_0_12px_#C84B26] pointer-events-none z-20"
              />
            )}

            {/* Document Content Mock */}
            <div className="space-y-6 font-serif text-[#181614] select-none opacity-90">
              <div className="border-b border-[#181614] pb-3">
                <h2 className="text-2xl font-bold tracking-tight">VENKATA SAI GUNDA</h2>
                <div className="font-mono text-[11px] text-[#5C564E] mt-1">
                  Bengaluru, India • venkatasai@interviewai.dev • Staff Systems Architect
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-mono text-[10px] uppercase font-bold text-[#172535]">01. STATEMENT</div>
                <p className="text-xs leading-relaxed text-[#5C564E]">
                  Staff Systems Engineer with 6+ years designing fault-tolerant, high-concurrency distributed engines in Go and TypeScript. Proven track record eliminating single points of failure across production multi-region banking tiers.
                </p>
              </div>

              <div className="space-y-3">
                <div className="font-mono text-[10px] uppercase font-bold text-[#172535]">02. PRODUCTION HISTORY</div>
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#181614]">Staff Distributed Systems Engineer @ ScaleGrid</div>
                  <ul className="text-xs space-y-1.5 list-disc pl-4 text-[#5C564E]">
                    <li>Architected distributed consensus engine handling 450k req/sec with Raft implementation.</li>
                    <li className="bg-[#FCEEEE] p-1 rounded text-[#9E2A2B] font-mono text-[11px]">
                      [OCR WARNING]: Missing specific IPC protocol keyword (e.g. gRPC).
                    </li>
                    <li>Standardized declarative ArgoCD GitOps pipelines, eliminating deployment rollbacks.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Stage (Col 8-12): OCR Telemetry Feed & Redline Adjustments */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Analog Dial Gauge & Score Readout */}
          <div className="bg-white border border-[#E5E0D4] rounded-lg p-6 shadow-xs text-center space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#8C8479]">
              COMPOSITE OCR COMPLIANCE INDEX
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="relative w-32 h-16 overflow-hidden flex items-end justify-center">
                <div className="w-32 h-32 rounded-full border-10 border-[#E5E0D4] border-t-[#C84B26] border-r-[#C84B26] rotate-[-45deg]" />
                <div className="absolute font-serif font-bold text-3xl text-[#181614]">
                  {atsScore}%
                </div>
              </div>
            </div>

            <div className="text-xs text-[#2E6347] font-medium flex items-center justify-center gap-1.5 pt-1">
              <CheckCircle2 className="w-4 h-4 text-[#2E6347]" /> Tier-1 ATS Compatibility Certified
            </div>
          </div>

          {/* Redline Strike-Through Issues List */}
          <div className="bg-white border border-[#E5E0D4] rounded-lg shadow-xs flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#E5E0D4] flex items-center justify-between">
              <span className="font-serif font-bold text-sm text-[#181614]">
                Redline Optical Corrections
              </span>
              <span className="text-[10px] font-mono text-[#8C8479]">
                {issues.filter(i => !i.resolved).length} UNRESOLVED
              </span>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              {issues.map(issue => (
                <div
                  key={issue.id}
                  className={`p-3.5 rounded-md border text-xs transition-all ${
                    issue.resolved
                      ? 'bg-[#EBF3EE] border-[#D0E3D6] opacity-70'
                      : issue.severity === 'CRITICAL'
                      ? 'bg-[#FCEEEE] border-[#F7D0D0]'
                      : 'bg-[#FDF6E9] border-[#F7E6C4]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      issue.resolved
                        ? 'bg-[#2E6347] text-white'
                        : issue.severity === 'CRITICAL'
                        ? 'bg-[#9E2A2B] text-white'
                        : 'bg-[#A36114] text-white'
                    }`}>
                      {issue.resolved ? 'RESOLVED' : issue.category}
                    </span>
                    {!issue.resolved && (
                      <button
                        onClick={() => resolveIssue(issue.id)}
                        className="text-[11px] font-semibold text-[#C84B26] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Auto-Remediate <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className={`font-semibold text-sm ${issue.resolved ? 'line-through text-[#5C564E]' : 'text-[#181614]'}`}>
                    {issue.title}
                  </div>

                  <p className="text-[11px] text-[#5C564E] mt-1 leading-relaxed">
                    {issue.recommendation}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[#E5E0D4] bg-[#FAF8F5]">
              <MechanicalButton
                variant="vermilion"
                size="md"
                className="w-full"
                onClick={() => setIssues(prev => prev.map(i => ({ ...i, resolved: true })))}
              >
                Apply All Redlines (100% Score)
              </MechanicalButton>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

