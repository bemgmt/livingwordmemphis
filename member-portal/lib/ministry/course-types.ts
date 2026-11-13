export type WorkbookField = {
  id: string;
  label: string;
  section?: string;
  type: "written" | "short" | "choice" | "check";
  required?: boolean;
  options?: string[];
};
export type LibraryDocument = {
  id: string;
  offering_id: string;
  title: string;
  category: string;
  audience: string;
  state: "available" | "missing" | "review_required" | "draft";
  edition: string;
  notes: string;
  filename: string | null;
};
export type LearningUnit = {
  id: string;
  offering_id: string;
  kind: "chapter" | "week" | "practicum" | "portfolio" | "application";
  number: number;
  title: string;
  state: "available" | "missing" | "review_required";
  source_version: string;
  assignment_id: string | null;
  meeting_id: string | null;
  chapters: number[];
  notes: string;
};
export type UnitDetail = LearningUnit & {
  reading: string;
  instructions: string;
  fields: WorkbookField[];
  source_sections: Record<string, string>;
  draft: boolean;
};
export type SchoolRecord = {
  id: string;
  offering_id: string;
  user_id: string;
  kind: string;
  unit_id: string | null;
  status: string;
  data: Record<string, unknown>;
  updated_at: string;
};
export type CourseCatalog = {
  documents: LibraryDocument[];
  units: LearningUnit[];
  records: SchoolRecord[];
};
