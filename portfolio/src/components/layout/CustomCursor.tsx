import React, { useEffect, useState } from "react";

export const CustomCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [targetPos, setTargetPos] = useState({ x: -100, y: -100 });
  const [cursorType, setCursorType] = useState<"default" | "link" | "project" | "drag">("default");
  const [visible, setVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch device
    if (window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window) {
      setIsTouchDevice(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);

      // Inspect hovered element
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const cursorTarget = target.closest("[data-cursor]") as HTMLElement | null;
      if (cursorTarget) {
        const type = cursorTarget.getAttribute("data-cursor");
        if (type === "project") setCursorType("project");
        else if (type === "link") setCursorType("link");
        else if (type === "drag") setCursorType("drag");
        else setCursorType("default");
      } else if (target.closest("a, button, input, textarea, select")) {
        setCursorType("link");
      } else {
        setCursorType("default");
      }
    };

    const handleMouseLeave = () => setVisible(false);
    const handleMouseEnter = () => setVisible(true);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [visible]);

  // Smooth lagging follower
  useEffect(() => {
    if (isTouchDevice) return;

    let animId: number;
    const follow = () => {
      setTargetPos((prev) => ({
        x: prev.x + (pos.x - prev.x) * 0.22,
        y: prev.y + (pos.y - prev.y) * 0.22
      }));
      animId = requestAnimationFrame(follow);
    };
    animId = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(animId);
  }, [pos, isTouchDevice]);

  if (isTouchDevice || !visible) return null;

  return (
    <>
      {/* Central precise dot */}
      <div
        className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`
        }}
      >
        <div
          className={`rounded-full transition-all duration-200 ${
            cursorType === "project"
              ? "w-1 h-1 bg-[#ea580c]"
              : cursorType === "link"
              ? "w-1.5 h-1.5 bg-[#ea580c]"
              : "w-1.5 h-1.5 bg-white"
          }`}
        />
      </div>

      {/* Outer interactive follower ring / label */}
      <div
        className="pointer-events-none fixed z-[9998] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
        style={{
          left: `${targetPos.x}px`,
          top: `${targetPos.y}px`
        }}
      >
        {cursorType === "project" ? (
          <div className="w-16 h-16 rounded-full bg-[#ea580c]/90 text-white flex items-center justify-center font-mono font-bold text-[9px] tracking-widest uppercase shadow-xl shadow-[#ea580c]/40 border border-white/30 backdrop-blur-sm animate-scale-in">
            VIEW
          </div>
        ) : cursorType === "drag" ? (
          <div className="w-12 h-12 rounded-full border border-white/40 bg-white/10 flex items-center justify-center font-mono text-[8px] text-zinc-300">
            DRAG
          </div>
        ) : (
          <div
            className={`rounded-full border transition-all duration-200 ${
              cursorType === "link"
                ? "w-9 h-9 border-[#ea580c]/70 bg-[#ea580c]/5 scale-110"
                : "w-6 h-6 border-white/20 bg-transparent"
            }`}
          />
        )}
      </div>
    </>
  );
};
