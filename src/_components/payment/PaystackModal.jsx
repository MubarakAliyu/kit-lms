"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { getChildren } from "@/_lib/api/parents";
import { initiatePayment, verifyPayment } from "@/_lib/api/payments";

const COURSE_OPTIONS = [
  { id: "c1", title: "Scratch Programming", price: 15000 },
  { id: "c2", title: "Web Development", price: 20000 },
  { id: "c3", title: "Robotics Basics", price: 25000 },
];

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString("en-NG")}`;
}

export default function PaystackModal({ isOpen, onClose, onSuccess }) {
  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [stage, setStage] = useState("form"); // 'form' | 'loading' | 'success'
  const [reference, setReference] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setChildId("");
    setCourseId("");
    setStage("form");
    setReference("");
    getChildren().then(setChildren).catch(() => setChildren([]));
    const onKey = (e) => {
      if (e.key === "Escape" && stage === "form") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, stage]);

  const selectedCourse = COURSE_OPTIONS.find((c) => c.id === courseId) ?? null;
  const selectedChild = children.find((c) => c.id === childId) ?? null;

  async function handlePay() {
    if (!selectedChild || !selectedCourse) {
      toast.error("Choose a child and a course first");
      return;
    }
    setStage("loading");
    try {
      const init = await initiatePayment({
        student_id: selectedChild.id,
        course_id: selectedCourse.id,
        amount: selectedCourse.price,
      });
      // Simulate the user completing the Paystack inline checkout. In prod we
      // would launch PaystackPop with init.access_code and verify on callback.
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const verified = await verifyPayment(init.reference);
      setReference(verified.reference);
      setStage("success");
      toast.success("Payment confirmed!");
      onSuccess?.({
        reference: verified.reference,
        student_id: selectedChild.id,
        course_id: selectedCourse.id,
        amount: selectedCourse.price,
      });
    } catch {
      toast.error("Payment failed — try again");
      setStage("form");
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={stage === "form" ? onClose : undefined}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Enroll a child"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl"
          >
            <header className="flex items-start justify-between gap-3 border-b border-[var(--border-color)] px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Enroll a Child
                </h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Pay securely via Paystack.
                </p>
              </div>
              {stage === "form" && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="grid h-8 w-8 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </header>

            <div className="px-5 py-5">
              {stage === "success" ? (
                <SuccessView
                  amount={selectedCourse?.price}
                  courseTitle={selectedCourse?.title}
                  childName={selectedChild?.name}
                  reference={reference}
                  onClose={onClose}
                />
              ) : (
                <FormView
                  children={children}
                  childId={childId}
                  setChildId={setChildId}
                  courseId={courseId}
                  setCourseId={setCourseId}
                  selectedCourse={selectedCourse}
                  loading={stage === "loading"}
                  onPay={handlePay}
                  onCancel={onClose}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FormView({
  children,
  childId,
  setChildId,
  courseId,
  setCourseId,
  selectedCourse,
  loading,
  onPay,
  onCancel,
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pay-child" className="text-sm font-semibold text-[var(--text-primary)]">
          Child
        </label>
        <select
          id="pay-child"
          value={childId}
          onChange={(e) => setChildId(e.target.value)}
          disabled={loading}
          className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 disabled:opacity-60"
        >
          <option value="" disabled>
            Select a child…
          </option>
          {children.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pay-course" className="text-sm font-semibold text-[var(--text-primary)]">
          Course
        </label>
        <select
          id="pay-course"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          disabled={loading}
          className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 disabled:opacity-60"
        >
          <option value="" disabled>
            Select a course…
          </option>
          {[
            { id: "c1", title: "Scratch Programming", price: 15000 },
            { id: "c2", title: "Web Development", price: 20000 },
            { id: "c3", title: "Robotics Basics", price: 25000 },
          ].map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} — ₦{c.price.toLocaleString("en-NG")}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
          Amount
        </p>
        <p className="mt-1 text-2xl font-bold text-[#10B981] font-mono-ui">
          {selectedCourse ? `₦${selectedCourse.price.toLocaleString("en-NG")}` : "—"}
        </p>
      </div>

      <div className="mt-1 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-60"
        >
          Cancel
        </button>
        <motion.button
          type="button"
          onClick={onPay}
          disabled={loading || !childId || !courseId}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Processing…" : "Pay with Paystack"}
        </motion.button>
      </div>
    </div>
  );
}

function SuccessView({ amount, courseTitle, childName, reference, onClose }) {
  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        className="grid h-16 w-16 place-items-center rounded-full bg-[#10B981] text-white shadow-lg"
      >
        <Check className="h-8 w-8" strokeWidth={3} />
      </motion.span>
      <h3 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
        Payment Successful! 🎉
      </h3>
      <p className="text-sm text-[var(--text-secondary)]">
        {childName} is enrolled in <span className="font-semibold text-[var(--text-primary)]">{courseTitle}</span>
      </p>
      <p className="text-2xl font-bold text-[#10B981] font-mono-ui">
        {formatNaira(amount ?? 0)}
      </p>
      <p className="text-[11px] text-[var(--text-muted)] font-mono-ui">
        Ref: {reference}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full rounded-xl bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#059669]"
      >
        Done
      </button>
    </div>
  );
}
