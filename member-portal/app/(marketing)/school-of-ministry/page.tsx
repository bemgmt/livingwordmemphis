import Link from "next/link";
import {
  AGENDA,
  MINISTRY_SCHOOLS,
  TUITION,
  money,
} from "@/lib/ministry/program";
import { sanityFetch } from "@/lib/sanity/client";
export const metadata = {
  title: "School of Ministry · 2027",
  description:
    "Five schools, one year of ministry formation. Tuesdays, 6:30–9:00 PM at Living Word Memphis.",
};
export default async function Page() {
  const copy = await sanityFetch<{
    title?: string;
    introduction?: string;
    calendarNotes?: string;
    schoolDescriptions?: { school: string; description: string }[];
  } | null>(
    '*[_type=="ministryProgram"] | order(_updatedAt desc)[0]{title,introduction,calendarNotes,schoolDescriptions}',
    {},
    60,
  ).catch(() => null);
  return (
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Living Word Church of Memphis · Academic year 2027
        </p>
        <h1 className="mt-4 font-serif text-4xl sm:text-6xl">
          {copy?.title || "School of Ministry"}
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          {copy?.introduction ||
            "A year of biblical study, practical ministry, and structured independent learning. Five schools meet simultaneously in separate instructional groups."}
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground"
          href="/auth/login?next=%2Fmember%2Fschool-of-ministry"
        >
          Sign in to apply
        </Link>
        <p className="mt-3 text-sm text-muted-foreground">
          Enrollment requires staff approval. Teaching materials and student
          records are private.
        </p>
        {copy?.calendarNotes && (
          <p className="mt-4 whitespace-pre-wrap">{copy.calendarNotes}</p>
        )}
      </header>
      <section aria-labelledby="schools">
        <h2 id="schools" className="font-serif text-3xl">
          Find your school
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MINISTRY_SCHOOLS.map(([id, title]) => (
            <article key={id} className="rounded-xl border bg-card p-6">
              <h3 className="font-serif text-2xl">{title}</h3>
              <p className="mt-3 text-muted-foreground">
                {copy?.schoolDescriptions?.find((s) => s.school === id)
                  ?.description ||
                  "45 chapters · School-specific instruction and independent study."}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-serif text-3xl">The academic year</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="font-semibold">Orientation</dt>
              <dd>January 12, 2027</dd>
            </div>
            <div>
              <dt className="font-semibold">Spring</dt>
              <dd>January 19–May 4 · 14 teaching meetings and a final</dd>
            </div>
            <div>
              <dt className="font-semibold">Fall</dt>
              <dd>August 24–December 7 · 13 teaching meetings and a final</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm">
            No classes March 9, October 12, or November 23. No scheduled summer
            coursework.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-serif text-3xl">Tuition</h2>
          {TUITION.map((t) => (
            <p key={t.semester} className="mt-4 capitalize">
              <strong>
                {t.semester}: {money(t.cents)}
              </strong>
              <br />
              Due {t.semester === "spring" ? "January 9" : "August 14"}, 2027
            </p>
          ))}
          <p className="mt-4 text-sm text-muted-foreground">
            Annual tuition:{" "}
            {money(
              TUITION.reduce((total, semester) => total + semester.cents, 0),
            )}
            . Payments are arranged with the church and recorded by staff.
          </p>
        </div>
      </section>
      <section>
        <h2 className="font-serif text-3xl">Every Tuesday · 6:30–9:00 PM</h2>
        <p className="mt-2 text-muted-foreground">
          All times are Memphis time (America/Chicago). Recommended independent
          study: 3–4 hours per teaching week.
        </p>
        <dl className="mt-5 divide-y rounded-xl border bg-card px-6">
          {AGENDA.map(([time, title]) => (
            <div
              key={time}
              className="grid gap-2 py-4 sm:grid-cols-[180px_1fr]"
            >
              <dt className="font-medium">{time}</dt>
              <dd>{title}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
