import { apiClient } from "./client";

/** Returns all courses the current user can see. */
export async function getCourses() {
  const { data } = await apiClient.get("/courses");
  return data;
}

/** Returns a single course (filtered from the listing). */
export async function getCourse(id) {
  const courses = await getCourses();
  return courses.find((c) => c.id === id) ?? null;
}

/** Returns the modules belonging to a course. */
export async function getCourseModules(courseId) {
  const { data } = await apiClient.get(`/courses/${courseId}/modules`);
  return data;
}
