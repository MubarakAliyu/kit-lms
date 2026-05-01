"use client";

import { Toaster } from "sonner";
import RouteGuard from "@/_components/auth/RouteGuard";
import ForceResetGuard from "@/_components/auth/ForceResetGuard";
import Sidebar from "@/_components/layout/Sidebar";
import Topbar from "@/_components/layout/Topbar";

// SessionProvider is mounted once at the root layout — RouteGuard's
// useSession() reads from there. ForceResetGuard sits inside RouteGuard so it
// only fires once we know we have an authenticated session, and it bounces
// must_reset_password users out before any dashboard UI loads.
export default function DashboardLayout({ children }) {
  return (
    <>
      <RouteGuard>
        <ForceResetGuard>
          <div className="flex h-screen overflow-hidden bg-[var(--bg-secondary)]">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Topbar />
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
        </ForceResetGuard>
      </RouteGuard>
      <Toaster position="top-right" richColors />
    </>
  );
}
