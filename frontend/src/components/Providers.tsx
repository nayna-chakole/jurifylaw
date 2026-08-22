"use client";

import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/auth-context";
import CookieConsent from "@/components/CookieConsent";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <CookieConsent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(17, 24, 39, 0.9)",
            color: "#f1f5f9",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            backdropFilter: "blur(12px)",
            borderRadius: "12px",
          },
          success: {
            iconTheme: { primary: "#10b981", secondary: "#f1f5f9" },
          },
          error: {
            iconTheme: { primary: "#f43f5e", secondary: "#f1f5f9" },
          },
        }}
      />
    </AuthProvider>
  );
}
