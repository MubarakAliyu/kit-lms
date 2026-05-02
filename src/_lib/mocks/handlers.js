import { http, HttpResponse } from "msw";

// DEV-ONLY mock data. Swap for the real backend in a later batch.

// Default password assigned to admin-created users. They are forced to change
// it on first login. Stored module-side so both the admin POST handler and
// the login handler agree on the magic value.
const DEFAULT_NEW_USER_PASSWORD = "default1234";

// Emails of users who must reset their password before reaching their
// dashboard. Mutated by POST /admin/users (admin creates account) and
// drained by POST /user/change-password once the new password is set.
const FORCE_RESET_EMAILS = new Set();

// Pending enrollment requests created when a parent adds a child but the
// admin hasn't yet provisioned a login. Drained when admin creates the
// user account from the dashboard.
const PENDING_ENROLLMENTS = [
  {
    id: "pe1",
    parent_id: "p1",
    parent_name: "Mrs. Fatima Hassan",
    parent_email: "parent@kidsintech.school",
    child_name: "New Child Demo",
    age: 10,
    programme_track: "Web Development",
    status: "pending_enrollment",
    requested_at: "2025-04-28T10:00:00Z",
  },
];

// Live stream of admin-targeted notifications, accumulated as students,
// parents, and other dashboards emit events via POST /admin/notifications/send.
const DYNAMIC_ADMIN_NOTIFICATIONS = [];

// Live parent notifications added when admin provisions a child account.
const DYNAMIC_PARENT_NOTIFICATIONS = [];

const MOCK_CREDENTIALS = [
  { id: "u1", email: "admin@kidsintech.school", password: "KIT@admin2025", role: "admin", name: "Admin User" },
  { id: "u2", email: "instructor@kidsintech.school", password: "KIT@teach2025", role: "instructor", name: "Ms. Sarah Aliyu" },
  { id: "u5", email: "student@kidsintech.school", password: "KIT@learn2025", role: "student", name: "Liam Hassan" },
  { id: "u4", email: "parent@kidsintech.school", password: "KIT@parent2025", role: "parent", name: "Mrs. Fatima Hassan" },
];

// Users created at runtime by the admin (POST /admin/users). Lives next to
// FORCE_RESET_EMAILS so we can resolve `must_reset_password` logins for
// emails that aren't in MOCK_CREDENTIALS.
const ADMIN_CREATED_USERS = [];

const STUDENT_ME = {
  id: "s1",
  parent_id: "p1",
  name: "Liam Hassan",
  age: 12,
  programme_track: "Web Development",
};

const COURSES = [
  {
    id: "c1",
    title: "Scratch Programming",
    description: "Learn visual programming with Scratch",
    price: 15000,
    payment_type: "subscription",
    instructor_id: "i1",
    progress: 65,
    module_count: 5,
    instructor_name: "Ms. Sarah",
  },
  {
    id: "c2",
    title: "Web Development",
    description: "Build websites with HTML CSS JS",
    price: 20000,
    payment_type: "one_time",
    instructor_id: "i1",
    progress: 30,
    module_count: 8,
    instructor_name: "Ms. Sarah",
  },
  {
    id: "c3",
    title: "Robotics Basics",
    description: "Introduction to robotics and hardware",
    price: 25000,
    payment_type: "subscription",
    instructor_id: "i2",
    progress: 0,
    module_count: 6,
    instructor_name: "Mr. Ahmed",
  },
];

const MODULES = [
  { id: "m1", course_id: "c1", title: "Getting Started", order_index: 1 },
  { id: "m2", course_id: "c1", title: "Basic Blocks", order_index: 2 },
  { id: "m3", course_id: "c1", title: "Animations", order_index: 3 },
];

const LESSONS = [
  {
    id: "l1",
    module_id: "m1",
    title: "What is Scratch?",
    content_type: "video",
    youtube_url: "https://www.youtube.com/watch?v=jXUZaf5D12A",
    body_content: "Introduction to Scratch programming environment.",
    order_index: 1,
  },
  {
    id: "l2",
    module_id: "m1",
    title: "Your First Project",
    content_type: "video",
    youtube_url: "https://www.youtube.com/watch?v=jXUZaf5D12A",
    body_content: "Build your very first Scratch project step by step.",
    order_index: 2,
  },
];

const ASSIGNMENTS = [
  {
    id: "a1",
    module_id: "m1",
    title: "Build a Simple Animation",
    instructions: "Create a Scratch animation with at least 3 sprites and 2 sounds.",
    deadline: "2025-05-10",
    status: "pending",
  },
  {
    id: "a2",
    module_id: "m2",
    title: "Interactive Story",
    instructions: "Build an interactive story with branching paths.",
    deadline: "2025-05-15",
    status: "submitted",
  },
  {
    id: "a3",
    module_id: "m3",
    title: "Quiz Game",
    instructions: "Create a quiz game in Scratch.",
    deadline: "2025-04-28",
    status: "reviewed",
    feedback: "Great work! Well structured.",
    grade: "A",
  },
];

const QUIZ_QUESTIONS = [
  {
    id: "qu1",
    quiz_id: "q1",
    question_text: "What is a sprite in Scratch?",
    question_type: "mcq",
    options: ["A character or object", "A sound file", "A background", "A script"],
    correct_answer: "A character or object",
  },
  {
    id: "qu2",
    quiz_id: "q1",
    question_text: "What does a loop block do?",
    question_type: "mcq",
    options: ["Plays a sound", "Repeats actions", "Changes color", "Moves sprite"],
    correct_answer: "Repeats actions",
  },
  {
    id: "qu3",
    quiz_id: "q1",
    question_text: "Which block starts a Scratch program?",
    question_type: "mcq",
    options: ["When space pressed", "When flag clicked", "Forever", "Repeat 10"],
    correct_answer: "When flag clicked",
  },
];

