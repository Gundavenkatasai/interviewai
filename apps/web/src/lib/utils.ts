import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function getScoreColor(score: number): string {
  if (score >= 8.0) return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
  if (score >= 6.0) return "text-amber-500 border-amber-500/30 bg-amber-500/10";
  return "text-rose-500 border-rose-500/30 bg-rose-500/10";
}

export function getScoreBg(score: number): string {
  if (score >= 8.0) return "bg-emerald-500";
  if (score >= 6.0) return "bg-amber-500";
  return "bg-rose-500";
}
