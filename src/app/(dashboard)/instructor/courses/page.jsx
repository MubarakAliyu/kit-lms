"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  ClipboardList,
  FileText,
  Film,
  Layers,
  Link as LinkIcon,
  Loader2,
  Paperclip,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { getInstructorCourses } from "@/_lib/api/instructor";
import { getCourseModules } from "@/_lib/api/courses";
import { apiClient } from "@/_lib/api/client";
import CourseThumbnail from "@/_components/ui/CourseThumbnail";
import AddModuleModal from "@/_components/instructor/AddModuleModal";
import AddLessonModal from "@/_components/instructor/AddLessonModal";
import AddQuizModal from "@/_components/instructor/AddQuizModal";
import AddAssignmentModal from "@/_components/instructor/AddAssignmentModal";

const CONTENT_ICON = {
  video: Film,
  text: FileText,
  file: Paperclip,
  link: LinkIcon,
};

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addModule, setAddModule] = useState(null); // courseId
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    setError(null);
    getInstructorCourses()
      .then(setCourses)
      .catch((err) => {
        console.warn("Courses fetch failed:", err.message);
        setError("Failed to load courses. Please refresh.");
      })
      .finally(() => setLoading(false));
  }, [pathname]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-6"
    >
      <header>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          My Courses
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Author modules, lessons, quizzes, and assignments for each course.
        </p>
      </header>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="flex flex-col gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-48 rounded-2xl" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] p-10 text-center text-sm text-[var(--text-secondary)]">
          You haven&apos;t created any courses yet.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {courses.map((course) => (
            <CourseSection
              key={course.id}
              course={course}
              onAddModule={() => setAddModule(course.id)}
            />
          ))}
        </div>
      )}

      <AddModuleModal
        isOpen={!!addModule}
        onClose={() => setAddModule(null)}
        courseId={addModule}
        onCreated={() => toast.info("Refresh to see the new module")}
      />
    </motion.div>
  );
}

// ── Course section with module accordion ─────────────────────────────────