const NOTIFICATIONS = [
  {
    id: "n1",
    user_id: "s1",
    type: "lesson_published",
    title: "New Lesson Available",
    message: "Your First Project has been published in Scratch Programming",
    is_read: false,
    created_at: "2025-04-27T10:00:00Z",
    link: "/student/lessons/l2",
  },
  {
    id: "n2",
    user_id: "s1",
    type: "assignment_feedback",
    title: "Assignment Reviewed",
    message: "Your Quiz Game assignment received feedback — Grade: A",
    is_read: false,
    created_at: "2025-04-26T14:00:00Z",
    link: "/student/assignments",
  },
  {
    id: "n3",
    user_id: "s1",
    type: "course_complete",
    title: "🎉 Course Completed!",
    message:
      "You have completed Scratch Programming. Your certificate is ready!",
    is_read: false,
    created_at: "2025-04-25T09:00:00Z",
    link: "/student/certificates",
  },
  {
    id: "n4",
    user_id: "s1",
    type: "quiz_result",
    title: "Quiz Results Ready",
    message: "You scored 67% on the Scratch Basics quiz",
    is_read: true,
    created_at: "2025-04-24T11:00:00Z",
    link: "/student/courses",
  },
  {
    id: "n5",
    user_id: "s1",
    type: "new_course",
    title: "New Course Available",
    message: "AI Fundamentals is now available for enrollment",
    is_read: true,
    created_at: "2025-04-23T08:00:00Z",
    link: "/student/courses",
  },
  {
    id: "n6",
    user_id: "s1",
    type: "progress_milestone",
    title: "Milestone Reached! 🏆",
    message: "You have completed 50% of Web Development",
    is_read: true,
    created_at: "2025-04-22T15:00:00Z",
    link: "/student/courses/c2",
  },
];

const CONVERSATIONS = [
  {
    id: "conv1",
    participant_id: "i1",
    participant_name: "Ms. Sarah",
    participant_role: "instructor",
    participant_initial: "S",
    last_message: "Great work on your last assignment!",
    last_message_time: "2025-04-27T10:00:00Z",
    unread_count: 1,
  },
  {
    id: "conv2",
    participant_id: "i2",
    participant_name: "Mr. Ahmed",
    participant_role: "instructor",
    participant_initial: "A",
    last_message: "See you in the next session",
    last_message_time: "2025-04-26T14:00:00Z",
    unread_count: 0,
  },
];

const CONV_MESSAGES = [
  {
    id: "m1",
    sender_id: "i1",
    receiver_id: "s1",
    message: "Hi Liam! How are you finding the Scratch course so far?",
    file_url: null,
    created_at: "2025-04-27T09:00:00Z",
  },
  {
    id: "m2",
    sender_id: "s1",
    receiver_id: "i1",
    message:
      "Hi Ms. Sarah! I am really enjoying it, especially the animations module.",
    file_url: null,
    created_at: "2025-04-27T09:05:00Z",
  },
  {
    id: "m3",
    sender_id: "i1",
    receiver_id: "s1",
    message:
      "Great work on your last assignment! Your sprite design was very creative.",
    file_url: null,
    created_at: "2025-04-27T10:00:00Z",
  },
];

// ── Parent data ────────────────────────────────────────────────────────────
// `Parent` derives from User (role === 'parent'); the demo backend exposes
// the joined view at /parents/me so the UI doesn't have to reassemble it.
const PARENT_ME = {
  id: "p1",
  user_id: "u4",
  name: "Mrs. Fatima Hassan",
  email: "parent@kidsintech.school",
  phone: "+234 801 234 5678",
};

const PARENT_CHILDREN = [
  {
    id: "s1",
    parent_id: "p1",
    name: "Liam Hassan",
    age: 12,
    programme_track: "Web Development",
    avatar_initial: "L",
    enrolled_courses: 3,
    completed_courses: 1,
  },
  {
    id: "s2",
    parent_id: "p1",
    name: "Aisha Hassan",
    age: 9,
    programme_track: "Scratch Programming",
    avatar_initial: "A",
    enrolled_courses: 1,
    completed_courses: 0,
  },
];

const STUDENT_PROGRESS = {
  s1: [
    {
      course_id: "c1",
      course_title: "Scratch Programming",
      instructor_name: "Ms. Sarah",
      progress: 100,
      modules_completed: 5,
      modules_total: 5,
      last_active: "2025-04-27T10:00:00Z",
    },
    {
      course_id: "c2",
      course_title: "Web Development",
      instructor_name: "Ms. Sarah",
      progress: 30,
      modules_completed: 3,
      modules_total: 8,
      last_active: "2025-04-26T14:00:00Z",
    },
    {
      course_id: "c3",
      course_title: "Robotics Basics",
      instructor_name: "Mr. Ahmed",
      progress: 0,
      modules_completed: 0,
      modules_total: 6,
      last_active: null,
    },
  ],
  s2: [
    {
      course_id: "c1",
      course_title: "Scratch Programming",
      instructor_name: "Ms. Sarah",
      progress: 45,
      modules_completed: 2,
      modules_total: 5,
      last_active: "2025-04-25T09:00:00Z",
    },
  ],
};

const PAYMENTS = [
  {
    id: "pay1",
    parent_id: "p1",
    student_id: "s1",
    amount: 15000,
    type: "subscription",
    status: "paid",
    paystack_ref: "PSK_123456",
    course_title: "Scratch Programming",
    student_name: "Liam Hassan",
    created_at: "2025-04-01T00:00:00Z",
  },
  {
    id: "pay2",
    parent_id: "p1",
    student_id: "s1",
    amount: 20000,
    type: "one_time",
    status: "paid",
    paystack_ref: "PSK_234567",
    course_title: "Web Development",
    student_name: "Liam Hassan",
    created_at: "2025-03-15T00:00:00Z",
  },
  {
    id: "pay3",
    parent_id: "p1",
    student_id: "s2",
    amount: 15000,
    type: "subscription",
    status: "paid",
    paystack_ref: "PSK_345678",
    course_title: "Scratch Programming",
    student_name: "Aisha Hassan",
    created_at: "2025-03-01T00:00:00Z",
  },
  {
    id: "pay4",
    parent_id: "p1",
    student_id: "s1",
    amount: 25000,
    type: "subscription",
    status: "pending",
    paystack_ref: "PSK_456789",
    course_title: "Robotics Basics",
    student_name: "Liam Hassan",
    created_at: "2025-04-20T00:00:00Z",
  },
];

