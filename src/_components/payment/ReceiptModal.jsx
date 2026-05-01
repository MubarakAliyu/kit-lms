"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { Receipt, X } from "lucide-react";

const STATUS_BADGE = {
  paid: { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  pending: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  failed: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString("en-NG")}`;
}

export default function ReceiptModal({ payment, onClose }) {
  useEffect(() => {
    if (!payment) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [payment, onClose]);

  return (
    <AnimatePresence>
      {payment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Payment receipt"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl"
          >
            <header className="flex items-center justify-between gap-3 bg-[#10B981] px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15">
                  <Receipt className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono-ui">
                  Payment Receipt
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex flex-col gap-3 px-5 py-5">
              <Row label="Receipt #" value={payment.paystack_ref} mono />
              <Row
                label="Date"
                value={format(new Date(payment.created_at), "MMM d, yyyy")}
                mono
              />
              <Row label="Student" value={payment.student_name} />
              <Row label="Course" value={payment.course_title} />
              <Row label="Amount" value={formatNaira(payment.amount)} mono bold />
              <Row label="Type" value={payment.type.replace("_", " ")} mono />
              <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
                  Status
                </span>
                <StatusBadge status={payment.status} />
              </div>
            </div>

            <footer className="flex items-center justify-end border-t border-[var(--border-color)] px-5 py-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
              >
                Close
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value, mono = false, bold = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
        {label}
      </span>
      <span
        className={`text-sm capitalize ${
          bold
            ? "font-bold text-[var(--text-primary)]"
            : "font-semibold text-[var(--text-primary)]"
        } ${mono ? "font-mono-ui" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS_BADGE[status] ?? STATUS_BADGE.pending;
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono-ui"
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      {status}
    </span>
  );
}
