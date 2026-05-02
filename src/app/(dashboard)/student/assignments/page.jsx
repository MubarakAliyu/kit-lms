"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { differenceInDays, format } from "date-fns";
import { toast } from "sonner";
import {
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import { getAssignments, submitAssignment } from "@/_lib/api/assignments";
import { notifyAdmin } from "@/_lib/notifications/adminNotify";
import { useSession } from "next-auth/react";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "submitted", label: "Submitted" },
  { key: "reviewed", label: "Reviewed" },
];

const STATUS_STYLES = {
  pending: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  submitted: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  reviewed: { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [openId, setOpenId] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    getAssignments()
      .then(setAssignments)
      .finally(() => setLoading(false));
  }, [pathname]);

  const visible = useMemo(
    () => assignments.filter((a) => a.status === activeTab),
    [assignments, activeTab]
  );
  const opened = assignments.find((a) => a.id === openId);

  function handleSubmitted(id, payload) {
    setAssignments((list) =>
      list.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "submitted",
              submission_type: payload.submission_type,
              submission_content: payload.content,
            }
          : a
      )
    );
    setActiveTab("submitted");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Assignments</h1>

      {/* Tabs */}
      <nav className="flex gap-1 border-b border-[var(--border-color)]" role="tablist">
        {TABS.map((t) => {
          const active = t.key === activeTab;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`relative px-4 py-2.5 text-sm font-semibold transition-colors font-mono-ui ${
                active ? "text-[#10B981]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t.label}
              {active && (
                <motion.span
                  layoutId="assignment-tab-underline"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-[#10B981]"
                  transition={{ type: "spring", stiffness: 280, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {loading ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyTab tab={activeTab} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {visible.map((a, i) => (
            <AssignmentCard key={a.id} item={a} index={i} onView={() => setOpenId(a.id)} />
          ))}
        </ul>
      )}

      <AnimatePresence>
        {opened && (
          <AssignmentDetailModal
            assignment={opened}
            onClose={() => setOpenId(null)}
            onSubmitted={handleSubmitted}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function deadlineMeta(deadline) {
  const days = differenceInDays(new Date(deadline), new Date());
  if (days < 0) return { color: "#EF4444", bg: "rgba(239,68,68,0.12)", label: "Overdue" };
  if (days < 3) return { color: "#EF4444", bg: "rgba(239,68,68,0.12)", label: `${days}d left` };
  if (days < 7) return { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", label: `${days}d left` };
  return { color: "#10B981", bg: "rgba(16,185,129,0.12)", label: `${days}d left` };
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono-ui"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {status}
    </span>
  );
}

function AssignmentCard({ item, index, onView }) {
  const meta = deadlineMeta(item.deadline);
  const reviewed = item.status === "reviewed";
  const grade = item.grade;
  const tone = grade ? (GRADE_TONE[grade] ?? GRADE_TONE.B) : null;
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="flex flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={item.status} />
        {item.status === "pending" && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold font-mono-ui"
            style={{ color: meta.color, backgroundColor: meta.bg }}
          >
            {meta.label}
          </span>
        )}
        {reviewed && grade && (
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-bold font-mono-ui"
            style={{ color: tone.color, backgroundColor: tone.bg }}
          >
            {grade}
          </span>
        )}
      </div>
      <h2 className="mt-3 text-base font-semibold text-[var(--text-primary)]">
        {item.title}
      </h2>
      <p className="mt-1 text-xs text-[var(--text-secondary)] font-mono-ui">
        Module {item.module_id}
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)] font-mono-ui">
        Due {item.deadline}
      </p>

      {reviewed && item.feedback && (
        <div className="mt-3 rounded-lg border-l-4 border-[#10B981] bg-[var(--bg-secondary)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
            Instructor Feedback
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-[var(--text-primary)]">
            {item.feedback}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onView}
        className="mt-4 w-full rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
      >
        View Details
      </button>
    </motion.li>
  );
}

function EmptyTab({ tab }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] p-10 text-center">
      <p className="text-sm text-[var(--text-secondary)]">
        Nothing in <span className="font-semibold text-[var(--text-primary)]">{tab}</span> right now.
      </p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer h-44 w-full rounded-2xl"
        />
      ))}
    </div>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────

const GRADE_TONE = {
  "A+": { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  A: { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  "B+": { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  B: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  C: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  D: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  F: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

function AssignmentDetailModal({ assignment, onClose, onSubmitted }) {
  const { data: session } = useSession();
  // Editing flag controls whether the submission preview or the submit form
  // is rendered. Submitted/reviewed assignments default to preview; pending
  // ones default to the form.
  const [editing, setEditing] = useState(assignment.status === "pending");
  const [type, setType] = useState(assignment.submission_type ?? "text");
  const [text, setText] = useState(
    assignment.submission_type === "text" ? assignment.submission_content ?? "" : ""
  );
  const [link, setLink] = useState(
    assignment.submission_type === "link" ? assignment.submission_content ?? "" : ""
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (type === "text" && text.trim().length < 20) {
      toast.error("Written answer must be at least 20 characters");
      return;
    }
    if (type === "link") {
      try {
        const u = new URL(link);
        if (!/^https?:$/.test(u.protocol)) throw new Error();
      } catch {
        toast.error("Enter a valid URL (https://…)");
        return;
      }
    }

    const content = type === "text" ? text.trim() : link.trim();
    setSubmitting(true);
    try {
      await submitAssignment({
        assignment_id: assignment.id,
        submission_type: type,
        content,
      });
      toast.success("Assignment submitted! ✓");
      notifyAdmin("assignment_submitted", {
        student_name: session?.user?.name ?? "Student",
        assignment_title: assignment.title,
      });
      onSubmitted?.(assignment.id, { submission_type: type, content });
      setEditing(false);
    } catch {
      toast.error("Couldn't submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-0 backdrop-blur-sm sm:p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-[var(--bg-card)] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-[var(--border-color)] sm:shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--border-color)] px-5 py-4">
          <div>
            <StatusBadge status={assignment.status} />
            <h2 className="mt-2 text-lg font-bold text-[var(--text-primary)]">
              {assignment.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
          <p className="text-sm text-[var(--text-secondary)]">
            {assignment.instructions}
          </p>

          {assignment.status === "reviewed" && (
            <ReviewFeedback assignment={assignment} />
          )}

          {assignment.status === "submitted" && !editing && (
            <SubmissionPreview
              type={assignment.submission_type ?? type}
              content={
                assignment.submission_content ??
                (type === "link" ? link : text)
              }
              onEdit={() => setEditing(true)}
            />
          )}

          {(assignment.status === "pending" ||
            (assignment.status === "submitted" && editing)) && (
            <SubmitForm
              type={type}
              setType={setType}
              text={text}
              setText={setText}
              link={link}
              setLink={setLink}
            />
          )}
        </div>

        {(assignment.status === "pending" ||
          (assignment.status === "submitted" && editing)) && (
          <footer className="flex items-center justify-between gap-2 border-t border-[var(--border-color)] px-5 py-3">
            {assignment.status === "submitted" && editing ? (
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={submitting}
                className="text-xs font-semibold text-[var(--text-secondary)] underline transition-colors hover:text-[var(--text-primary)] font-mono-ui"
              >
                Cancel edit
              </button>
            ) : (
              <span />
            )}
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Assignment
            </motion.button>
          </footer>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Submit form (text vs link chooser) ───────────────────────────────────

function SubmitForm({ type, setType, text, setText, link, setLink }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TypeCard
          icon={Pencil}
          title="Written Answer"
          description="Type your response"
          active={type === "text"}
          onClick={() => setType("text")}
        />
        <TypeCard
          icon={LinkIcon}
          title="Submit a Link"
          description="URL to your work"
          active={type === "link"}
          onClick={() => setType("link")}
        />
      </div>

      {type === "text" ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your answer here..."
            rows={4}
            className="w-full resize-y rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20"
          />
          <p className="mt-1 text-[11px] text-[var(--text-muted)] font-mono-ui">
            {text.length} characters · min 20
          </p>
        </div>
      ) : (
        <div>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://scratch.mit.edu/projects/..."
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20"
          />
          <p className="mt-1 text-[11px] text-[var(--text-muted)] font-mono-ui">
            Paste a link to your project, Google Doc, or any online resource.
          </p>
        </div>
      )}
    </div>
  );
}

function TypeCard({ icon: Icon, title, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-colors ${
        active
          ? "border-[#10B981] bg-[#10B981]/10"
          : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-muted)]"
      }`}
    >
      <span
        className={`grid h-10 w-10 place-items-center rounded-full ${
          active
            ? "bg-[#10B981] text-white"
            : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <span className="text-sm font-bold text-[var(--text-primary)]">{title}</span>
      <span className="text-xs text-[var(--text-secondary)]">{description}</span>
    </button>
  );
}

// ── Submission preview (post-submit, pre-review) ──────────────────────────

function SubmissionPreview({ type, content, onEdit }) {
  return (
    <div>
      {type === "text" ? (
        <div className="rounded-lg border-l-4 border-[#10B981] bg-[var(--bg-secondary)] p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
            Your written answer
          </p>
          <p className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">
            {content || "—"}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border-l-4 border-[#3B82F6] bg-[var(--bg-secondary)] p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
            Your submitted link
          </p>
          {content ? (
            <a
              href={content}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#3B82F6] underline hover:no-underline"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="break-all">{content}</span>
            </a>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No link provided.</p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={onEdit}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit Submission
      </button>
    </div>
  );
}

// ── Reviewed feedback section ─────────────────────────────────────────────

function ReviewFeedback({ assignment }) {
  const tone = GRADE_TONE[assignment.grade] ?? GRADE_TONE.B;
  return (
    <section className="rounded-xl border-l-4 border-[#10B981] bg-[#10B981]/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#10B981] font-mono-ui">
            Instructor Feedback
          </p>
          {assignment.reviewed_at && (
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)] font-mono-ui">
              Reviewed {format(new Date(assignment.reviewed_at), "MMM d, yyyy")}
            </p>
          )}
        </div>
        {assignment.grade && (
          <span
            className="rounded-full px-3 py-1 text-base font-bold font-mono-ui"
            style={{ color: tone.color, backgroundColor: tone.bg }}
          >
            {assignment.grade}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--text-primary)]">
        {assignment.feedback || "No feedback yet."}
      </p>

      {assignment.submission_type && assignment.submission_content && (
        <details className="mt-4 group">
          <summary className="cursor-pointer text-xs font-semibold text-[#10B981] underline font-mono-ui">
            View your submission
          </summary>
          <div className="mt-2">
            {assignment.submission_type === "text" ? (
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
                <p className="whitespace-pre-wrap text-xs text-[var(--text-primary)]">
                  {assignment.submission_content}
                </p>
              </div>
            ) : (
              <a
                href={assignment.submission_content}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#3B82F6] underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="break-all">{assignment.submission_content}</span>
              </a>
            )}
          </div>
        </details>
      )}
    </section>
  );
}
