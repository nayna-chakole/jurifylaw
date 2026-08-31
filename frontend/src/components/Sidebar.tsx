"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  User,
  LogOut,
  Scale,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const sidebarItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload Document", icon: UploadCloud },
  { href: "/chat", label: "Legal Assistant", icon: MessageSquare },
  { href: "/history", label: "Recent Documents", icon: FileText },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-purple-100/80 p-5 flex-col justify-between shrink-0 h-full min-h-[calc(100vh-64px)] shadow-xs overflow-y-auto">
      <div className="space-y-6">
        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#7C3AED] text-white shadow-md shadow-purple-500/25"
                    : "text-slate-600 hover:text-[#7C3AED] hover:bg-purple-50/60"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button at bottom of sidebar */}
      <div className="pt-4 border-t border-purple-100">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5 text-slate-500 hover:text-rose-600" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