const PARENT_NOTIFICATIONS = [
  {
    id: "pn1",
    user_id: "p1",
    type: "progress_milestone",
    title: "Liam reached a milestone! 🏆",
    message: "Liam Hassan completed 50% of Web Development",
    is_read: false,
    created_at: "2025-04-27T10:00:00Z",
    link: "/parent",
  },
  {
    id: "pn2",
    user_id: "p1",
    type: "course_complete",
    title: "Course Completed! 🎉",
    message: "Liam Hassan completed Scratch Programming",
    is_read: false,
    created_at: "2025-04-25T09:00:00Z",
    link: "/parent/children",
  },
  {
    id: "pn3",
    user_id: "p1",
    type: "payment_success",
    title: "Payment Confirmed",
    message: "₦15,000 for Scratch Programming received",
    is_read: true,
    created_at: "2025-04-01T00:00:00Z",
    link: "/parent/payments",
  },
  {
    id: "pn4",
    user_id: "p1",
    type: "assignment_feedback",
    title: "Assignment Reviewed",
    message: "Aisha's assignment has been reviewed",
    is_read: true,
    created_at: "2025-03-28T00:00:00Z",
    link: "/parent/children",
  },
];

// ── Instructor data ────────────────────────────────────────────────────────
// `Instructor` derives from User (role === 'instructor'); the demo backend
// exposes the joined view at /instructors/me so the UI doesn't reassemble it.
const INSTRUCTOR_ME = {
  id: "i1",
  user_id: "u2",
  name: "Ms. Sarah Aliyu",
  email: "instructor@kidsintech.school",
  bio: "Experienced tech educator specializing in Scratch and Web Development.",
  avatar_initial: "S",
  courses_count: 2,
  students_count: 3,
  joined: "2024-01-15",
};

const INSTRUCTOR_COURSES = [
  {
    id: "c1",
    title: "Scratch Programming",
    description: "Learn visual programming with Scratch",
    price: 15000,
    payment_type: "subscription",
    instructor_id: "i1",
    instructor_name: "Ms. Sarah",
    students_count: 2,
    modules_count: 3,
    completion_rate: 72,
    is_published: true,
    thumbnail_url: null,
  },
  {
    id: "c2",
    title: "Web Development",
    description: "Build websites with HTML CSS JS",
    price: 20000,
    payment_type: "one_time",
    instructor_id: "i1",
    instructor_name: "Ms. Sarah",
    students_count: 1,
    modules_count: 4,
    completion_rate: 30,
    is_published: true,
    thumbnail_url: null,
  },
];

const INSTRUCTOR_STUDENTS = [
  {
    id: "s1",
    parent_id: "p1",
    name: "Liam Hassan",
    age: 12,
    programme_track: "Web Development",
    avatar_initial: "L",
    enrolled_courses: ["c1", "c2"],
    quiz_average: 78,
    last_active: "2025-04-27T10:00:00Z",
    assignments_pending: 1,
    assignments_completed: 2,
  },
  {
    id: "s2",
    parent_id: "p1",
    name: "Aisha Hassan",
    age: 9,
    programme_track: "Scratch Programming",
    avatar_initial: "A",
    enrolled_courses: ["c1"],
    quiz_average: 65,
    last_active: "2025-04-25T09:00:00Z",
    assignments_pending: 2,
    assignments_completed: 0,
  },
  {
    id: "s3",
    parent_id: "p2",
    name: "Emeka Obi",
    age: 11,
    programme_track: "Scratch Programming",
    avatar_initial: "E",
    enrolled_courses: ["c1"],
    quiz_average: 90,
    last_active: "2025-04-26T11:00:00Z",
    assignments_pending: 0,
    assignments_completed: 3,
  },
];

// Per-course modules for instructor course-management view. Lessons/quiz/
// assignment ids are joined so the accordion rows can render without
// extra round trips.
const INSTRUCTOR_COURSE_MODULES = {
  c1: [
    { id: "m1", course_id: "c1", title: "Getting Started", order_index: 1, lessons_count: 2, quiz_id: "q1", assignment_id: "a1" },
    { id: "m2", course_id: "c1", title: "Basic Blocks", order_index: 2, lessons_count: 2, quiz_id: "q2", assignment_id: "a2" },
    { id: "m3", course_id: "c1", title: "Animations", order_index: 3, lessons_count: 1, quiz_id: null, assignment_id: "a3" },
  ],
  c2: [
    { id: "m4", course_id: "c2", title: "HTML Basics", order_index: 1, lessons_count: 3, quiz_id: "q3", assignment_id: "a4" },
    { id: "m5", course_id: "c2", title: "CSS Styling", order_index: 2, lessons_count: 2, quiz_id: null, assignment_id: "a5" },
  ],
};

const INSTRUCTOR_MODULE_LESSONS = {
  m1: [
    { id: "l1", module_id: "m1", title: "What is Scratch?", content_type: "video", youtube_url: "https://www.youtube.com/watch?v=jXUZaf5D12A", body_content: "Introduction to Scratch programming.", order_index: 1 },
    { id: "l2", module_id: "m1", title: "Your First Project", content_type: "video", youtube_url: "https://www.youtube.com/watch?v=jXUZaf5D12A", body_content: "Build your first Scratch project.", order_index: 2 },
  ],
};

const INSTRUCTOR_ASSIGNMENTS = [
  {
    id: "a1",
    module_id: "m1",
    title: "Build a Simple Animation",
    instructions: "Create a Scratch animation with 3 sprites.",
    deadline: "2025-05-10",
    course_id: "c1",
    course_title: "Scratch Programming",
    submissions: [
      {
        id: "sub1",
        student_id: "s1",
        student_name: "Liam Hassan",
        submission_type: "text",
        content: "I built a cat and dog animation...",
        submitted_at: "2025-04-28T09:00:00Z",
        status: "submitted",
        feedback: null,
        grade: null,
      },
      {
        id: "sub2",
        student_id: "s2",
        student_name: "Aisha Hassan",
        submission_type: "link",
        content: "https://scratch.mit.edu/projects/123",
        submitted_at: "2025-04-27T14:00:00Z",
        status: "reviewed",
        feedback: "Great work! Creative use of sprites.",
        grade: "A",
      },
    ],
  },
  {
    id: "a2",
    module_id: "m2",
    title: "Interactive Story",
    instructions: "Build a branching story in Scratch.",
    deadline: "2025-05-15",
    course_id: "c1",
    course_title: "Scratch Programming",
    submissions: [],
  },
  {
    id: "a3",
    module_id: "m3",
    title: "Animation Project",
    instructions: "Create a full animation sequence.",
    deadline: "2025-04-28",
    course_id: "c1",
    course_title: "Scratch Programming",
    submissions: [
      {
        id: "sub3",
        student_id: "s3",
        student_name: "Emeka Obi",
        submission_type: "text",
        content: "Created a full animation with music...",
        submitted_at: "2025-04-27T16:00:00Z",
        status: "submitted",
        feedback: null,
        grade: null,
      },
    ],
  },
];

