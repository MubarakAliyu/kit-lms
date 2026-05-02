"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { differenceInDays, format } from "date-fns";
import { toast } from "sonner";
import {
  CreditCard,
  Download,
  Receipt as ReceiptIcon,
} from "lucide-react";
import { getAdminPayments } from "@/_lib/api/admin";
import { useCountUp } from "@/_hooks/useCountUp";
import ReceiptModal from "@/_components/payment/ReceiptModal";

const RANGES = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "all", label: "All Time" },
];

const STATUS_TONE = {
  paid: { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  pending: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  failed: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

function formatNaira(n) {
  return `₦${Number(n).toLocaleString("en-NG")}`;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState("all");
  const [openReceipt, setOpenReceipt] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAdminPayments()
      .then((res) => setPayments(res?.payments ?? res ?? []))
      .catch((err) => {
        console.warn("Payments fetch failed:", err.message);
        setError("Failed to load payments. Please refresh.");
      })
      .finally(() => setLoading(false));
  }, [pathname]);

  const filtered = useMemo(() => {
    if (range === "all") return payments;
    const now = new Date();
    const limit = range === "week" ? 7 : 30;
    return payments.filter((p) => {
      const days = differenceInDays(now, new Date(p.created_at));
      return days >= 0 && days <= limit;
    });
  }, [payments, range]);

  const sortedHistory = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      ),
    [filtered]
  );

  const totals = useMemo(() => {
    const total = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
    const subscription = payments
      .filter((p) => p.type === "subscription" && p.status === "paid")
      .reduce((s, p) => s + p.amount, 0);
    const oneTime = payments
      .filter((p) => p.type === "one_time" && p.status === "paid")
      .reduce((s, p) => s + p.amount, 0);
    return { total, subscription, oneTime };
  }, [payments]);

  function exportCSV() {
    if (sortedHistory.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const headers = [
      "Date",
      "Parent",
      "Student",
      "Course",
      "Amount",
      "Type",
      "Status",
      "Ref",
    ];
    const rows = sortedHistory.map((p) => [
      format(new Date(p.created_at), "yyyy-MM-dd"),
      p.parent_name ?? "",
      p.student_name ?? "",
      p.course_title ?? "",
      p.amount,
      p.type,
      p.status,
      p.paystack_ref,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kit-payments.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-6"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Payment Management
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Cross-platform payment history and revenue.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)] sm:self-auto"
        >
          <Download className="h-4 w-4" strokeWidth={2.2} />
          Export CSV
        </button>
      </header>

      <RevenueSummary totals={totals} />

      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => {
          const active = range === r.key;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors font-mono-ui ${
                active
                  ? "border-[#10B981] bg-[#10B981] text-white"
                  : "border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
              <tr>
                <Th>Date</Th>
                <Th>Parent</Th>
                <Th>Student</Th>
                <Th>Course</Th>
                <Th>Amount</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th align="right">Receipt</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-color)]">
                    <td colSpan={8} className="p-3">
                      <div className="skeleton-shimmer h-8 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : sortedHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-[var(--text-secondary)]">
                    <CreditCard className="mx-auto mb-2 h-6 w-6 text-[var(--text-muted)]" />
                    No payments in this range.
                  </td>
                </tr>
              ) : (
                sortedHistory.map((p) => (
                  <PaymentRow
                    key={p.id}
                    payment={p}
                    onView={() => setOpenReceipt(p)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ReceiptModal payment={openReceipt} onClose={() => setOpenReceipt(null)} />
    </motion.div>
  );
}

function RevenueSummary({ totals }) {
  const total = useCountUp(totals.total);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
          Total Revenue
        </p>
        <p className="mt-1 text-3xl font-bold text-[#10B981] font-mono-ui">
          {formatNaira(total)}
        </p>
      </div>
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
          Subscriptions
        </p>
        <p className="mt-1 text-2xl font-bold text-[var(--text-primary)] font-mono-ui">
          {formatNaira(totals.subscription)}
        </p>
      </div>
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
          One-time
        </p>
        <p className="mt-1 text-2xl font-bold text-[var(--text-primary)] font-mono-ui">
          {formatNaira(totals.oneTime)}
        </p>
      </div>
    </div>
  );
}

function Th({ children, align = "left" }) {
  return (
    <th
      className={`px-4 py-3 text-${align} text-[10px] font-bold uppercase tracking-wider font-mono-ui`}
    >
      {children}
    </th>
  );
}

function PaymentRow({ payment, onView }) {
  const status = STATUS_TONE[payment.status] ?? STATUS_TONE.pending;
  return (
    <tr className="border-b border-[var(--border-color)] last:border-b-0 transition-colors hover:bg-[var(--bg-secondary)]/50">
      <td className="px-4 py-3 text-[var(--text-primary)] font-mono-ui">
        {format(new Date(payment.created_at), "MMM d, yyyy")}
      </td>
      <td className="px-4 py-3 text-[var(--text-primary)]">
        {payment.parent_name ?? "—"}
      </td>
      <td className="px-4 py-3 text-[var(--text-primary)]">
        {payment.student_name ?? "—"}
      </td>
      <td className="px-4 py-3 text-[var(--text-primary)]">
        {payment.course_title}
      </td>
      <td className="px-4 py-3 font-bold text-[#10B981] font-mono-ui">
        {formatNaira(payment.amount)}
      </td>
      <td className="px-4 py-3">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono-ui"
          style={
            payment.type === "subscription"
              ? { color: "#10B981", backgroundColor: "rgba(16,185,129,0.12)" }
              : { color: "#3B82F6", backgroundColor: "rgba(59,130,246,0.12)" }
          }
        >
          {payment.type.replace("_", " ")}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono-ui"
          style={{ color: status.color, backgroundColor: status.bg }}
        >
          {payment.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
        >
          <ReceiptIcon className="h-3.5 w-3.5" />
          View
        </button>
      </td>
    </tr>
  );
}

function ErrorState({ message }) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] py-12 text-center">
      <p className="text-sm text-red-400">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-3 text-sm font-semibold text-[#10B981] underline transition-colors hover:text-[#059669] font-mono-ui"
      >
        Refresh page
      </button>
    </div>
  );
}
