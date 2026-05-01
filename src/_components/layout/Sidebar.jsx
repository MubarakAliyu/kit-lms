"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  MessageSquare,
  Settings,
  Users,
  CreditCard,
  BarChart2,
  Award,
  Bell,
  Zap,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useSidebarStore } from "@/_store/sidebarStore";
import { useNotificationStore } from "@/_store/notificationStore";
import LogoutModal from "@/_components/ui/LogoutModal";

const ICONS = {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  MessageSquare,
  Settings,
  Users,
  CreditCard,
  BarChart2,
  Award,
  Bell,
};

const NAV_ITEMS = {
  student: [
    { label: "Dashboard", icon: "LayoutDashboard", href: "/student" },
    { label: "My Courses", icon: "BookOpen", href: "/student/courses" },
    { label: "Assignments", icon: "ClipboardList", href: "/student/assignments" },
    { label: "Certificates", icon: "Award", href: "/student/certificates" },
    { label: "Notifications", icon: "Bell", href: "/student/notifications" },
    { label: "Chat", icon: "MessageSquare", href: "/student/chat" },
    { label: "Settings", icon: "Settings", href: "/student/settings" },
  ],
  parent: [
    { label: "Dashboard", icon: "LayoutDashboard", href: "/parent" },
    { label: "My Children", icon: "Users", href: "/parent/children" },
    { label: "Payments", icon: "CreditCard", href: "/parent/payments" },
    { label: "Notifications", icon: "Bell", href: "/parent/notifications" },
    { label: "Settings", icon: "Settings", href: "/parent/settings" },
  ],
  instructor: [
    { label: "Dashboard", icon: "LayoutDashboard", href: "/instructor" },
    { label: "My Courses", icon: "BookOpen", href: "/instructor/courses" },
    { label: "Students", icon: "Users", href: "/instructor/students" },
    { label: "Assignments", icon: "ClipboardList", href: "/instructor/assignments" },
    { label: "Chat", icon: "MessageSquare", href: "/instructor/chat" },
    { label: "Notifications", icon: "Bell", href: "/instructor/notifications" },
    { label: "Settings", icon: "Settings", href: "/instructor/settings" },
  ],
  admin: [
    { label: "Dashboard", icon: "LayoutDashboard", href: "/admin" },
    { label: "Users", icon: "Users", href: "/admin/users" },
    { label: "Courses", icon: "BookOpen", href: "/admin/courses" },
    { label: "Analytics", icon: "BarChart2", href: "/admin/analytics" },
    { label: "Payments", icon: "CreditCard", href: "/admin/payments" },
    { label: "Notifications", icon: "Bell", href: "/admin/notifications" },
    { label: "Settings", icon: "Settings", href: "/admin/settings" },
  ],
};

function isItemActive(pathname, href, role) {
  if (pathname === href) return true;
  if (href === `/${role}`) return false;
  return pathname.startsWith(`${href}/`);
}

function getInitials(session) {
  const email = session?.user?.email ?? "";
  return email.slice(0, 1).toUpperCase() || "?";
}

export default function Sidebar() {
  const { isOpen, isCollapsed, toggleCollapse, close } = useSidebarStore();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const items = NAV_ITEMS[role] ?? [];

  const [showLogout, setShowLogout] = useState(false);

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: isCollapsed ? 64 : 240 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative hidden h-screen shrink-0 flex-col border-r bg-[var(--bg-sidebar)] border-[var(--sidebar-border)] md:sticky md:top-0 md:flex"
      >
        <SidebarBody
          items={items}
          role={role}
          session={session}
          isCollapsed={isCollapsed}
          onLogout={() => setShowLogout(true)}
        />
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-20 grid h-6 w-6 place-items-center rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--bg-secondary)] hover:text-[#10B981]"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              aria-hidden="true"
            />
            <motion.aside
              key="sidebar-mobile"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col border-r bg-[var(--bg-sidebar)] border-[var(--sidebar-border)] shadow-xl md:hidden"
            >
              <SidebarBody
                items={items}
                role={role}
                session={session}
                isCollapsed={false}
                onItemClick={close}
                onLogout={() => {
                  close();
                  setShowLogout(true);
                }}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <LogoutModal
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
      />
    </>
  );
}

function SidebarBody({ items, role, session, isCollapsed, onItemClick, onLogout }) {
  const pathname = usePathname();
  const { unreadCount } = useNotificationStore();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Logo block */}
      <div className="flex items-center gap-2.5 border-b border-[var(--sidebar-border)] px-3 py-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#10B981] text-white shadow-sm">
          <Zap className="h-5 w-5" strokeWidth={2.5} fill="currentColor" />
        </div>
        {!isCollapsed && (
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-sans text-base font-bold text-[var(--text-primary)]">
              Kids In Tech
            </span>
            <span className="rounded-md bg-[#10B981] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white font-mono-ui">
              LMS
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isItemActive(pathname, item.href, role);
            const showBadge =
              item.href.endsWith("/notifications") && unreadCount > 0;
            return (
              <li key={item.href}>
                <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.15 }}>
                  <Link
                    href={item.href}
                    onClick={onItemClick}
                    title={isCollapsed ? item.label : undefined}
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#10B981]/10 text-[#10B981]"
                        : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                    } ${isCollapsed ? "justify-center" : ""}`}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-[#10B981]"
                      />
                    )}
                    {Icon && (
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          active ? "text-[#10B981]" : "text-[var(--text-secondary)]"
                        }`}
                        strokeWidth={2.2}
                      />
                    )}
                    {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}
                    {showBadge && !isCollapsed && (
                      <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white font-mono-ui">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                    {showBadge && isCollapsed && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </Link>
                </motion.div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User block */}
      <div className="border-t border-[var(--sidebar-border)] p-3">
        <div
          className={`flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)] p-2.5 ${
            isCollapsed ? "justify-center" : ""
          }`}
          title={isCollapsed ? session?.user?.email : undefined}
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#10B981] text-sm font-bold text-white">
            {getInitials(session)}
          </div>
          {!isCollapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {session?.user?.email ?? "—"}
              </span>
              {role && (
                <span className="w-fit rounded bg-[var(--bg-card)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-ui">
                  {role}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={`mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-red-500/10 hover:text-red-500 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-4 w-4" strokeWidth={2.2} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