function CourseSection({ course, onAddModule }) {
  const [modules, setModules] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getCourseModules(course.id)
      .then((m) => {
        setModules(m);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [course.id]);

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
      <header className="flex flex-col gap-3 border-b border-[var(--border-color)] p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="shrink-0 overflow-hidden rounded-xl">
            <CourseThumbnail course={course} size="sm" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {course.title}
              </h2>
            {course.is_published && (
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono-ui"
                style={{
                  color: "#10B981",
                  backgroundColor: "rgba(16,185,129,0.12)",
                }}
              >
                Published
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {course.description}
          </p>
          <p className="mt-2 inline-flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono-ui">
            <Users className="h-3.5 w-3.5" />
            {course.students_count} enrolled
          </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAddModule}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#059669] sm:self-auto"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add Module
        </button>
      </header>

      <div className="flex flex-col">
        {!loaded ? (
          <div className="p-5">
            <div className="skeleton-shimmer h-12 w-full rounded-xl" />
          </div>
        ) : modules.length === 0 ? (
          <p className="p-5 text-sm text-[var(--text-secondary)]">
            No modules yet. Add one to get started.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border-color)]">
            {modules.map((m, i) => (
              <ModuleRow
                key={m.id}
                module={m}
                courseTitle={course.title}
                index={i}
              />
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

// ── Module accordion row ────────────────────────────────────────────────

function ModuleRow({ module, courseTitle, index }) {
  const [open, setOpen] = useState(false);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[var(--bg-secondary)]"
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="grid h-6 w-6 shrink-0 place-items-center text-[var(--text-secondary)]"
        >
          <ChevronDown className="h-4 w-4 -rotate-90" />
        </motion.span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[var(--text-primary)]">
            {index + 1}. {module.title}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Pill icon={Layers}>{module.lessons_count} lessons</Pill>
          {module.quiz_id && <Pill tone="teal">Quiz</Pill>}
          {module.assignment_id && <Pill tone="amber">Assignment</Pill>}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <ModuleBody module={module} courseTitle={courseTitle} />
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function Pill({ children, tone, icon: Icon }) {
  const styles =
    tone === "teal"
      ? { color: "#10B981", bg: "rgba(16,185,129,0.12)" }
      : tone === "amber"
      ? { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" }
      : { color: "var(--text-secondary)", bg: "var(--bg-secondary)" };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono-ui"
      style={{ color: styles.color, backgroundColor: styles.bg }}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

// ── Module body (lessons + quiz + assignment) ───────────────────────────

function ModuleBody({ module, courseTitle }) {
  const [lessons, setLessons] = useState([]);
  const [loadedLessons, setLoadedLessons] = useState(false);
  const [addLesson, setAddLesson] = useState(false);
  const [addQuiz, setAddQuiz] = useState(false);
  const [addAssignment, setAddAssignment] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(!!module.quiz_id);
  const [hasAssignment, setHasAssignment] = useState(!!module.assignment_id);

  useEffect(() => {
    setLoadedLessons(false);
    apiClient
      .get(`/modules/${module.id}/lessons`)
      .then((res) => {
        setLessons(res.data);
        setLoadedLessons(true);
      })
      .catch(() => setLoadedLessons(true));
  }, [module.id]);

  function handleLessonCreated(lesson) {
    setLessons((list) => [...list, lesson]);
  }

  return (
    <div className="grid gap-5 bg-[var(--bg-secondary)] px-5 py-5 lg:grid-cols-3">
      {/* Lessons */}
      <section className="lg:col-span-2">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
          Lessons
        </h4>
        {!loadedLessons ? (
          <div className="skeleton-shimmer h-12 w-full rounded-lg" />
        ) : lessons.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No lessons yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lessons.map((l) => (
              <LessonRow key={l.id} lesson={l} />
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => setAddLesson(true)}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-[#10B981]/40 bg-[#10B981]/5 px-3 py-2 text-xs font-semibold text-[#10B981] transition-colors hover:bg-[#10B981]/10"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Add Lesson
        </button>
      </section>

      {/* Quiz + Assignment */}
      <section className="flex flex-col gap-4">
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
            Quiz
          </h4>
          {hasQuiz ? (
            <div className="flex flex-col gap-2 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 p-3">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#10B981] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white font-mono-ui">
                <Sparkles className="h-3 w-3" />
                Quiz attached
              </span>
              <button
                type="button"
                onClick={() => toast.info("Quiz contains 3 questions")}
                className="self-start text-xs font-semibold text-[#10B981] underline font-mono-ui"
              >
                View Quiz →
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddQuiz(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#10B981]/40 bg-[#10B981]/5 px-3 py-2 text-xs font-semibold text-[#10B981] transition-colors hover:bg-[#10B981]/10"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Add Quiz
            </button>
          )}
        </div>

        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono-ui">
            Assignment
          </h4>
          {hasAssignment ? (
            <div className="flex flex-col gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
              <p className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <ClipboardList className="h-3.5 w-3.5 text-[#F59E0B]" />
                Assigned in {courseTitle}
              </p>
              <button
                type="button"
                onClick={() => toast.info("Submissions visible on Assignments page")}
                className="self-start rounded-lg border border-[var(--border-color)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
              >
                Review Submissions
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddAssignment(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#10B981]/40 bg-[#10B981]/5 px-3 py-2 text-xs font-semibold text-[#10B981] transition-colors hover:bg-[#10B981]/10"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Add Assignment
            </button>
          )}
        </div>
      </section>

      <AddLessonModal
        isOpen={addLesson}
        moduleId={module.id}
        onClose={() => setAddLesson(false)}
        onCreated={handleLessonCreated}
      />
      <AddQuizModal
        isOpen={addQuiz}
        moduleId={module.id}
        onClose={() => setAddQuiz(false)}
        onCreated={() => setHasQuiz(true)}
      />
      <AddAssignmentModal
        isOpen={addAssignment}
        moduleId={module.id}
        onClose={() => setAddAssignment(false)}
        onCreated={() => setHasAssignment(true)}
      />
    </div>
  );
}

function LessonRow({ lesson }) {
  const Icon = CONTENT_ICON[lesson.content_type] ?? FileText;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#10B981]/10 text-[#10B981]">
        <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      </span>
      <span className="flex-1 truncate text-sm text-[var(--text-primary)]">
        {lesson.title}
      </span>
      <button
        type="button"
        onClick={() => toast.info("Edit lesson — coming soon")}
        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => toast.info("Delete lesson — coming soon")}
        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10"
      >
        Delete
      </button>
    </li>
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
