import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getRiskColor(level: string) {
  switch (level?.toLowerCase()) {
    case "safe":
    case "low":
      return "text-emerald-400";
    case "caution":
    case "medium":
      return "text-amber-400";
    case "risky":
    case "high":
      return "text-rose-400";
    default:
      return "text-slate-400";
  }
}

export function getRiskBg(level: string) {
  switch (level?.toLowerCase()) {
    case "safe":
    case "low":
      return "bg-emerald-500/10 border-emerald-500/20";
    case "caution":
    case "medium":
      return "bg-amber-500/10 border-amber-500/20";
    case "risky":
    case "high":
      return "bg-rose-500/10 border-rose-500/20";
    default:
      return "bg-slate-500/10 border-slate-500/20";
  }
}