const INSTRUCTOR_NOTIFICATIONS = [
  {
    id: "in1",
    user_id: "i1",
    type: "assignment_submitted",
    title: "New Submission",
    message: "Liam Hassan submitted Build a Simple Animation",
    is_read: false,
    created_at: "2025-04-28T09:00:00Z",
    link: "/instructor/assignments",
  },
  {
    id: "in2",
    user_id: "i1",
    type: "quiz_completed",
    title: "Quiz Completed",
    message: "Emeka Obi scored 90% on Getting Started quiz",
    is_read: false,
    created_at: "2025-04-27T11:00:00Z",
    link: "/instructor/students",
  },
  {
    id: "in3",
    user_id: "i1",
    type: "student_enrolled",
    title: "New Student",
    message: "A new student enrolled in Scratch Programming",
    is_read: true,
    created_at: "2025-04-25T08:00:00Z",
    link: "/instructor/courses",
  },
];

const INSTRUCTOR_CONVERSATIONS = [
  {
    id: "conv_i1_s1",
    participant_id: "s1",
    participant_name: "Liam Hassan",
    participant_role: "student",
    participant_initial: "L",
    last_message: "I am really enjoying the course!",
    last_message_time: "2025-04-27T09:05:00Z",
    unread_count: 0,
  },
  {
    id: "conv_i1_s2",
    participant_id: "s2",
    participant_name: "Aisha Hassan",
    participant_role: "student",
    participant_initial: "A",
    last_message: "When is the next assignment due?",
    last_message_time: "2025-04-26T13:00:00Z",
    unread_count: 1,
  },
  {
    id: "conv_i1_s3",
    participant_id: "s3",
    participant_name: "Emeka Obi",
    participant_role: "student",
    participant_initial: "E",
    last_message: "Thank you for the feedback!",
    last_message_time: "2025-04-25T10:00:00Z",
    unread_count: 0,
  },
];

const INSTRUCTOR_MESSAGES = {
  conv_i1_s1: [
    { id: "mi-s1-1", sender_id: "s1", receiver_id: "i1", message: "Hi Ms. Sarah! I am really enjoying the course!", file_url: null, created_at: "2025-04-27T09:05:00Z" },
  ],
  conv_i1_s2: [
    { id: "mi1", sender_id: "s2", receiver_id: "i1", message: "Hi Ms. Sarah! When is the next assignment due?", file_url: null, created_at: "2025-04-26T13:00:00Z" },
    { id: "mi2", sender_id: "i1", receiver_id: "s2", message: "Hi Aisha! The next assignment is due May 15th. Let me know if you have questions!", file_url: null, created_at: "2025-04-26T13:05:00Z" },
  ],
  conv_i1_s3: [
    { id: "mi-s3-1", sender_id: "s3", receiver_id: "i1", message: "Thank you for the feedback!", file_url: null, created_at: "2025-04-25T10:00:00Z" },
  ],
};

const CERTIFICATES = [
  {
    id: "cert1",
    student_id: "s1",
    course_id: "c1",
    course_title: "Scratch Programming",
    student_name: "Liam Hassan",
    completion_date: "2025-04-20",
    score_average: 85,
    is_unlocked: true,
    issued_by: "Starnova Labs",
    instructor_name: "Ms. Sarah",
  },
  {
    id: "cert2",
    student_id: "s1",
    course_id: "c2",
    course_title: "Web Development",
    student_name: "Liam Hassan",
    completion_date: null,
    score_average: null,
    is_unlocked: false,
    modules_progress: { completed: 3, total: 8 },
    quizzes_progress: { completed: 2, total: 5 },
    assignments_progress: { completed: 2, total: 6 },
  },
  {
    id: "cert3",
    student_id: "s1",
    course_id: "c3",
    course_title: "Robotics Basics",
    student_name: "Liam Hassan",
    completion_date: null,
    score_average: null,
    is_unlocked: false,
    modules_progress: { completed: 0, total: 6 },
    quizzes_progress: { completed: 0, total: 4 },
    assignments_progress: { completed: 0, total: 5 },
  },
];

// ── Admin catalog ──────────────────────────────────────────────────────────
const ADMIN_STATS = {
  total_students: 3,
  total_instructors: 2,
  total_courses: 3,
  total_revenue: 95000,
  active_subscriptions: 3,
  students_change: 12,
  revenue_change: 8,
  courses_change: 1,
  instructors_change: 0,
};

// Mutable so the dashboard reflects deactivations + new accounts during the
// session. Mirrors User schema, with optional age for students.
const ADMIN_USERS = [
  { id: "u1", role: "admin", name: "Admin User", email: "admin@kidsintech.school", status: "active", language_preference: "en", created_at: "2024-01-01T00:00:00Z" },
  { id: "u2", role: "instructor", name: "Ms. Sarah Aliyu", email: "instructor@kidsintech.school", status: "active", language_preference: "en", created_at: "2024-01-15T00:00:00Z" },
  { id: "u3", role: "instructor", name: "Mr. Ahmed Bello", email: "ahmed@kidsintech.school", status: "active", language_preference: "en", created_at: "2024-02-01T00:00:00Z" },
  { id: "u4", role: "parent", name: "Mrs. Fatima Hassan", email: "parent@kidsintech.school", status: "active", language_preference: "en", created_at: "2024-02-15T00:00:00Z" },
  { id: "u5", role: "student", name: "Liam Hassan", age: 12, email: "student@kidsintech.school", status: "active", language_preference: "en", created_at: "2024-02-15T00:00:00Z" },
  { id: "u6", role: "student", name: "Aisha Hassan", age: 9, email: "aisha@kidsintech.school", status: "active", language_preference: "en", created_at: "2024-03-01T00:00:00Z" },
  { id: "u7", role: "student", name: "Emeka Obi", age: 11, email: "emeka@kidsintech.school", status: "inactive", language_preference: "en", created_at: "2024-03-15T00:00:00Z" },
];

