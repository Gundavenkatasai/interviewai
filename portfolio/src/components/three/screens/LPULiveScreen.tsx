import React, { useState, useEffect } from "react";
import { MessageSquare, Users, CheckCheck, Send, Bell, Shield, Sparkles } from "lucide-react";

export const LPULiveScreen: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "CSE Dept Official",
      reg: "FACULTY_04",
      text: "HackSmart 2026 registration portal is now open for third-year engineering students.",
      time: "10:14 AM",
      isUser: false,
      read: true
    },
    {
      id: 2,
      sender: "Sai (You)",
      reg: "12306253",
      text: "Submitted our WebSocket full-stack prototype repo. Awaiting room allocation!",
      time: "10:17 AM",
      isUser: true,
      read: true
    }
  ]);
  const [isTyping, setIsTyping] = useState(true);
  const [inputVal, setInputVal] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTyping(prev => !prev);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: "Sai (You)",
        reg: "12306253",
        text: inputVal,
        time: "Now",
        isUser: true,
        read: false
      }
    ]);
    setInputVal("");
  };

  return (
    <div className="w-full h-full bg-[#0a0806] text-[#f4f4f5] p-5 flex flex-col font-sans select-none overflow-hidden border border-[#ea580c]/30 rounded-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#ea580c]/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ea580c] flex items-center justify-center font-display font-black text-white text-xs shadow-lg shadow-[#ea580c]/30">
            LPU
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-xs font-bold tracking-wider text-[#fb923c] flex items-center gap-1.5">
              LPU LIVE // REAL-TIME CAMPUS NETWORK
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              REG_AUTH: #12306253 • SOCKET.IO: CONNECTED • MONGODB PERSISTENCE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            1,420 ONLINE
          </span>
        </div>
      </div>

      {/* Main chat window */}
      <div className="flex-1 grid grid-cols-12 gap-3 pt-3 overflow-hidden">
        {/* Sidebar: Recent Channels */}
        <div className="col-span-4 border-r border-white/5 pr-2 flex flex-col gap-1.5 font-mono text-xs">
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest px-2">CHANNELS</span>
          <div className="p-2 rounded-lg bg-[#ea580c]/15 border border-[#ea580c]/30 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#fb923c]" />
              <span className="text-[11px] font-bold">CSE-B.Tech 2023</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
          </div>
          <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5" />
              <span className="text-[11px]">Announcements</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[11px]">Direct Chats</span>
            </div>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="col-span-8 flex flex-col justify-between overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col max-w-[85%] ${
                  m.isUser ? "ml-auto items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-mono text-zinc-400 font-semibold">{m.sender}</span>
                  <span className="text-[9px] font-mono text-zinc-600">[{m.reg}]</span>
                </div>
                <div
                  className={`p-2.5 rounded-xl text-xs font-sans leading-relaxed ${
                    m.isUser
                      ? "bg-[#ea580c] text-white rounded-tr-none shadow-md shadow-[#ea580c]/20"
                      : "bg-[#18181c] text-zinc-200 border border-white/10 rounded-tl-none"
                  }`}
                >
                  <p>{m.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[9px] font-mono opacity-70">{m.time}</span>
                    {m.isUser && (
                      <CheckCheck
                        className={`w-3 h-3 ${m.read ? "text-cyan-200" : "text-white/60"}`}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#fb923c] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fb923c]" />
                <span>Prof. Sharma is typing response...</span>
              </div>
            )}
          </div>

          {/* Chat input */}
          <form onSubmit={handleSend} className="pt-2 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Send message to university peers..."
              className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ea580c]"
            />
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-white transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
