import React, { useState } from "react";
import { Sparkles, MessageSquare, Send, CheckCircle2, RefreshCw, Award, BookOpen, ExternalLink } from "lucide-react";
import { ApiClient } from "../../../lib/api";
import { useNavigate } from "react-router-dom";

export const StoryBankTab: React.FC = () => {
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Array<{ role: "assistant" | "user"; content: string }>>([
    {
      role: "assistant",
      content: "Hi! I'm your LinkedIn Career Interviewer. My job is to extract real, uninvented evidence from your career that will fuel both your LinkedIn posts and your mock interviews.\n\nTell me about a challenging technical or product problem you tackled recently. What was the situation?",
    },
  ]);
  const [userAnswer, setUserAnswer] = useState("");
  const [sending, setSending] = useState(false);
  const [savedStory, setSavedStory] = useState<any>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    const newHistory = [...conversation, { role: "user" as const, content: userAnswer }];
    setConversation(newHistory);
    setUserAnswer("");
    setSending(true);

    try {
      const res = await ApiClient.sendLinkedInInterviewerTurn({
        userAnswer,
        conversationHistory: conversation,
      });

      if (res.completed && res.story) {
        setSavedStory(res.story);
        setConversation([
          ...newHistory,
          {
            role: "assistant",
            content: `🎉 Awesome! I've extracted the full STAR story "${res.story.title || "Career Achievement"}" and stored it in your canonical Story Bank with verified provenance!\n\nYou can use it right now in your LinkedIn Content Studio or Resume Studio.`,
          },
        ]);
      } else {
        setConversation([
          ...newHistory,
          {
            role: "assistant",
            content: res.nextQuestion || "Can you share what specific metric or result changed when you completed that?",
          },
        ]);
      }
    } catch (err: any) {
      alert(err.message || "Interviewer step failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            Story Bank Career Interviewer
          </h3>
          <p className="text-xs text-slate-400">
            Conversational evidence collector. Asks targeted questions to capture turning points, concrete numbers, and technical decisions without inventing anything.
          </p>
        </div>

        <button
          onClick={() => navigate("/stories")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
        >
          View Full Story Bank <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        {/* Chat Messages */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {conversation.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-950 border border-slate-800 text-slate-200"
                }`}
              >
                <div className="font-semibold mb-1 text-[10px] uppercase tracking-wider opacity-75">
                  {msg.role === "user" ? "You" : "Career Interviewer (STAR Engine)"}
                </div>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              Analyzing story completeness & STAR structure...
            </div>
          )}
        </div>

        {/* Saved Story Banner */}
        {savedStory && (
          <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Story "{savedStory.title}" saved to Interview AI Story Bank!
            </div>
            <button
              onClick={() => navigate("/stories")}
              className="text-xs text-emerald-400 hover:underline font-semibold"
            >
              View in Story Bank →
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-slate-800">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your answer (include concrete metrics, team size, tools)..."
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !userAnswer.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> Send
          </button>
        </form>
      </div>
    </div>
  );
};
