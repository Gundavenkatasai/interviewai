import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, Square, Play, Sparkles, AlertCircle,
  Volume2, CheckCircle2, ChevronRight, CornerDownLeft, Radio, Clock,
  ArrowRight, ShieldCheck, Award
} from 'lucide-react';
import { MechanicalButton } from '../components/ui/MechanicalButton';
import { InkBleedButton } from '../components/ui/InkBleedButton';
import { MagneticWrapper } from '../components/ui/MagneticWrapper';

export default function InterviewBroadcastStudioPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isRecording, setIsRecording] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [countdown, setCountdown] = useState(120); // 2 minutes per answer
  const [liveTranscript, setLiveTranscript] = useState(
    'In our distributed payment architecture at ScaleGrid, we experienced a network partition where two nodes claimed leadership...'
  );

  const questions = [
    {
      qId: 'Q-01',
      category: 'DISTRIBUTED ARCHITECTURE',
      difficulty: 'HARD',
      prompt: 'Walk me through a production failure where your consensus engine partitioned. How did you verify state consistency without dropping payment events?',
      competencies: ['Raft Consensus', 'Partition Tolerant', 'Zero Data Loss'],
      expectedMinutes: '2.5 min'
    },
    {
      qId: 'Q-02',
      category: 'HIGH-CONCURRENCY DATABASE',
      difficulty: 'HARD',
      prompt: 'When routing 50k webhooks/second under PostgreSQL lock contention, how did you engineer the idempotency layer to avoid deadlock scenarios?',
      competencies: ['Two-Phase Locking', 'Redis Caching', 'PostgreSQL Internals'],
      expectedMinutes: '3.0 min'
    },
    {
      qId: 'Q-03',
      category: 'INCIDENT POST-MORTEM & CULTURE',
      difficulty: 'MEDIUM',
      prompt: 'Describe a high-stakes disagreement with product management regarding tech debt refactoring vs. shipping a quarterly feature.',
      competencies: ['Executive Communication', 'Trade-off Analysis', 'Pragmatism'],
      expectedMinutes: '2.0 min'
    }
  ];

  const currentQ = questions[currentQuestionIndex];

  // Simulated countdown timer
  useEffect(() => {
    let timer: any;
    if (isRecording && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, countdown]);

  // Spacebar hotkey to toggle recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsRecording(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCountdown(120);
      setIsRecording(false);
    } else {
      navigate('/history');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#181614] flex flex-col font-sans">
      {/* Studio Master Header */}
      <header className="border-b border-[#E5E0D4] bg-white px-6 py-3.5 sticky top-0 z-30 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C84B26] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C84B26] font-bold">
              STUDIO ON-AIR
            </span>
          </div>
          <span className="text-slate-300">•</span>
          <span className="font-mono text-xs text-[#5C564E]">
            CHANNEL: TECHNICAL EVALUATION [SESSION-{id || 'ACTIVE'}]
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="font-mono text-xs text-[#8C8479] hidden sm:block">
            QUESTION {currentQuestionIndex + 1} OF {questions.length}
          </div>
          <MechanicalButton
            variant="stone"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            Suspend Studio
          </MechanicalButton>
        </div>
      </header>

      {/* Main Broadcast Stage: Split Studio */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Stage (Col 1-6): Split Camera Feeds & Analog Audio Meter */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {/* AI Persona Feed */}
          <div className="bg-[#172535] rounded-lg p-5 text-white relative overflow-hidden shadow-md flex flex-col justify-between min-h-[220px]">
            <div className="flex items-center justify-between z-10">
              <span className="text-[10px] font-mono text-[#8B9CAD] uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-[#C84B26] animate-pulse" /> AI PRINCIPAL EVALUATOR
              </span>
              <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/80">
                LATENCY: 85ms
              </span>
            </div>

            {/* Persona Visualizer */}
            <div className="my-auto flex flex-col items-center justify-center text-center z-10 py-4">
              <div className="w-16 h-16 rounded-full bg-[#23384E] border-2 border-[#C84B26] flex items-center justify-center font-serif font-bold text-xl text-white shadow-lg mb-2">
                AI
              </div>
              <div className="font-serif font-bold text-sm tracking-tight">Dr. Marcus Vance</div>
              <div className="text-[11px] text-[#8B9CAD] font-mono">Head of Distributed Systems & Platform</div>
            </div>

            {/* Analog Segmented LED Audio-Meter (Real-Time Voice Activity) */}
            <div className="flex items-center gap-1 z-10 bg-black/40 px-3 py-1.5 rounded border border-white/10">
              <span className="text-[9px] font-mono text-white/50 mr-2">VOX LEVEL:</span>
              {[40, 65, 80, 50, 95, 30, 85, 90, 70, 45, 60, 30, 80, 55].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-xs transition-all duration-100 ${
                    i > 10 ? 'bg-[#C84B26]' : i > 7 ? 'bg-[#A36114]' : 'bg-[#2E6347]'
                  }`}
                  style={{ height: `${(h * (isRecording ? 0.3 : 0.8)).toFixed(0)}%`, minHeight: '4px' }}
                />
              ))}
            </div>
          </div>

          {/* Candidate Camera Feed */}
          <div className="bg-white border border-[#E5E0D4] rounded-lg p-5 shadow-xs flex flex-col justify-between min-h-[260px] relative overflow-hidden">
            <div className="flex items-center justify-between z-10">
              <span className="text-[10px] font-mono text-[#8C8479] uppercase tracking-wider flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-[#C84B26] animate-ping' : 'bg-[#2E6347]'}`} />
                CANDIDATE BROADCAST FEED
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#8C8479]">1080p 60FPS</span>
              </div>
            </div>

            {/* Video Canvas Placeholder */}
            <div className="my-auto flex flex-col items-center justify-center text-center py-6">
              <div className="w-20 h-20 rounded-full bg-[#F5F3EE] border border-[#D5CEBF] flex items-center justify-center font-serif text-2xl font-bold text-[#181614] mb-2 shadow-xs">
                VS
              </div>
              <div className="font-serif font-bold text-sm text-[#181614]">Venkata Sai Gunda</div>
              <div className="text-[11px] font-mono text-[#2E6347] font-semibold mt-0.5">AUDIO ENCODING: CLEAN</div>
            </div>

            {/* Floating Tactile Studio Controls */}
            <div className="flex items-center justify-center gap-3 pt-3 border-t border-[#E5E0D4] z-10">
              <MagneticWrapper>
                <button
                  onClick={() => setMicMuted(!micMuted)}
                  className={`p-2.5 rounded-full border transition-all ${
                    micMuted
                      ? 'bg-[#FCEEEE] border-[#F7D0D0] text-[#9E2A2B]'
                      : 'bg-[#EFECE6] border-[#D5CEBF] text-[#181614] hover:bg-[#E5E0D4]'
                  }`}
                  title={micMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </MagneticWrapper>

              <MechanicalButton
                variant={isRecording ? 'danger' : 'vermilion'}
                size="md"
                onClick={() => setIsRecording(!isRecording)}
                icon={isRecording ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              >
                {isRecording ? 'Halt Capture [Space]' : 'Start Capture [Space]'}
              </MechanicalButton>

              <MagneticWrapper>
                <button
                  onClick={() => setCameraActive(!cameraActive)}
                  className={`p-2.5 rounded-full border transition-all ${
                    !cameraActive
                      ? 'bg-[#FCEEEE] border-[#F7D0D0] text-[#9E2A2B]'
                      : 'bg-[#EFECE6] border-[#D5CEBF] text-[#181614] hover:bg-[#E5E0D4]'
                  }`}
                  title={cameraActive ? "Turn Off Video" : "Turn On Video"}
                >
                  {cameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
              </MagneticWrapper>
            </div>
          </div>
        </div>

        {/* Right Stage (Col 7-12): The Teleprompter Console */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {/* Question Teleprompter Card */}
          <div className="bg-white border border-[#E5E0D4] rounded-lg p-6 sm:p-8 shadow-xs flex flex-col justify-between flex-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C84B26] font-bold bg-[#FBF0EC] px-2 py-0.5 rounded border border-[#F4D4C9]">
                  {currentQ.category}
                </span>
                {/* Circular Countdown Timer */}
                <div className="flex items-center gap-1.5 font-mono text-xs text-[#181614] bg-[#F5F3EE] px-2.5 py-1 rounded border border-[#E5E0D4]">
                  <Clock className="w-3.5 h-3.5 text-[#C84B26]" />
                  <span>{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>

              {/* Large Editorial Serif Question Display */}
              <h2 className="font-serif text-xl sm:text-2xl font-bold leading-snug text-[#181614] tracking-tight">
                "{currentQ.prompt}"
              </h2>

              {/* Target Engineering Competencies */}
              <div className="pt-2">
                <div className="text-[10px] font-mono uppercase text-[#8C8479] mb-1.5">
                  TARGET DEFICIENCIES TO PROVE:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentQ.competencies.map(c => (
                    <span key={c} className="text-xs font-mono bg-[#EBF3EE] text-[#2E6347] border border-[#D0E3D6] px-2 py-0.5 rounded">
                      ✓ {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Telemetry Transcript Stream */}
            <div className="mt-6 pt-4 border-t border-[#E5E0D4] space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#8C8479]">
                <span>LIVE OCR ACOUSTIC TRANSCRIPT</span>
                <span className="text-[#2E6347]">SPEECH RATE: 138 WPM [OPTIMAL]</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D4] rounded-md text-xs leading-relaxed text-[#181614] font-mono min-h-[70px]">
                {liveTranscript}
                {isRecording && <span className="inline-block w-1.5 h-3 bg-[#C84B26] ml-1 animate-pulse" />}
              </div>
            </div>

            {/* Teleprompter Footer Navigation */}
            <div className="mt-6 pt-4 border-t border-[#E5E0D4] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#8C8479]">
                PRESS [SPACE] TO PAUSE • [ENTER] TO SUBMIT
              </span>
              <MechanicalButton
                variant="navy"
                size="md"
                onClick={handleNextQuestion}
                icon={<ChevronRight className="w-4 h-4" />}
                iconPosition="right"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Evaluation'}
              </MechanicalButton>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

