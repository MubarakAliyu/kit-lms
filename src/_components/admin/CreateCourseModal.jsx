"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createCourse } from "@/_lib/api/admin";

const PAYMENT_TYPES = ["subscription", "one_time"];

const schema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  description: z.string().trim().min(10, "Add a brief description"),
  price: z.coerce.number().min(0, "Price must be ≥ 0"),
  payment_type: z.enum(PAYMENT_TYPES, { message: "Pick a payment type" }),
  instructor_id: z.string().trim().min(1, "Pick an instructor"),
});

export default function CreateCourseModal({
  isOpen,
  onClose,
  instructors,
  onCreated,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      payment_type: "subscription",
      instructor_id: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      title: "",
      description: "",
      price: 0,
      payment_type: "subscription",
      instructor_id: "",
    });
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, reset]);

  async function onSubmit(values) {
    const instructor = instructors.find((i) => i.id === values.instructor_id);
    try {
      const created = await createCourse({
        ...values,
        instructor_name: instructor?.name,
      });
      toast.success("Course created! Draft saved.");
      onCreated?.(created);
      onClose?.();
    } catch {
      toast.error("Couldn't create course");
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
          onClick={onClose}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Create course"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl"
          >
            <header className="flex items-start justify-between gap-3 border-b border-[var(--border-color)] px-5 py-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Create Course
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="flex flex-col gap-4 overflow-y-auto px-5 py-5"
            >
              <Field id="cc-title" label="Title" error={errors.title?.message}>
                <input
                  id="cc-title"
                  type="text"
                  placeholder="e.g. Scratch Programming"
                  {...register("title")}
                  className={inputClass(errors.title)}
                />
              </Field>

              <Field
                id="cc-desc"
                label="Description"
                error={errors.description?.message}
              >
                <textarea
                  id="cc-desc"
                  rows={3}
                  placeholder="One-paragraph summary…"
                  {...register("description")}
                  className={inputClass(errors.description)}
                />
              </Field>

              <Field id="cc-price" label="Price (₦)" error={errors.price?.message}>
                <input
                  id="cc-price"
                  type="number"
                  min={0}
                  {...register("price")}
                  className={inputClass(errors.price)}
                />
              </Field>

              <Field
                id="cc-payment"
                label="Payment Type"
                error={errors.payment_type?.message}
              >
                <select
                  id="cc-payment"
                  {...register("payment_type")}
                  className={inputClass(errors.payment_type)}
                >
                  <option value="subscription">Subscription</option>
                  <option value="one_time">One-time</option>
                </select>
              </Field>

              <Field
                id="cc-instructor"
                label="Instructor"
                error={errors.instructor_id?.message}
              >
                <select
                  id="cc-instructor"
                  defaultValue=""
                  {...register("instructor_id")}
                  className={inputClass(errors.instructor_id)}
                >
                  <option value="" disabled>
                    Select an instructor…
                  </option>
                  {(instructors ?? []).map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-60"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.97 }}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Course
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ id, label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[var(--text-primary)]">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs font-medium text-red-500 font-mono-ui">{error}</p>
      )}
    </div>
  );
}

function inputClass(err) {
  return `w-full rounded-xl border bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:outline-none focus:ring-2 ${
    err
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-[var(--border-color)] focus:border-[#10B981] focus:ring-[#10B981]/20"
  }`;
}