const ADMIN_COURSES = [
  { id: "c1", title: "Scratch Programming", description: "Visual programming for beginners", price: 15000, payment_type: "subscription", instructor_id: "i1", instructor_name: "Ms. Sarah Aliyu", students_count: 2, modules_count: 3, is_published: true, completion_rate: 72, revenue: 45000, thumbnail_url: null, created_at: "2024-01-20T00:00:00Z" },
  { id: "c2", title: "Web Development", description: "HTML CSS JavaScript basics", price: 20000, payment_type: "one_time", instructor_id: "i1", instructor_name: "Ms. Sarah Aliyu", students_count: 1, modules_count: 4, is_published: true, completion_rate: 30, revenue: 20000, thumbnail_url: null, created_at: "2024-02-10T00:00:00Z" },
  { id: "c3", title: "Robotics Basics", description: "Introduction to robotics", price: 25000, payment_type: "subscription", instructor_id: "u3", instructor_name: "Mr. Ahmed Bello", students_count: 0, modules_count: 6, is_published: false, completion_rate: 0, revenue: 0, thumbnail_url: null, created_at: "2024-03-01T00:00:00Z" },
];

const ADMIN_ANALYTICS = {
  enrollment_trend: [
    { month: "Nov", students: 0 },
    { month: "Dec", students: 1 },
    { month: "Jan", students: 2 },
    { month: "Feb", students: 3 },
    { month: "Mar", students: 3 },
    { month: "Apr", students: 3 },
  ],
  revenue_monthly: [
    { month: "Jan", subscription: 15000, one_time: 0 },
    { month: "Feb", subscription: 30000, one_time: 20000 },
    { month: "Mar", subscription: 45000, one_time: 20000 },
    { month: "Apr", subscription: 45000, one_time: 20000 },
  ],
  course_completion: [
    { course: "Scratch", rate: 72 },
    { course: "Web Dev", rate: 30 },
    { course: "Robotics", rate: 0 },
  ],
  quiz_performance: [
    { month: "Feb", average: 70 },
    { month: "Mar", average: 74 },
    { month: "Apr", average: 78 },
  ],
  payment_split: [
    { name: "Subscription", value: 45000, fill: "#10B981" },
    { name: "One-time", value: 20000, fill: "#1a2234" },
  ],
};

// Cross-parent payment history for admin. Reuses the per-parent shape so the
// existing ReceiptModal works unchanged.
const ADMIN_PAYMENTS = [
  { id: "pay1", parent_id: "p1", parent_name: "Mrs. Fatima Hassan", student_id: "s1", student_name: "Liam Hassan", amount: 15000, type: "subscription", status: "paid", paystack_ref: "PSK_123456", course_title: "Scratch Programming", created_at: "2025-04-01T00:00:00Z" },
  { id: "pay2", parent_id: "p1", parent_name: "Mrs. Fatima Hassan", student_id: "s1", student_name: "Liam Hassan", amount: 20000, type: "one_time", status: "paid", paystack_ref: "PSK_234567", course_title: "Web Development", created_at: "2025-03-15T00:00:00Z" },
  { id: "pay3", parent_id: "p1", parent_name: "Mrs. Fatima Hassan", student_id: "s2", student_name: "Aisha Hassan", amount: 15000, type: "subscription", status: "paid", paystack_ref: "PSK_345678", course_title: "Scratch Programming", created_at: "2025-03-01T00:00:00Z" },
  { id: "pay4", parent_id: "p1", parent_name: "Mrs. Fatima Hassan", student_id: "s1", student_name: "Liam Hassan", amount: 25000, type: "subscription", status: "pending", paystack_ref: "PSK_456789", course_title: "Robotics Basics", created_at: "2025-04-20T00:00:00Z" },
];

const ADMIN_ACTIVITY_LOG = [
  { id: "log1", user_name: "Admin User", user_role: "admin", action: "created_user", description: "Created instructor account for Ms. Sarah Aliyu", ip: "192.168.1.1", timestamp: "2025-04-27T10:00:00Z" },
  { id: "log2", user_name: "Admin User", user_role: "admin", action: "deactivated_user", description: "Deactivated student account: Emeka Obi", ip: "192.168.1.1", timestamp: "2025-04-26T14:00:00Z" },
  { id: "log3", user_name: "Admin User", user_role: "admin", action: "published_course", description: "Published course: Web Development", ip: "192.168.1.1", timestamp: "2025-04-25T09:00:00Z" },
  { id: "log4", user_name: "Admin User", user_role: "admin", action: "sent_announcement", description: "Sent announcement to all 7 users", ip: "192.168.1.1", timestamp: "2025-04-24T11:00:00Z" },
  { id: "log5", user_name: "Admin User", user_role: "admin", action: "updated_permissions", description: "Updated role permissions for admin account", ip: "192.168.1.1", timestamp: "2025-04-23T08:00:00Z" },
];

const ADMIN_NOTIFICATIONS_SEED = [
  {
    id: "an1",
    user_id: "admin1",
    type: "new_enrollment",
    title: "New Student Enrolled",
    message: "Liam Hassan enrolled in Scratch Programming",
    is_read: false,
    created_at: "2025-04-27T10:00:00Z",
    link: "/admin/users",
  },
  {
    id: "an2",
    user_id: "admin1",
    type: "payment_received",
    title: "Payment Received",
    message: "₦15,000 payment confirmed from Mrs. Fatima Hassan",
    is_read: false,
    created_at: "2025-04-26T14:00:00Z",
    link: "/admin/payments",
  },
  {
    id: "an3",
    user_id: "admin1",
    type: "course_created",
    title: "Course Published",
    message: "Robotics Basics is now live",
    is_read: true,
    created_at: "2025-04-25T09:00:00Z",
    link: "/admin/courses",
  },
];

