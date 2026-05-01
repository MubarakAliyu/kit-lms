import { apiClient } from "./client";

/** Returns the lessons in a module. */
export async function getModuleLessons(moduleId) {
  const { data } = await apiClient.get(`/modules/${moduleId}/lessons`);
  return data;
}

/**
 * Returns a single lesson with joined breadcrumb fields
 * (module_title, course_id, course_title).
 */
export async function getLesson(lessonId) {
  const { data } = await apiClient.get(`/lessons/${lessonId}`);
  return data;
}

/** Marks a lesson complete. Stub backend, returns { success: true }. */
export async function markLessonComplete(lessonId) {
  const { data } = await apiClient.post(`/lessons/${lessonId}/complete`);
  return data;
}
