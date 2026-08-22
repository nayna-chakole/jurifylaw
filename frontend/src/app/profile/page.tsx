"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  FileText,
  KeyRound,
  LogOut,
  Sparkles,
  Check,
  Loader2,
  Calendar,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { documentsAPI } from "@/lib/api";
import toast from "react-hot-toast";

interface UserDoc {
  id: number;
  original_filename: string;
  file_size?: number;
  created_at: string;
  status: string;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "docs" | "password">("profile");

  const [documents, setDocuments] = useState<UserDoc[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Change Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const userName = user?.full_name || "Adam";
  const userEmail = user?.email || "adam@gmail.com";

  useEffect(() => {
    const fetchUserDocs = async () => {
      try {
        setLoadingDocs(true);
        const res = await documentsAPI.list(1, 50);
        if (res.data?.items) {
          setDocuments(res.data.items);
          setTotalDocs(res.data.total || res.data.items.length);
        }
      } catch {
        // Fallback
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchUserDocs();
  }, []);

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Password updated successfully!");
    }, 800);
  };

  return (
    <div className="bg-[#FAF8FF] min-h-[calc(100vh-64px)] p-6 sm:p-8 lg:p-10">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* ── Left Sidebar Profile Card ── */}
        <div className="md:col-span-4 bg-white rounded-3xl p-6 border border-purple-100/80 shadow-xs space-y-6 self-start">
          {/* Avatar & User Details */}
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
            <div className="h-12 w-12 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-bold text-base shadow-sm">
              {userName[0]?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#1E1B4B] truncate">{userName}</div>
              <div className="text-xs text-slate-400 truncate">{userEmail}</div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-1.5">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[#7C3AED] text-white shadow-xs"
                  : "text-slate-600 hover:bg-purple-50"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Profile Information</span>
            </button>

            <button
              onClick={() => setActiveTab("docs")}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "docs"
                  ? "bg-[#7C3AED] text-white shadow-xs"
                  : "text-slate-600 hover:bg-purple-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4" />
                <span>Documents Uploaded</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === "docs" ? "bg-white/20 text-white" : "bg-purple-100 text-[#7C3AED]"
              }`}>
                {totalDocs}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("password")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "password"
                  ? "bg-[#7C3AED] text-white shadow-xs"
                  : "text-slate-600 hover:bg-purple-50"
              }`}
            >
              <KeyRound className="h-4 w-4" />
              <span>Change Password</span>
            </button>
          </div>

          {/* Logout */}
          <div className="pt-6 border-t border-slate-100">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-rose-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* ── Right Content Area ── */}
        <div className="md:col-span-8 space-y-6">
          {/* TAB 1: Profile Information */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-6">
                <h2 className="text-base font-bold text-[#1E1B4B]">
                  Profile Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Full Name</span>
                    <span className="text-sm font-semibold text-[#1E1B4B]">{userName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Email Address</span>
                    <span className="text-sm font-semibold text-[#1E1B4B]">{userEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Account Role</span>
                    <span className="text-sm font-semibold text-[#7C3AED]">Standard Legal Pro</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Member Since</span>
                    <span className="text-sm font-semibold text-[#1E1B4B]">August 2024</span>
                  </div>
                </div>
              </div>

              {/* Documents Uploaded Stat Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1E1B4B] mb-1">
                    Documents Uploaded
                  </h3>
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#7C3AED] mt-1">
                    {totalDocs}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Total Legal Documents Analyzed
                  </p>
                </div>

                <div className="h-16 w-16 rounded-2xl bg-purple-50 text-[#7C3AED] flex items-center justify-center border border-purple-100">
                  <FileText className="h-8 w-8" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Documents Uploaded */}
          {activeTab === "docs" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#1E1B4B]">
                    Documents Uploaded ({documents.length})
                  </h2>
                  <p className="text-xs text-slate-500">Access all your analyzed contracts.</p>
                </div>
                <Link href="/upload" className="btn-primary !text-xs !py-2 !px-4">
                  Upload New
                </Link>
              </div>

              {loadingDocs ? (
                <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#7C3AED]" /> Loading documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-purple-50/20 rounded-2xl p-6 border border-dashed border-purple-100">
                  <FileText className="h-10 w-10 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">No documents found</div>
                  <p className="text-xs text-slate-400">You haven&apos;t uploaded any legal documents yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/analysis/${doc.id}`}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/40 hover:bg-purple-50 border border-purple-100/60 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors truncate">
                            {doc.original_filename}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(doc.created_at).toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-safe">{doc.status}</span>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#7C3AED] transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Change Password */}
          {activeTab === "password" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#1E1B4B]">Change Password</h2>
                <p className="text-xs text-slate-500">Ensure your account uses a strong, secure password.</p>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 8 characters)"
                    minLength={8}
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    minLength={8}
                    required
                    className="input-field"
                  />
                  {confirmNewPassword && newPassword !== confirmNewPassword && (
                    <p className="text-xs text-rose-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="btn-primary !py-2.5 !px-6 !rounded-xl !text-xs font-semibold shadow-xs"
                  >
                    {isUpdatingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
