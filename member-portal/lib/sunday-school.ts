export const SUNDAY_SCHOOL_BUCKET = "sunday-school-curriculum";
export const FIRST_SCHOOL_MONTH = "2026-10";
export const SCHOOL_CLASSES = [
  { value: "adult", label: "Adult" },
  { value: "high-school", label: "High School" },
  { value: "middle-school", label: "Middle School" },
  { value: "elementary", label: "Elementary" },
] as const;
export const SCHOOL_UPLOAD_ROLES = ["sunday_school_teacher", "staff", "executive", "apostle"] as const;
export function rolesCanUploadSundaySchool(roles: string[]) {
  return roles.some(role => (SCHOOL_UPLOAD_ROLES as readonly string[]).includes(role));
}
export function validSchoolMonth(month: string) {
  return /^20\d{2}-(0[1-9]|1[0-2])$/.test(month) && month >= FIRST_SCHOOL_MONTH;
}
export function sundayDates(month: string) {
  if (!validSchoolMonth(month)) return [];
  const date = new Date(`${month}-01T12:00:00Z`);
  const dates: string[] = [];
  while (date.toISOString().slice(0, 7) === month) {
    if (date.getUTCDay() === 0) dates.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return dates;
}
export function monthLabel(month: string) {
  return new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}
export function lessonDateLabel(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
}
// Release at midnight Memphis time on the first of the previous month's last seven days.
export function schoolMonthIsReleased(month: string, now = new Date()) {
  if (!validSchoolMonth(month)) return false;
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/Chicago",
  }).formatToParts(now);
  const today = ["year", "month", "day"].map(type => parts.find(part => part.type === type)!.value).join("-");
  const previousMonthEnd = new Date(`${month}-01T12:00:00Z`);
  previousMonthEnd.setUTCDate(0);
  previousMonthEnd.setUTCDate(previousMonthEnd.getUTCDate() - 6);
  return today >= previousMonthEnd.toISOString().slice(0, 10);
}
// Only released months with published lessons supplied by the curriculum query are displayed.
export function schoolMonths(documentMonths: string[], now = new Date()) {
  return [...new Set(documentMonths.filter(month => schoolMonthIsReleased(month, now)))].sort().reverse();
}
export type LessonInput = { title: string; month: string; classGroup: string; lessonDate: string; description: string };
export function validateLesson(input: unknown): LessonInput {
  if (!input || typeof input !== "object") throw new Error("Enter the lesson details.");
  const raw = input as Record<string, unknown>;
  const text = (key: string) => typeof raw[key] === "string" ? (raw[key] as string).trim() : "";
  const lesson = { title: text("title"), month: text("month"), classGroup: text("classGroup"), lessonDate: text("lessonDate"), description: text("description") };
  if (!lesson.title || lesson.title.length > 160) throw new Error("Enter a lesson title of up to 160 characters.");
  if (!validSchoolMonth(lesson.month)) throw new Error("Choose a month starting with October 2026.");
  if (!SCHOOL_CLASSES.some(c => c.value === lesson.classGroup)) throw new Error("Choose a Sunday school class.");
  if (!sundayDates(lesson.month).includes(lesson.lessonDate)) throw new Error("Choose a Sunday within the selected month.");
  if (lesson.description.length > 2000) throw new Error("Keep the description within 2,000 characters.");
  return lesson;
}
export type SchoolLesson = LessonInput & { _id: string; protectedFile: { storagePath: string; originalFilename: string; contentType: string; size: number } };
