export const MINISTRY_YEAR = 2027;
export const MINISTRY_TIMEZONE = "America/Chicago";
export const MINISTRY_SCHOOLS = [
  ["apostles", "School of the Apostles"],
  ["prophets", "School of the Prophets"],
  ["evangelist", "School of the Evangelist"],
  ["pastor", "School of the Pastor"],
  ["teacher", "School of the Teacher"],
] as const;
export const AGENDA = [
  ["6:30–6:45 PM", "Opening prayer, devotion and announcements"],
  ["6:45–7:45 PM", "Primary instructional session"],
  ["7:45–7:55 PM", "Break"],
  ["7:55–8:35 PM", "Additional chapter instruction and discussion"],
  ["8:35–8:50 PM", "Practical ministry exercises"],
  ["8:50–9:00 PM", "Independent study assignments and dismissal"],
] as const;
export const TUITION = [
  { semester: "spring", cents: 50000, due: "2027-01-09" },
  { semester: "fall", cents: 50000, due: "2027-08-14" },
] as const;
export type Meeting = {
  id: string;
  date: string;
  semester: "spring" | "fall";
  kind: "instruction" | "exam" | "break" | "orientation";
  week: number | null;
  chapters: number[];
};
const spring = [
  ["01-19", 1, 2],
  ["01-26", 3, 4],
  ["02-02", 5, 5],
  ["02-09", 6, 7],
  ["02-16", 8, 9],
  ["02-23", 10, 11],
  ["03-02", 12, 12],
  ["03-16", 13, 14],
  ["03-23", 15, 16],
  ["03-30", 17, 17],
  ["04-06", 18, 19],
  ["04-13", 20, 20],
  ["04-20", 21, 22],
  ["04-27", 23, 23],
] as const;
const fall = [
  ["08-24", 24, 25],
  ["08-31", 26, 27],
  ["09-07", 28, 28],
  ["09-14", 29, 30],
  ["09-21", 31, 32],
  ["09-28", 33, 33],
  ["10-05", 34, 35],
  ["10-19", 36, 37],
  ["10-26", 38, 38],
  ["11-02", 39, 40],
  ["11-09", 41, 41],
  ["11-16", 42, 43],
  ["11-30", 44, 45],
] as const;
export const MEETINGS: Meeting[] = [
  ...([spring, fall] as const).flatMap((rows, term) =>
    rows.map(([day, first, last], i) => ({
      id: `2027-${day}`,
      date: `2027-${day}`,
      semester: term ? ("fall" as const) : ("spring" as const),
      kind: "instruction" as const,
      week: i + 1,
      chapters: Array.from({ length: last - first + 1 }, (_, n) => first + n),
    })),
  ),
  ...(
    [
      ["01-12", "spring", "orientation"],
      ["03-09", "spring", "break"],
      ["05-04", "spring", "exam"],
      ["10-12", "fall", "break"],
      ["11-23", "fall", "break"],
      ["12-07", "fall", "exam"],
    ] as const
  ).map(([date, semester, kind]) => ({
    id: `2027-${date}`,
    date: `2027-${date}`,
    semester,
    kind,
    week: null,
    chapters: [],
  })),
].sort((a, b) => a.date.localeCompare(b.date));
export function chicagoDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MINISTRY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function nextMeeting(now = new Date()) {
  const day = chicagoDate(now);
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: MINISTRY_TIMEZONE,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now),
  );
  return (
    MEETINGS.find(
      (m) =>
        m.kind !== "break" && (m.date > day || (m.date === day && hour < 21)),
    ) ?? null
  );
}
export function dateLabel(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
export function chapterLabel(chapters: number[]) {
  return chapters.length
    ? `Chapter${chapters.length > 1 ? "s" : ""} ${chapters.join("–")}`
    : "Curriculum being prepared";
}
export function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
/** Converts the editor's Memphis wall-clock input; rejects DST gaps rather than shifting deadlines. */
export function chicagoInputToIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error("Choose a date and time.");
  const target = new Date(value + ":00Z").getTime();
  let instant = target;
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: MINISTRY_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(instant));
    const get = (name: string) => parts.find((p) => p.type === name)!.value;
    const local = Date.parse(
      `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:00Z`,
    );
    instant += target - local;
  }
  if (chicagoInputValue(new Date(instant).toISOString()) !== value)
    throw new Error("This local time does not exist. Choose another time.");
  return new Date(instant).toISOString();
}
export function chicagoInputValue(iso?: string) {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MINISTRY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (name: string) => parts.find((p) => p.type === name)!.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
export function gradeSummary(
  rows: {
    score: number | null;
    max_points: number;
    grade_released?: boolean;
  }[],
) {
  const graded = rows.filter(
    (r) => r.score !== null && r.grade_released !== false,
  );
  const earned = graded.reduce((n, r) => n + (r.score ?? 0), 0),
    possible = graded.reduce((n, r) => n + r.max_points, 0);
  return {
    earned,
    possible,
    percentage: possible ? Math.round((1000 * earned) / possible) / 10 : null,
  };
}
