export type ContentData = {
  meeting_id?: string;
  chapters?: number[];
  objectives?: string;
  body?: string;
  practical?: string;
  study?: string;
  published_id?: string;
  semester?: string;
  max_points?: number;
  due_at?: string;
  opens_at?: string;
  closes_at?: string;
  mode?: "online" | "in-person";
  questions?: Question[];
  recommendation?: boolean;
};
export type Question = {
  id: string;
  type: "multiple-choice" | "written";
  prompt: string;
  points: number;
  options?: string[];
};
export type Content = {
  id: string;
  offering_id: string;
  kind: "draft" | "lesson" | "assignment" | "exam" | "announcement";
  title: string;
  data: ContentData;
  published: boolean;
};
export type Offering = {
  id: string;
  cohort_id: number;
  school: string;
  title: string;
};
export type Enrollment = {
  id: string;
  offering_id: string;
  cohort_id: number;
  user_id: string;
  is_primary: boolean;
  status:
    | "pending"
    | "approved"
    | "declined"
    | "suspended"
    | "withdrawn"
    | "completed";
};
export type Work = {
  id: string;
  assessment_id: string;
  offering_id: string;
  user_id: string;
  attempt: number;
  status: "draft" | "submitted";
  response: string;
  answers: Record<string, string>;
  saved_at: string;
  submitted_at: string | null;
  late: boolean;
};
export type Grade = {
  work_id: string;
  score: number;
  feedback: string;
  released: boolean;
};
export type Resource = {
  id: string;
  offering_id: string;
  content_id: string | null;
  work_id: string | null;
  filename: string;
  ready: boolean;
  bucket: string;
  path: string;
  mime: string;
  size: number;
};
export type Snapshot = {
  userId: string;
  admin: boolean;
  editor: boolean;
  offerings: Offering[];
  enrollments: Enrollment[];
  instructors: { offering_id: string; user_id: string }[];
  content: Content[];
  work: Work[];
  grades: Grade[];
  resources: Resource[];
  attendance: {
    offering_id: string;
    meeting_id: string;
    user_id: string;
    status: string;
  }[];
  progress: { offering_id: string; user_id: string; chapter: number }[];
  ledger: {
    id: string;
    enrollment_id: string;
    semester: string;
    kind: string;
    cents: number;
    description: string;
    created_at: string;
  }[];
  people: { id: string; display_name: string | null }[];
  recommendations: {
    offering_id: string;
    user_id: string;
    instructor_id: string;
    recommendation: string;
  }[];
};
