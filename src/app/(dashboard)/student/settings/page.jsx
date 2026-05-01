"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Bell,
  Check,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Moon,
  Sun,
  User,
  X,
} from "lucide-react";
import PasswordStrengthBar from "@/_components/auth/PasswordStrengthBar";
import { getStudentMe } from "@/_lib/api/students";
import { changePassword } from "@/_lib/api/settings";
import { useAuthStore } from "@/_store/authStore";

const TABS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "security", label: "Security", icon: Lock },
  { key: "language", label: "Language", icon: Globe },
  { key: "notifications", label: "Notifications", icon: Bell },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("profile");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <TabNav tab={tab} setTab={setTab} />
        <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {tab === "profile" && <ProfileTab />}
              {tab === "security" && <SecurityTab />}
              {tab === "language" && <LanguageTab />}
              {tab === "notifications" && <NotificationsTab />}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}

function TabNav({ tab, setTab }) {
  return (
    <nav
      role="tablist"
      className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-1 lg:flex-col lg:gap-1 lg:p-2"
    >
      {TABS.map((t) => {
        const active = tab === t.key;
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-[#10B981]/10 text-[#10B981]"
                : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={2.2} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Profile ────────────────────────────────────────────────────────────────

function ProfileTab() {
  const { data: session } = useSession();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    getStudentMe().then(setStudent).catch(() => {});
  }, []);

  const initials =
    student?.name?.split(" ").map((s) => s[0]).slice(0, 2).join("") ||
    session?.user?.email?.slice(0, 1).toUpperCase() ||
    "?";

  return (
    <div className="flex flex-col items-start gap-6">
      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#10B981] text-2xl font-bold text-white shadow-sm">
          {initials}
        </div>
        <div>
          <p className="text-lg font-bold text-[var(--text-primary)]">
            {student?.name ?? "—"}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            {session?.user?.email ?? "—"}
          </p>
          {student?.programme_track && (
            <span className="mt-1 inline-flex w-fit rounded-full bg-[#10B981]/10 px-2.5 py-0.5 text-xs font-bold text-[#10B981] font-mono-ui">
              {student.programme_track}
            </span>
          )}
        </div>
      </div>

      <ReadonlyField label="Full name" value={student?.name ?? "—"} />
      <ReadonlyField label="Email" value={session?.user?.email ?? "—"} />
      {student && (
        <ReadonlyField label="Age" value={String(student.age)} />
      )}

      <p className="text-xs text-[var(--text-muted)] font-mono-ui">
        Profile fields are managed by your parent. Contact support to make changes.
      </p>
    </div>
  );
}

function ReadonlyField({ label, value }) {
  return (
    <div className="w-full">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
        {label}
      </p>
      <p className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

// ── Security ───────────────────────────────────────────────────────────────

function SecurityTab() {
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [vals, setVals] = useState({ current: "", next: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);

  const reqs = useMemoizedRequirements(vals);
  const allOk = reqs.every((r) => r.ok) && vals.current.length > 0;

  function update(name, value) {
    setVals((v) => ({ ...v, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!allOk || submitting) return;
    setSubmitting(true);
    try {
      await changePassword({
        current_password: vals.current,
        new_password: vals.next,
      });
      toast.success("Password updated!");
      setVals({ current: "", next: "", confirm: "" });
    } catch {
      toast.error("Couldn't update password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <header>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Change password</h2>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          Use a strong password you don&apos;t reuse anywhere else.
        </p>
      </header>

      <PasswordField
        id="current"
        label="Current password"
        value={vals.current}
        show={show.current}
        onShow={() => setShow((s) => ({ ...s, current: !s.current }))}
        onChange={(v) => update("current", v)}
      />
      <PasswordField
        id="next"
        label="New password"
        value={vals.next}
        show={show.next}
        onShow={() => setShow((s) => ({ ...s, next: !s.next }))}
        onChange={(v) => update("next", v)}
      />
      <PasswordStrengthBar value={vals.next} />
      <PasswordField
        id="confirm"
        label="Confirm new password"
        value={vals.confirm}
        show={show.confirm}
        onShow={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
        onChange={(v) => update("confirm", v)}
      />

      <ul className="flex flex-col gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
        {reqs.map((r) => (
          <li
            key={r.label}
            className="flex items-center gap-2 text-xs font-medium font-mono-ui"
          >
            <span
              className={`grid h-4 w-4 place-items-center rounded-full ${
                r.ok ? "bg-[#10B981] text-white" : "bg-red-500 text-white"
              }`}
            >
              {r.ok ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span className={r.ok ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}>
              {r.label}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="submit"
        disabled={!allOk || submitting}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Update Password
      </button>
    </form>
  );
}

function PasswordField({ id, label, value, show, onShow, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[var(--text-primary)]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2.5 pr-10 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20"
        />
        <button
          type="button"
          onClick={onShow}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function useMemoizedRequirements(vals) {
  return [
    { label: "At least 8 characters", ok: vals.next.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(vals.next) },
    { label: "One number", ok: /\d/.test(vals.next) },
    {
      label: "Passwords match",
      ok: vals.next.length > 0 && vals.next === vals.confirm,
    },
  ];
}

// ── Language ───────────────────────────────────────────────────────────────

function LanguageTab() {
  const { languagePreference, setLanguagePreference } = useAuthStore();
  const [selected, setSelected] = useState(languagePreference || "en");

  function handleSave() {
    setLanguagePreference(selected);
    toast.success("Language preference saved");
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Language</h2>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          Choose the language you&apos;d like the LMS interface in.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <LanguageRadio
          flag="🇬🇧"
          label="English"
          checked={selected === "en"}
          onSelect={() => setSelected("en")}
        />
        <LanguageRadio
          flag="🇳🇬"
          label="Hausa"
          checked={selected === "ha"}
          onSelect={() => setSelected("ha")}
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="self-start rounded-xl bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#059669]"
      >
        Save Preference
      </button>

      <ThemePicker />
    </div>
  );
}

function LanguageRadio({ flag, label, checked, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
        checked
          ? "border-[#10B981] bg-[#10B981]/10"
          : "border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
      }`}
    >
      <span className="text-2xl">{flag}</span>
      <span className="flex-1 font-semibold text-[var(--text-primary)]">{label}</span>
      <span
        className={`grid h-5 w-5 place-items-center rounded-full border-2 ${
          checked ? "border-[#10B981] bg-[#10B981]" : "border-[var(--border-color)]"
        }`}
      >
        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </span>
    </button>
  );
}

function ThemePicker() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="border-t border-[var(--border-color)] pt-5">
      <h3 className="text-sm font-bold text-[var(--text-primary)]">Theme</h3>
      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
        Light mode for daytime, dark mode for late-night sessions.
      </p>
      <div className="mt-3 flex gap-2">
        <ThemeChip
          icon={Sun}
          label="Light"
          active={theme === "light"}
          onClick={() => setTheme("light")}
        />
        <ThemeChip
          icon={Moon}
          label="Dark"
          active={theme === "dark"}
          onClick={() => setTheme("dark")}
        />
      </div>
    </div>
  );
}

function ThemeChip({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
        active
          ? "border-[#10B981] bg-[#10B981]/10 text-[#10B981]"
          : "border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// ── Notifications ──────────────────────────────────────────────────────────

const NOTIFICATION_TOGGLES = [
  { key: "lesson", label: "New lesson published" },
  { key: "feedback", label: "Assignment feedback received" },
  { key: "quiz", label: "Quiz results available" },
  { key: "completion", label: "Course completion" },
  { key: "newCourse", label: "New courses available" },
];

function NotificationsTab() {
  const [prefs, setPrefs] = useState(() =>
    NOTIFICATION_TOGGLES.reduce((acc, t) => ({ ...acc, [t.key]: true }), {})
  );

  function toggle(key) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Notifications</h2>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          Pick which updates you want to receive.
        </p>
      </header>

      <ul className="flex flex-col divide-y divide-[var(--border-color)] rounded-xl border border-[var(--border-color)]">
        {NOTIFICATION_TOGGLES.map((t) => (
          <li key={t.key} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-[var(--text-primary)]">{t.label}</span>
            <Switch checked={prefs[t.key]} onChange={() => toggle(t.key)} />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => toast.success("Preferences saved")}
        className="self-start rounded-xl bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#059669]"
      >
        Save Preferences
      </button>
    </div>
  );
}

function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? "bg-[#10B981]" : "bg-[var(--bg-secondary)] border border-[var(--border-color)]"
      }`}
    >
      <motion.span
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}
