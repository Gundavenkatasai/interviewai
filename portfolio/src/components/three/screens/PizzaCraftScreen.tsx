import React, { useState } from "react";
import { ShoppingBag, Flame, Clock, ShieldCheck, Activity, CheckCircle, ExternalLink } from "lucide-react";

export const PizzaCraftScreen: React.FC = () => {
  const [portal, setPortal] = useState<"customer" | "kitchen" | "admin">("kitchen");
  const [orderStage, setOrderStage] = useState<number>(2); // 0: Pending, 1: Preparing, 2: Out for delivery, 3: Delivered

  const stages = ["Received", "Preparing", "Out for Delivery", "Delivered"];

  return (
    <div className="w-full h-full bg-[#0d0907] text-[#f4f4f5] p-5 flex flex-col font-sans select-none overflow-hidden border border-orange-500/25 rounded-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-orange-500/20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-orange-500 animate-ping" />
          <div className="flex flex-col">
            <span className="font-mono text-xs font-bold tracking-wider text-orange-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              PIZZACRAFT // UNIFIED OPERATIONS
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              SOCKET.IO: CONNECTED • 105 CATALOG ITEMS • MONGODB ATLAS
            </span>
          </div>
        </div>

        {/* Portal switcher */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setPortal("customer")}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
              portal === "customer" ? "bg-orange-500 text-white font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            STOREFRONT
          </button>
          <button
            onClick={() => setPortal("kitchen")}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
              portal === "kitchen" ? "bg-orange-500 text-white font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            KITCHEN OPS
          </button>
          <button
            onClick={() => setPortal("admin")}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
              portal === "admin" ? "bg-orange-500 text-white font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            SUPER-ADMIN
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-12 gap-4 pt-3 overflow-hidden">
        {/* Left Column: Active Order Card & Lifecycle */}
        <div className="col-span-7 flex flex-col gap-3">
          <div className="p-3 rounded-lg bg-orange-950/20 border border-orange-500/20 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-orange-400 font-bold">ORDER #PZ-8492</span>
              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Razorpay Verified • 8% GST
              </span>
            </div>

            <div className="text-xs text-zinc-300 font-mono space-y-1">
              <div className="flex justify-between">
                <span>1x Artisanal Truffle Pizza (Large 1.6x)</span>
                <span className="text-white font-bold">₹649</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>1x Garlic Breadsticks + Cheesy Dip</span>
                <span>₹179</span>
              </div>
            </div>

            {/* Lifecycle Timeline */}
            <div className="pt-2 border-t border-white/5">
              <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">
                Live Lifecycle Telemetry (Socket.IO Synchronized)
              </span>
              <div className="grid grid-cols-4 gap-1">
                {stages.map((stg, i) => (
                  <button
                    key={stg}
                    onClick={() => setOrderStage(i)}
                    className={`py-1.5 px-1 rounded text-center text-[10px] font-mono transition-all ${
                      i <= orderStage
                        ? "bg-orange-500/20 border border-orange-500/60 text-orange-300 font-bold"
                        : "bg-white/5 border border-white/5 text-zinc-600"
                    }`}
                  >
                    {stg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2 rounded bg-black/40 border border-white/5">
              <span className="text-[10px] text-zinc-500 block">Avg Prep Time</span>
              <span className="text-xs font-bold text-white">12m 40s</span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/5">
              <span className="text-[10px] text-zinc-500 block">Active Orders</span>
              <span className="text-xs font-bold text-orange-400">14 Live</span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/5">
              <span className="text-[10px] text-zinc-500 block">Server Health</span>
              <span className="text-xs font-bold text-emerald-400">99.98%</span>
            </div>
          </div>
        </div>

        {/* Right Column: Portal Detail */}
        <div className="col-span-5 bg-black/50 rounded-lg p-3 border border-white/10 flex flex-col gap-2 font-mono text-[11px]">
          <span className="text-[10px] text-orange-400 uppercase tracking-wider">
            {portal === "customer" ? "STOREFRONT RADAR" : portal === "kitchen" ? "KITCHEN CONTROLLER" : "SUPER-ADMIN RBAC"}
          </span>

          <div className="space-y-1.5 text-zinc-400 overflow-y-auto">
            <div className="p-1.5 rounded bg-white/5 flex items-center justify-between">
              <span>RBAC Token Verified</span>
              <span className="text-emerald-400 font-bold">HMAC-SHA256</span>
            </div>
            <div className="p-1.5 rounded bg-white/5 flex items-center justify-between">
              <span>CORS & Whitelist</span>
              <span className="text-zinc-300">Vercel & Render</span>
            </div>
            <div className="p-1.5 rounded bg-white/5 flex items-center justify-between">
              <span>DB Replica Set</span>
              <span className="text-orange-300">Atlas Cluster 0</span>
            </div>
          </div>

          <div className="mt-auto pt-2 border-t border-white/10">
            <a
              href="https://pizza-craft-1zi3.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-orange-600/30 hover:bg-orange-600/50 border border-orange-500/40 text-orange-200 text-[10px] font-mono transition-all"
            >
              <span>LAUNCH LIVE APP</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