export const handlers = [
  // ── Auth ────────────────────────────────────────────────────────────────
  http.post("*/login", async ({ request }) => {
    const { email, password } = await request.json();

    // First-login flow for admin-created accounts. Anyone in the force-reset
    // set who supplies the default password gets a temp_token instead of a
    // real session. NextAuth's authorize() surfaces the flag through the JWT
    // callback so DashboardLayout's ForceResetGuard redirects them.
    if (
      FORCE_RESET_EMAILS.has(email) &&
      password === DEFAULT_NEW_USER_PASSWORD
    ) {
      const created =
        ADMIN_CREATED_USERS.find((u) => u.email === email) ??
        ADMIN_USERS.find((u) => u.email === email);
      if (created) {
        return HttpResponse.json(
          {
            must_reset_password: true,
            temp_token: `temp_${email}`,
            user: {
              id: created.id,
              email: created.email,
              role: created.role,
              name: created.name,
              language_preference: "en",
            },
          },
          { status: 200 }
        );
      }
    }

    // Normal credential check.
    const match = MOCK_CREDENTIALS.find(
      (c) => c.email === email && c.password === password
    );
    if (match) {
      return HttpResponse.json(
        {
          user: {
            id: match.id,
            email: match.email,
            role: match.role,
            name: match.name,
            language_preference: "en",
            must_reset_password: false,
          },
          token: `mock-jwt-${match.role}`,
        },
        { status: 200 }
      );
    }

    return HttpResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }),

  http.post("*/forgot-password", async () => HttpResponse.json({ ok: true })),

  http.post("*/reset-password", async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    if (!body?.token) {
      return HttpResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }
    return HttpResponse.json({ ok: true });
  }),

  // ── Student profile ─────────────────────────────────────────────────────
  http.get("*/students/me", () => HttpResponse.json(STUDENT_ME)),

  // Parent adds a child. Returns the persisted student-shaped record AND
  // creates a pending enrollment row so the admin can provision a login
  // account for the child.
  http.post("*/students", async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const id = `s-${Date.now()}`;
    PENDING_ENROLLMENTS.unshift({
      id: `pe-${Date.now()}`,
      parent_id: "p1",
      parent_name: "Mrs. Fatima Hassan",
      parent_email: "parent@kidsintech.school",
      child_name: body.name ?? "",
      age: Number(body.age ?? 0),
      programme_track: body.programme_track ?? "",
      status: "pending_enrollment",
      requested_at: new Date().toISOString(),
    });
    return HttpResponse.json({
      id,
      parent_id: "p1",
      name: body.name ?? "",
      age: Number(body.age ?? 0),
      programme_track: body.programme_track ?? "",
      avatar_initial: (body.name ?? "?").trim().charAt(0).toUpperCase() || "?",
      enrolled_courses: 0,
      completed_courses: 0,
    });
  }),

  // Per-student progress feed used by the parent dashboard. Mock data covers
  // s1 and s2; any other id falls back to an empty list.
  http.get("*/students/:id/progress", ({ params }) => {
    const list = STUDENT_PROGRESS[params.id] ?? [];
    return HttpResponse.json(list);
  }),

  // ── Parent profile ──────────────────────────────────────────────────────
  http.get("*/parents/me", () => HttpResponse.json(PARENT_ME)),

  http.get("*/parents/me/children", () => HttpResponse.json(PARENT_CHILDREN)),

  // ── Payments ────────────────────────────────────────────────────────────
  http.get("*/payments", () => HttpResponse.json(PAYMENTS)),

  http.post("*/paystack/initiate", async () =>
    HttpResponse.json({
      access_code: "mock_access",
      reference: "mock_ref_123",
      authorization_url: "#",
    })
  ),

  http.post("*/paystack/verify", async () =>
    HttpResponse.json({
      status: "success",
      reference: "mock_ref_123",
      amount: 15000,
    })
  ),

  // ── Instructor profile + course/student catalogs ───────────────────────
  http.get("*/instructors/me", () => HttpResponse.json(INSTRUCTOR_ME)),

  http.get("*/instructors/me/courses", () =>
    HttpResponse.json(INSTRUCTOR_COURSES)
  ),

  http.get("*/instructors/me/students", () =>
    HttpResponse.json(INSTRUCTOR_STUDENTS)
  ),

  http.get("*/assignments/instructor", () =>
    HttpResponse.json(INSTRUCTOR_ASSIGNMENTS)
  ),

  // Submission feedback — stub. The real backend will mutate the underlying
  // submission record; here we just acknowledge so the UI can update its
  // local copy optimistically.
  http.put("*/assignments/:id/feedback", async ({ request }) => {
    await request.json().catch(() => ({}));
    return HttpResponse.json({ success: true });
  }),

  // Authoring stubs — the instructor course-management page POSTs to these
  // when the teacher adds a course/module/lesson/quiz/assignment.
  http.post("*/courses", async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ id: `c-${Date.now()}`, ...body });
  }),

  http.post("*/modules", async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ id: `m-${Date.now()}`, ...body });
  }),

  http.post("*/lessons", async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ id: `l-${Date.now()}`, ...body });
  }),

  http.post("*/quizzes", async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ id: `q-${Date.now()}`, ...body });
  }),

  http.post("*/assignments", async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ id: `a-${Date.now()}`, ...body });
  }),

  // ── Courses + modules + lessons ─────────────────────────────────────────
  http.get("*/courses", () => HttpResponse.json(COURSES)),

  http.get("*/courses/:id/modules", ({ params }) => {
    // Instructor view (c1, c2) returns the richer module shape with
    // lessons_count + quiz_id + assignment_id joined. For other courses
    // (or the student view) we fall back to the lightweight MODULES list.
    const courseId = params.id;
    const instructor = INSTRUCTOR_COURSE_MODULES[courseId];
    if (instructor) return HttpResponse.json(instructor);
    return HttpResponse.json(
      MODULES.map((m) => ({ ...m, course_id: courseId }))
    );
  }),

  http.get("*/modules/:id/lessons", ({ params }) => {
    const moduleId = params.id;
    const instructor = INSTRUCTOR_MODULE_LESSONS[moduleId];
    if (instructor) return HttpResponse.json(instructor);
    return HttpResponse.json(
      LESSONS.map((l) => ({ ...l, module_id: moduleId }))
    );
  }),

  http.get("*/lessons/:id", ({ params }) => {
    // Joined fields (module_title / course_title / course_id) are added so
    // the lesson viewer can render the breadcrumb without extra round trips.
    const lesson = LESSONS.find((l) => l.id === params.id) ?? LESSONS[0];
    return HttpResponse.json({
      ...lesson,
      module_title: "Getting Started",
      course_id: "c1",
      course_title: "Scratch Programming",
    });
  }),

  http.post("*/lessons/:id/complete", () => HttpResponse.json({ success: true })),

  // ── Assignments ─────────────────────────────────────────────────────────
  http.get("*/assignments", () => HttpResponse.json(ASSIGNMENTS)),

  http.post("*/assignments/submit", () => HttpResponse.json({ success: true })),

  // ── Quizzes ─────────────────────────────────────────────────────────────
  http.get("*/quizzes/:id/questions", () => HttpResponse.json(QUIZ_QUESTIONS)),

  http.post("*/quiz/submit", async ({ request }) => {
    const body = await request.json().catch(() => ({ answers: {} }));
    const answers = body.answers ?? {};
    const total = QUIZ_QUESTIONS.length;
    const score = QUIZ_QUESTIONS.reduce(
      (acc, q) => (answers[q.id] === q.correct_answer ? acc + 1 : acc),
      0
    );
    return HttpResponse.json({
      score,
      total,
      percentage: Math.round((score / total) * 100),
    });
  }),

  // ── Notifications ───────────────────────────────────────────────────────
  // Scoped per-user. Defaults to the student feed so existing student callers
  // (which omit user_id) keep working unchanged.
  http.get("*/notifications", ({ request }) => {
    const url = new URL(request.url);
    const uid = url.searchParams.get("user_id");
    if (uid === "p1") {
      return HttpResponse.json([
        ...DYNAMIC_PARENT_NOTIFICATIONS,
        ...PARENT_NOTIFICATIONS,
      ]);
    }
    if (uid === "i1") return HttpResponse.json(INSTRUCTOR_NOTIFICATIONS);
    if (uid === "admin1") {
      return HttpResponse.json([
        ...DYNAMIC_ADMIN_NOTIFICATIONS,
        ...ADMIN_NOTIFICATIONS_SEED,
      ]);
    }
    return HttpResponse.json(NOTIFICATIONS);
  }),

  // ── Certificates ────────────────────────────────────────────────────────
  http.get("*/certificates", () => HttpResponse.json(CERTIFICATES)),

  // ── Settings (stub) ─────────────────────────────────────────────────────
  http.post("*/user/change-password", async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    // Force-reset flow: when the request carries a temp_token (or a generic
    // `token` whose value starts with "temp_"), derive the email from it,
    // drop them out of FORCE_RESET_EMAILS, and flip the must_reset_password
    // flag on the matching ADMIN_CREATED_USERS row + their MOCK_CREDENTIALS
    // entry so the next login follows the normal path.
    const rawToken = body?.temp_token ?? body?.token;
    if (typeof rawToken === "string" && rawToken.startsWith("temp_")) {
      const email = rawToken.replace(/^temp_/, "");
      FORCE_RESET_EMAILS.delete(email);
      const created = ADMIN_CREATED_USERS.find((u) => u.email === email);
      if (created) created.must_reset_password = false;
      const mirror = ADMIN_USERS.find((u) => u.email === email);
      if (mirror) mirror.must_reset_password = false;
      // Register a credential row so the next login with the new password
      // resolves through the normal MOCK_CREDENTIALS branch.
      if (created && body.new_password) {
        const existing = MOCK_CREDENTIALS.find((c) => c.email === email);
        if (existing) {
          existing.password = body.new_password;
        } else {
          MOCK_CREDENTIALS.push({
            id: created.id,
            email: created.email,
            password: body.new_password,
            role: created.role,
            name: created.name,
          });
        }
      }
      return HttpResponse.json({ success: true });
    }
    return HttpResponse.json({ ok: true });
  }),

  http.put("*/user/profile", async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ ok: true, ...body });
  }),

  // ── Chat ────────────────────────────────────────────────────────────────
  // The conversations feed is per-user. Instructors see their student
  // conversations; everyone else falls back to the original student-side
  // feed so existing callers stay unchanged.
  http.get("*/conversations", ({ request }) => {
    const url = new URL(request.url);
    const uid = url.searchParams.get("user_id");
    if (uid === "i1") return HttpResponse.json(INSTRUCTOR_CONVERSATIONS);
    return HttpResponse.json(CONVERSATIONS);
  }),

  http.get("*/messages", ({ request }) => {
    const url = new URL(request.url);
    const convId = url.searchParams.get("conversation_id");
    if (!convId) return HttpResponse.json([]);
    if (INSTRUCTOR_MESSAGES[convId]) {
      return HttpResponse.json(INSTRUCTOR_MESSAGES[convId]);
    }
    return HttpResponse.json(CONV_MESSAGES);
  }),

  http.post("*/messages", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: `m-${Date.now()}`,
      sender_id: body.sender_id,
      receiver_id: body.receiver_id,
      message: body.message,
      file_url: body.file_url ?? null,
      created_at: new Date().toISOString(),
    });
  }),

  // ── Admin ───────────────────────────────────────────────────────────────
  http.get("*/admin/stats", () => HttpResponse.json(ADMIN_STATS)),

  http.get("*/admin/users", () => HttpResponse.json(ADMIN_USERS)),

  http.get("*/admin/courses", () =>
    HttpResponse.json({
      courses: ADMIN_COURSES,
      total_revenue: ADMIN_STATS.total_revenue,
    })
  ),

  http.get("*/admin/analytics", () => HttpResponse.json(ADMIN_ANALYTICS)),

  http.get("*/admin/payments", () =>
    HttpResponse.json({
      payments: ADMIN_PAYMENTS,
      total_revenue: ADMIN_STATS.total_revenue,
    })
  ),

  http.get("*/admin/pending-enrollments", () =>
    HttpResponse.json(PENDING_ENROLLMENTS)
  ),

  http.get("*/admin/activity-log", () =>
    HttpResponse.json(ADMIN_ACTIVITY_LOG)
  ),

  http.post("*/admin/permissions", async () =>
    HttpResponse.json({ success: true })
  ),

  // Admin course editor — returns the same shape instructor sees, including
  // joined modules + lessons + assignments. The admin editor reuses the
  // existing instructor catalogs.
  http.get("*/admin/courses/:id/editor", ({ params }) => {
    const course = ADMIN_COURSES.find((c) => c.id === params.id);
    const modules = INSTRUCTOR_COURSE_MODULES[params.id] ?? [];
    const lessonsByModule = {};
    for (const m of modules) {
      lessonsByModule[m.id] = INSTRUCTOR_MODULE_LESSONS[m.id] ?? [];
    }
    const assignments = INSTRUCTOR_ASSIGNMENTS.filter(
      (a) => a.course_id === params.id
    );
    return HttpResponse.json({
      course: course ?? null,
      modules,
      lessons_by_module: lessonsByModule,
      assignments,
    });
  }),

  // Admin authoring — provisions a real account from a pending enrollment.
  // The new user is added to ADMIN_USERS and put in FORCE_RESET_EMAILS so
  // their first login lands on /force-reset-password. If a pending_id is
  // provided the matching pending row is removed and the parent gets a
  // notification.
  http.post("*/admin/users", async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const id = `u-${Date.now()}`;
    const newUser = {
      id,
      role: body.role ?? "student",
      name: body.name ?? "",
      email: body.email ?? "",
      age: body.age,
      programme_track: body.programme_track,
      status: "active",
      language_preference: "en",
      created_at: new Date().toISOString(),
      must_reset_password: true,
    };
    ADMIN_USERS.push(newUser);
    ADMIN_CREATED_USERS.push(newUser);
    if (newUser.email) FORCE_RESET_EMAILS.add(newUser.email);

    // Drain the matching pending enrollment + emit a parent notification so
    // the parent sees "Login details created for [child name]".
    if (body.pending_id) {
      const idx = PENDING_ENROLLMENTS.findIndex((p) => p.id === body.pending_id);
      if (idx >= 0) {
        const pending = PENDING_ENROLLMENTS[idx];
        PENDING_ENROLLMENTS.splice(idx, 1);
        DYNAMIC_PARENT_NOTIFICATIONS.unshift({
          id: `pn-${Date.now()}`,
          user_id: "p1",
          type: "account_created",
          title: "Child Account Created! 🎉",
          message: `Login details have been created for ${pending.child_name}. Default password: ${DEFAULT_NEW_USER_PASSWORD}. They will be prompted to set a new password on first login.`,
          is_read: false,
          created_at: new Date().toISOString(),
          link: "/parent/children",
        });
      }
    }

    return HttpResponse.json({
      ...newUser,
      password: DEFAULT_NEW_USER_PASSWORD,
    });
  }),

  http.post("*/admin/users/deactivate", async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const u = ADMIN_USERS.find((x) => x.id === body.user_id);
    if (u) u.status = "inactive";
    return HttpResponse.json({ success: true, message: "User deactivated" });
  }),

  http.post("*/admin/users/activate", async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const u = ADMIN_USERS.find((x) => x.id === body.user_id);
    if (u) u.status = "active";
    return HttpResponse.json({ success: true, message: "User activated" });
  }),

  http.post("*/admin/users/assign-instructor", () =>
    HttpResponse.json({ success: true })
  ),

  http.post("*/admin/courses", async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const created = {
      id: `c-${Date.now()}`,
      ...body,
      is_published: false,
      students_count: 0,
      modules_count: 0,
      completion_rate: 0,
      revenue: 0,
      created_at: new Date().toISOString(),
    };
    ADMIN_COURSES.push(created);
    return HttpResponse.json(created);
  }),

  http.put("*/admin/courses/:id", async ({ params, request }) => {
    const body = await request.json().catch(() => ({}));
    const c = ADMIN_COURSES.find((x) => x.id === params.id);
    if (c) Object.assign(c, body);
    return HttpResponse.json({ success: true });
  }),

  http.delete("*/admin/courses/:id", ({ params }) => {
    const idx = ADMIN_COURSES.findIndex((x) => x.id === params.id);
    if (idx >= 0) ADMIN_COURSES.splice(idx, 1);
    return HttpResponse.json({ success: true });
  }),

  http.post("*/admin/courses/:id/publish", ({ params }) => {
    const c = ADMIN_COURSES.find((x) => x.id === params.id);
    if (c) c.is_published = true;
    return HttpResponse.json({ success: true, is_published: true });
  }),

  http.post("*/admin/courses/:id/unpublish", ({ params }) => {
    const c = ADMIN_COURSES.find((x) => x.id === params.id);
    if (c) c.is_published = false;
    return HttpResponse.json({ success: true, is_published: false });
  }),

  // Admin notification fan-in: every dashboard emits here. We persist it to
  // DYNAMIC_ADMIN_NOTIFICATIONS so the admin's notifications feed reflects
  // live activity. Parent-targeted events also feed into the parent feed.
  http.post("*/admin/notifications/send", async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    if (body.target === "admin" || !body.target) {
      DYNAMIC_ADMIN_NOTIFICATIONS.unshift({
        id: `an-${Date.now()}`,
        user_id: "admin1",
        type: body.type ?? "system",
        title: (body.priority ? "🔔 " : "") + (body.title ?? "Notification"),
        message: body.message ?? "",
        is_read: false,
        created_at: new Date().toISOString(),
        link: body.link ?? "/admin",
      });
    }
    if (body.target === "parent") {
      DYNAMIC_PARENT_NOTIFICATIONS.unshift({
        id: `pn-${Date.now()}`,
        user_id: "p1",
        type: body.type ?? "system",
        title: body.title ?? "Notification",
        message: body.message ?? "",
        is_read: false,
        created_at: new Date().toISOString(),
        link: body.link ?? "/parent",
      });
    }
    return HttpResponse.json({ success: true, sent_count: 3 });
  }),

  // Pending-enrollment seed grows whenever the parent's AddChildModal hits
  // the existing POST /students endpoint — that handler is updated below.
];
