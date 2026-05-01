"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CreditCard, Plus, Receipt as ReceiptIcon } from "lucide-react";
import { getPayments } from "@/_lib/api/payments";
import ReceiptModal from "@/_components/payment/ReceiptModal";
import PaystackModal from "@/_components/payment/PaystackModal";

const STATUS_STYLES = {
  paid: { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  pending: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  failed: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

const MONTHLY_SPEND = [
  { month: "Feb", amount: 15000 },
  { month: "Mar", amount: 50000 },
  { month: "Apr", amount: 40000 },
];

const PAYMENT_TYPE_DATA = [
  { name: "Subscription", value: 45000, fill: "#10B981" },
  { name: "One-time", value: 20000, fill: "#1a2234" },
];

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString("en-NG")}`;
}

export default function ParentPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openReceipt, setOpenReceipt] = useState(null);
  const [openPay, setOpenPay] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPayments()
      .then(setPayments)
      .catch((err) => {
        console.warn("Payments fetch failed:", err.message);
        setError("Failed to load payments. Please refresh.");
      })
      .finally(() => setLoading(false));
  }, [pathname]);

  const subscriptions = useMemo(
    () =>
      payments.filter(
        (p) => p.type === "subscription" && p.status === "paid"
      ),
    [payments]
  );

  const sortedHistory = useMemo(
    () =>
      [...payments].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      ),
    [payments]
  );

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
            Payments
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Subscriptions, history, and quick enrollment.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenPay(true)}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#059669] sm:self-auto"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Pay Now
        </button>
      </header>

      {error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <ActiveSubscriptions
            loading={loading}
            items={subscriptions}
          />

          <ChartsRow />

          <PaymentHistoryTable
            loading={loading}
            items={sortedHistory}
            onView={setOpenReceipt}
          />
        </>
      )}

      <ReceiptModal
        payment={openReceipt}
        onClose={() => setOpenReceipt(null)}
      />
      <PaystackModal
        isOpen={openPay}
        onClose={() => setOpenPay(false)}
      />
    </motion.div>
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

// ── Section 1: Active subscriptions ───────────────────────────────────────

function ActiveSubscriptions({ loading, items }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">
        Active Subscriptions
      </h2>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-32 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center text-sm text-[var(--text-secondary)]">
          No active subscriptions.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((s, i) => (
            <SubscriptionCard key={s.id} sub={s} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

function SubscriptionCard({ sub, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-[var(--text-primary)]">
            {sub.course_title}
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            {sub.student_name}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono-ui"
          style={{ color: "#10B981", backgroundColor: "rgba(16,185,129,0.12)" }}
        >
          Active
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-[#10B981] font-mono-ui">
        {formatNaira(sub.amount)}{" "}
        <span className="text-xs font-medium text-[var(--text-muted)]">/ month</span>
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)] font-mono-ui">
        Active since {format(new Date(sub.created_at), "MMM d, yyyy")}
      </p>
      <button
        type="button"
        className="mt-4 w-full rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
      >
        Manage
      </button>
    </motion.article>
  );
}

// ── Section 2: Charts row ─────────────────────────────────────────────────

function ChartsRow() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Monthly Spend">
        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_SPEND} margin={{ top: 8, right: 12, bottom: 4, left: 8 }}>
              <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                width={48}
              />
              <Tooltip
                cursor={{ fill: "rgba(16,185,129,0.08)" }}
                content={<CurrencyTooltip />}
              />
              <Bar
                dataKey="amount"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
                animationDuration={1200}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Payment Type">
        <div className="relative" style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={PAYMENT_TYPE_DATA}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                stroke="var(--bg-card)"
                strokeWidth={2}
                animationBegin={0}
                animationDuration={1200}
                label={renderPieLabel}
              >
                {PAYMENT_TYPE_DATA.map((d) => (
                  <Cell key={d.name} fill={d.fill} />
                ))}
              </Pie>
              <Tooltip content={<CurrencyTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <PieCenterTotal data={PAYMENT_TYPE_DATA} />
        </div>
        <Legend data={PAYMENT_TYPE_DATA} />
      </ChartCard>
    </section>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
      <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const name = p.name ?? label;
  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 shadow-lg">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
        {name}
      </p>
      <p className="text-sm font-bold text-[#10B981] font-mono-ui">
        {formatNaira(p.value)}
      </p>
    </div>
  );
}

function renderPieLabel({ percent }) {
  if (!percent) return "";
  return `${Math.round(percent * 100)}%`;
}

function PieCenterTotal({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
          Total
        </p>
        <p className="mt-0.5 text-lg font-bold text-[var(--text-primary)] font-mono-ui">
          {formatNaira(total)}
        </p>
      </div>
    </div>
  );
}

function Legend({ data }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
      {data.map((d) => (
        <li key={d.name} className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: d.fill }}
          />
          <span className="text-xs font-semibold text-[var(--text-secondary)] font-mono-ui">
            {d.name} · {formatNaira(d.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ── Section 3: Payment history table ──────────────────────────────────────

function PaymentHistoryTable({ loading, items, onView }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">
        Payment History
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
            <tr>
              <Th>Date</Th>
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
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border-color)]">
                  <td colSpan={7} className="p-3">
                    <div className="skeleton-shimmer h-8 rounded-lg" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-sm text-[var(--text-secondary)]"
                >
                  <CreditCard className="mx-auto mb-2 h-6 w-6 text-[var(--text-muted)]" />
                  No payments yet.
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <PaymentRow key={p.id} payment={p} onView={() => onView(p)} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
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
  const status = STATUS_STYLES[payment.status] ?? STATUS_STYLES.pending;
  return (
    <tr className="border-b border-[var(--border-color)] last:border-b-0 transition-colors hover:bg-[var(--bg-secondary)]/50">
      <td className="px-4 py-3 text-[var(--text-primary)] font-mono-ui">
        {format(new Date(payment.created_at), "MMM d, yyyy")}
      </td>
      <td className="px-4 py-3 text-[var(--text-primary)]">
        {payment.student_name}
      </td>
      <td className="px-4 py-3 text-[var(--text-primary)]">
        {payment.course_title}
      </td>
      <td className="px-4 py-3 font-bold text-[var(--text-primary)] font-mono-ui">
        {formatNaira(payment.amount)}
      </td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono-ui">
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
