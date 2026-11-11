"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AGENDA,
  MEETINGS,
  TUITION,
  chapterLabel,
  dateLabel,
  gradeSummary,
  money,
  nextMeeting,
  chicagoInputToIso,
  chicagoInputValue,
} from "../../lib/ministry/program";
import type {
  Content,
  ContentData,
  Question,
  Snapshot,
} from "../../lib/ministry/types";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import { approvalTuition } from "../../lib/ministry/tuition";

const base = "/member/school-of-ministry";
const control =
  "mt-2 min-h-11 w-full min-w-0 rounded-md border bg-background px-3 py-2 text-base";
const button =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50";
export async function schoolCommand(
  action: string,
  payload: Record<string, unknown>,
) {
  const r = await fetch("/api/ministry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  const body = await r.json();
  if (!r.ok) throw new Error(body.error || "Unable to save. Please retry.");
  return body;
}
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5 sm:p-6">
      <h2 className="mb-4 font-serif text-2xl">{title}</h2>
      {children}
    </section>
  );
}
function Field({
  label,
  name,
  type = "text",
  value,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  value?: string | number;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {type === "textarea" ? (
        <textarea
          name={name}
          defaultValue={value}
          required={required}
          rows={4}
          className={control}
        />
      ) : (
        <input
          name={name}
          type={type}
          step={type === "number" ? "any" : undefined}
          defaultValue={value}
          required={required}
          className={control}
        />
      )}
    </label>
  );
}
function Choose({
  label,
  name,
  children,
  value,
}: {
  label: string;
  name: string;
  children: ReactNode;
  value?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select required name={name} defaultValue={value} className={control}>
        {children}
      </select>
    </label>
  );
}
function Form({
  children,
  label,
  onSave,
}: {
  children: ReactNode;
  label: string;
  onSave: (d: FormData) => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        setMessage("");
        try {
          await onSave(data);
          setMessage("Saved successfully.");
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to save. Please retry.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy} className="space-y-4">
        {children}
        <button className={button} type="submit">
          {busy ? "Saving…" : label}
        </button>
      </fieldset>
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="break-words text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
function Files({
  snapshot,
  contentId,
  workId,
}: {
  snapshot: Snapshot;
  contentId?: string;
  workId?: string;
}) {
  const files = snapshot.resources.filter(
    (r) =>
      r.ready &&
      (contentId ? r.content_id === contentId : r.work_id === workId),
  );
  return files.length ? (
    <ul className="space-y-2">
      {files.map((r) => (
        <li key={r.id}>
          <a
            className="inline-flex min-h-11 items-center break-all text-primary underline"
            href={`/api/ministry/resources/${r.id}`}
          >
            {r.filename}
          </a>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-muted-foreground">No files attached.</p>
  );
}
function Uploader({
  contentId,
  workId,
  refresh,
}: {
  contentId?: string;
  workId?: string;
  refresh: () => Promise<void>;
}) {
  const [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState<string>();
  async function finish(id: string) {
    await schoolCommand("finish_upload", { id });
    setPending(undefined);
    await refresh();
    setStatus("File attached.");
  }
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">
        Attach a file
        <input
          className={control}
          disabled={busy || !!pending}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setError("");
            setStatus("Uploading… Keep this page open.");
            try {
              const prepared = await schoolCommand("prepare_upload", {
                content_id: contentId,
                work_id: workId,
                bucket: contentId
                  ? "ministry-curriculum"
                  : "ministry-submissions",
                filename: file.name,
                mime: file.type,
                size: file.size,
              });
              const r = await createClient()
                .storage.from(prepared.bucket)
                .uploadToSignedUrl(
                  prepared.path,
                  prepared.token,
                  new File([file], file.name, { type: prepared.mime }),
                  { contentType: prepared.mime },
                );
              if (r.error)
                throw new Error("Upload failed. Please choose the file again.");
              setPending(prepared.id);
              await finish(prepared.id);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Upload failed.");
              setStatus("");
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          }}
        />
      </label>
      <p className="text-xs text-muted-foreground">
        PDF, Word, PowerPoint, or MP4 · Maximum 50 MB.
      </p>
      {status && <p role="status">{status}</p>}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {pending && (
        <button
          type="button"
          className={button}
          disabled={busy}
          onClick={async () => {
            try {
              setBusy(true);
              await finish(pending);
              setError("");
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Retry attaching uploaded file
        </button>
      )}
    </div>
  );
}
const text = (d: FormData, k: string) => String(d.get(k) ?? "").trim();
export function MinistryPortal({
  initialView = "overview",
  initialId,
  initialOffering = "",
  studio = false,
}: {
  initialView?: string;
  initialId?: string;
  initialOffering?: string;
  studio?: boolean;
}) {
  const [s, setS] = useState<Snapshot>(),
    [error, setError] = useState(""),
    [offering, setOffering] = useState(initialOffering),
    [semester, setSemester] = useState("spring"),
    [filter, setFilter] = useState("upcoming");
  const refresh = useCallback(async () => {
    const r = await fetch("/api/ministry", { cache: "no-store" });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    setS(data);
    setError("");
  }, []);
  useEffect(() => {
    let active = true;
    fetch("/api/ministry", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        if (active) setS(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  if (error && !s)
    return (
      <Panel title="School of Ministry">
        <p role="alert">{error}</p>
        <button
          className={`${button} mt-4`}
          onClick={() => void refresh().catch((e) => setError(e.message))}
        >
          Retry
        </button>
      </Panel>
    );
  if (!s)
    return (
      <p role="status" className="p-6">
        Loading your school…
      </p>
    );
  const own = s.enrollments.filter((e) => e.user_id === s.userId),
    teaching = s.instructors
      .filter((i) => i.user_id === s.userId)
      .map((i) => i.offering_id);
  const accessible = s.offerings.filter(
    (o) =>
      s.admin ||
      s.editor ||
      teaching.includes(o.id) ||
      own.some((e) => e.offering_id === o.id),
  );
  const selected =
    offering ||
    s.content.find((c) => c.id === initialId)?.offering_id ||
    own.find((e) => e.status === "approved")?.offering_id ||
    accessible[0]?.id ||
    s.offerings[0]?.id;
  const o = s.offerings.find((o) => o.id === selected),
    enrollment = own.find((e) => e.offering_id === selected),
    canTeach = s.admin || teaching.includes(selected);
  const canRead =
    s.admin ||
    canTeach ||
    s.editor ||
    enrollment?.status === "approved" ||
    enrollment?.status === "completed";
  const name = (id: string) =>
    s.people.find((p) => p.id === id)?.display_name || "Church member";
  const content = s.content.filter((c) => c.offering_id === selected),
    work = s.work.filter((w) => w.offering_id === selected);
  const upcoming = content
    .filter(
      (c) =>
        ["assignment", "exam"].includes(c.kind) &&
        c.published &&
        !work.some(
          (w) =>
            w.assessment_id === c.id &&
            w.user_id === s.userId &&
            w.status === "submitted" &&
            !work.some(
              (x) =>
                x.assessment_id === c.id &&
                x.user_id === s.userId &&
                x.attempt > w.attempt,
            ),
        ),
    )
    .sort((a, b) =>
      (a.data.due_at || a.data.opens_at || "").localeCompare(
        b.data.due_at || b.data.opens_at || "",
      ),
    );
  const feedback = s.grades.filter(
    (g) =>
      g.released &&
      work.some((w) => w.id === g.work_id && w.user_id === s.userId),
  );
  const mutate = async (action: string, payload: Record<string, unknown>) => {
    const r = await schoolCommand(action, payload);
    await refresh();
    return r;
  };
  const nav = [
    ["overview", "Overview"],
    ["school", "My School"],
    ["calendar", "Calendar"],
    ["assignments", "Assignments & Exams"],
    ["progress", "My Progress"],
    ["tuition", "Tuition"],
    ...(teaching.length || s.admin ? [["teach", "Teaching"]] : []),
    ...(s.admin ? [["admin", "Administration"]] : []),
  ];
  const next = nextMeeting();
  const isDetail = initialView === "lesson" || initialView === "assessment";
  return (
    <div
      className={`mx-auto max-w-6xl space-y-6 ${studio ? "h-full overflow-y-auto bg-background p-5 text-foreground" : ""}`}
    >
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Living Word Memphis · 2027
        </p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl">
          School of Ministry
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tuesdays · 6:30–9:00 PM · Memphis time
        </p>
      </header>
      {!studio && (
        <nav
          aria-label="School navigation"
          className="flex flex-wrap gap-2 border-b pb-4"
        >
          {nav.map(([path, label]) => (
            <a
              key={path}
              aria-current={initialView === path ? "page" : undefined}
              className={`min-h-11 rounded-md px-3 py-3 text-sm ${initialView === path ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"}`}
              href={`${base}/${path}`}
            >
              {label}
            </a>
          ))}
        </nav>
      )}
      {accessible.length > 1 && (
        <label className="block max-w-md text-sm font-medium">
          School
          <select
            aria-label="School"
            className={control}
            value={selected}
            onChange={(e) => setOffering(e.target.value)}
          >
            {accessible.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {initialView === "overview" && (
        <>
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <Panel
                title={
                  next
                    ? `Next ${next.kind === "exam" ? "examination" : next.kind === "orientation" ? "orientation" : "class"} · ${dateLabel(next.date)}`
                    : "The 2027 academic year is complete"
                }
              >
                <p>
                  {next
                    ? `6:30–9:00 PM · ${next.week ? `Week ${next.week}` : next.kind}`
                    : "Review your released curriculum and academic record."}
                </p>
                {next?.kind === "instruction" && (
                  <p className="mt-2">
                    {o?.school === "prophets"
                      ? chapterLabel(next.chapters)
                      : "School-specific curriculum"}
                  </p>
                )}
                <a className={`${button} mt-4`} href={`${base}/school`}>
                  Continue learning
                </a>
              </Panel>
              {own.length === 0 ? (
                <EnrollmentForm snapshot={s} mutate={mutate} />
              ) : (
                own.map((e) => (
                  <Panel
                    key={e.id}
                    title={
                      s.offerings.find((o) => o.id === e.offering_id)?.title ??
                      "Enrollment"
                    }
                  >
                    <p className="capitalize">
                      Enrollment: <strong>{e.status}</strong>
                    </p>
                    {e.status === "pending" && (
                      <p className="mt-2 text-sm">
                        Your request is awaiting staff approval. Course
                        materials become available after approval.
                      </p>
                    )}
                    {["declined", "suspended", "withdrawn"].includes(
                      e.status,
                    ) && (
                      <p className="mt-2 text-sm">
                        Please contact the school office about your enrollment.
                      </p>
                    )}
                  </Panel>
                ))
              )}
              <Panel title="Upcoming work">
                {upcoming.length ? (
                  upcoming.map((c) => (
                    <a
                      className="block min-h-11 py-3 text-primary underline"
                      key={c.id}
                      href={`${base}/assessment/${c.id}`}
                    >
                      {c.title}
                    </a>
                  ))
                ) : (
                  <p>No released assignments yet.</p>
                )}
              </Panel>
            </div>
            <aside className="space-y-6">
              <Panel title="Announcements">
                {content
                  .filter((c) => c.kind === "announcement" && c.published)
                  .map((c) => (
                    <article key={c.id} className="mb-4">
                      <h3 className="font-semibold">{c.title}</h3>
                      <p className="whitespace-pre-wrap text-sm">
                        {c.data.body}
                      </p>
                    </article>
                  ))}
                <p className="text-sm text-muted-foreground">
                  Orientation: January 12, 2027. No scheduled summer coursework.
                </p>
              </Panel>
              <Panel title="Recent feedback">
                {feedback.length ? (
                  feedback
                    .slice(-3)
                    .reverse()
                    .map((g) => (
                      <article key={g.work_id} className="mb-4">
                        <p className="font-medium">
                          {
                            content.find(
                              (c) =>
                                c.id ===
                                work.find((w) => w.id === g.work_id)
                                  ?.assessment_id,
                            )?.title
                          }
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm">
                          {g.feedback || "Result released by your instructor."}
                        </p>
                      </article>
                    ))
                ) : (
                  <p className="text-sm">No instructor feedback yet.</p>
                )}
              </Panel>
              <Panel title="My progress">
                <p>
                  {
                    s.progress.filter(
                      (p) =>
                        p.user_id === s.userId && p.offering_id === selected,
                    ).length
                  }{" "}
                  of 45 chapters marked read
                </p>
                <a
                  className="mt-3 inline-flex min-h-11 items-center text-primary underline"
                  href={`${base}/progress`}
                >
                  View academic progress
                </a>
              </Panel>
              <Panel title="Tuition">
                <p>Spring: $500 · Fall: $500</p>
                <a
                  className="mt-3 inline-flex min-h-11 items-center text-primary underline"
                  href={`${base}/tuition`}
                >
                  View recorded payments
                </a>
              </Panel>
            </aside>
          </div>
        </>
      )}
      {initialView === "calendar" && (
        <>
          <Panel title="2027 academic calendar">
            <p className="mb-4 text-sm">
              27 teaching meetings · 2 finals · Orientation is separate. All
              times are America/Chicago.
            </p>
            <Calendar semester={semester} setSemester={setSemester} />
          </Panel>
          <Panel title="Weekly agenda">
            <dl className="divide-y">
              {AGENDA.map(([time, label]) => (
                <div
                  className="grid gap-2 py-3 sm:grid-cols-[170px_1fr]"
                  key={time}
                >
                  <dt className="font-medium">{time}</dt>
                  <dd>{label}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </>
      )}
      {["school", "assignments", "progress", "lesson", "assessment"].includes(
        initialView,
      ) &&
        !canRead && (
          <Panel title="Enrollment approval required">
            <p>
              Your school materials are available after staff approve
              enrollment.
            </p>
            <a
              className="mt-4 inline-flex min-h-11 items-center text-primary underline"
              href={`${base}/overview`}
            >
              View enrollment status
            </a>
          </Panel>
        )}
      {initialView === "school" && canRead && (
        <>
          <Panel title={o?.title ?? "My school"}>
            <p>
              Instructors:{" "}
              {s.instructors
                .filter((i) => i.offering_id === selected)
                .map((i) => name(i.user_id))
                .join(", ") || "To be announced"}
            </p>
            <div className="mt-4">
              <Semester value={semester} onChange={setSemester} />
            </div>
            <div className="mt-5 space-y-3">
              {MEETINGS.filter((m) => m.semester === semester).map((m) => (
                <details key={m.id} className="rounded-lg border p-4">
                  <summary className="min-h-11 cursor-pointer font-medium">
                    {dateLabel(m.date)} ·{" "}
                    {m.kind === "instruction"
                      ? `Week ${m.week}`
                      : m.kind === "break"
                        ? "No classes"
                        : m.kind === "exam"
                          ? "Final examination"
                          : "Orientation"}
                  </summary>
                  <div className="space-y-3 pt-3">
                    {m.kind === "instruction" && (
                      <p>
                        {o?.school === "prophets"
                          ? chapterLabel(m.chapters)
                          : "Curriculum being prepared"}
                      </p>
                    )}
                    {content
                      .filter(
                        (c) =>
                          c.kind === "lesson" &&
                          c.data.meeting_id === m.id &&
                          c.published,
                      )
                      .map((c) => (
                        <a
                          className="block min-h-11 py-2 text-primary underline"
                          key={c.id}
                          href={`${base}/lesson/${c.id}`}
                        >
                          {c.title}
                        </a>
                      ))}
                    {m.kind === "instruction" && (
                      <p className="text-sm text-muted-foreground">
                        Independent study: 3–4 hours. Lesson instructions appear
                        when published.
                      </p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </Panel>
        </>
      )}
      {initialView === "lesson" &&
        canRead &&
        (() => {
          const c = s.content.find(
            (c) => c.id === initialId && c.kind === "lesson",
          );
          return c ? (
            <Panel title={c.title}>
              <p className="mb-4 text-sm">
                {chapterLabel(c.data.chapters ?? [])}
              </p>
              {[
                ["Learning objectives", c.data.objectives],
                ["Lesson", c.data.body],
                ["Practical ministry", c.data.practical],
                ["Independent study", c.data.study],
              ].map(([label, value]) => (
                <section className="my-6" key={label}>
                  <h3 className="font-semibold">{label}</h3>
                  <p className="mt-2 whitespace-pre-wrap">
                    {value || "To be provided by your instructor."}
                  </p>
                </section>
              ))}
              <h3 className="font-semibold">Materials</h3>
              <Files snapshot={s} contentId={c.id} />
              <a
                className="mt-5 inline-flex min-h-11 items-center text-primary underline"
                href={`${base}/assignments`}
              >
                Assignments & exams
              </a>
            </Panel>
          ) : (
            <Panel title="Lesson unavailable">
              <p>This lesson is not released for your enrollment.</p>
            </Panel>
          );
        })()}
      {initialView === "assignments" && canRead && (
        <Panel title="Assignments & exams">
          <div
            className="mb-4 flex gap-2"
            role="group"
            aria-label="Assignment status"
          >
            {["upcoming", "submitted", "returned"].map((f) => (
              <button
                className={`min-h-11 rounded-md border px-3 capitalize ${filter === f ? "bg-primary text-primary-foreground" : ""}`}
                key={f}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          {content
            .filter(
              (c) => ["assignment", "exam"].includes(c.kind) && c.published,
            )
            .filter((c) => {
              const w = work
                  .filter(
                    (w) => w.assessment_id === c.id && w.user_id === s.userId,
                  )
                  .sort((a, b) => b.attempt - a.attempt)[0],
                g = s.grades.find((g) => g.work_id === w?.id && g.released);
              return filter === "returned"
                ? !!g
                : filter === "submitted"
                  ? w?.status === "submitted" && !g
                  : !w || w.status === "draft";
            })
            .map((c) => (
              <article key={c.id} className="border-b py-4">
                <a
                  className="font-semibold text-primary underline"
                  href={`${base}/assessment/${c.id}`}
                >
                  {c.title}
                </a>
                <p className="mt-2 text-sm">
                  {c.data.max_points} points · {c.kind}{" "}
                  {c.data.mode && `· ${c.data.mode}`}
                </p>
                {c.data.due_at && (
                  <p className="text-sm">Due {timeLabel(c.data.due_at)}</p>
                )}
              </article>
            ))}
          <p className="mt-4 text-sm text-muted-foreground">
            Only released assessments appear here. Late assignments are accepted
            and labeled.
          </p>
        </Panel>
      )}
      {initialView === "assessment" &&
        canRead &&
        (() => {
          const a = s.content.find(
            (c) =>
              c.id === initialId && ["assignment", "exam"].includes(c.kind),
          );
          return a ? (
            <WorkPanel
              key={a.id}
              assessment={a}
              snapshot={s}
              refresh={refresh}
              readOnly={
                enrollment?.status === "completed" ||
                enrollment?.status !== "approved"
              }
            />
          ) : (
            <Panel title="Assessment unavailable">
              <p>
                It may not be released yet. Check the examination window or
                contact your instructor.
              </p>
            </Panel>
          );
        })()}
      {initialView === "progress" && canRead && (
        <Progress
          snapshot={s}
          offering={selected}
          userId={s.userId}
          mutate={mutate}
          readOnly={enrollment?.status !== "approved"}
        />
      )}
      {initialView === "tuition" && (
        <Panel title="Tuition records">
          <p className="mb-5 text-sm text-muted-foreground">
            Payments are recorded by church staff. An unpaid balance does not
            automatically change enrollment access.
          </p>
          {TUITION.map((t) => {
            const entries = s.ledger.filter(
              (l) =>
                l.semester === t.semester &&
                own.some((e) => e.id === l.enrollment_id),
            );
            return (
              <section className="mb-6 border-b pb-5" key={t.semester}>
                <h3 className="text-lg font-semibold capitalize">
                  {t.semester} · {money(t.cents)}
                </h3>
                <p>Due {dateLabel(t.due)}</p>
                {entries.map((l) => (
                  <div
                    key={l.id}
                    className="mt-3 flex flex-wrap justify-between gap-2"
                  >
                    <span>{l.description}</span>
                    <strong>{money(l.cents)}</strong>
                  </div>
                ))}
                <p className="mt-4 font-semibold">
                  {entries.length
                    ? `Recorded balance: ${money(entries.reduce((n, e) => n + e.cents, 0))}`
                    : "No payment records yet."}
                </p>
              </section>
            );
          })}
        </Panel>
      )}
      {initialView === "teach" &&
        (canTeach ? (
          <Teaching
            snapshot={s}
            offering={selected}
            mutate={mutate}
            refresh={refresh}
            name={name}
          />
        ) : (
          <Panel title="Instructor access required">
            <p>Teaching is limited to your assigned schools.</p>
          </Panel>
        ))}
      {initialView === "admin" &&
        (s.admin ? (
          <Administration
            key={selected}
            snapshot={s}
            offering={selected}
            mutate={mutate}
            name={name}
          />
        ) : (
          <Panel title="School administrator access required">
            <p>
              Only executive and apostle administrators can manage enrollment
              and tuition.
            </p>
          </Panel>
        ))}
      {initialView === "editor" &&
        (s.editor ? (
          <CurriculumEditor
            key={selected}
            snapshot={s}
            offering={selected}
            mutate={mutate}
            refresh={refresh}
          />
        ) : (
          <Panel title="Curriculum editor access required">
            <p>
              Sign in to the church portal using your existing staff editor
              account.
            </p>
          </Panel>
        ))}
      {!isDetail &&
        ![
          "overview",
          "school",
          "calendar",
          "assignments",
          "progress",
          "tuition",
          "teach",
          "admin",
          "editor",
        ].includes(initialView) && (
          <Panel title="Page not found">
            <a href={base}>Return to your school</a>
          </Panel>
        )}
    </div>
  );
}
function Semester({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2" role="group" aria-label="Semester">
      {["spring", "fall"].map((t) => (
        <button
          type="button"
          key={t}
          aria-pressed={value === t}
          className={`min-h-11 rounded-md border px-4 capitalize ${value === t ? "bg-primary text-primary-foreground" : ""}`}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
function Calendar({
  semester,
  setSemester,
}: {
  semester: string;
  setSemester: (s: string) => void;
}) {
  return (
    <>
      <Semester value={semester} onChange={setSemester} />
      <ul className="mt-4 divide-y">
        {MEETINGS.filter((m) => m.semester === semester).map((m) => (
          <li key={m.id} className="flex flex-wrap justify-between gap-2 py-4">
            <span>{dateLabel(m.date)}</span>
            <strong>
              {m.kind === "instruction"
                ? `Week ${m.week}`
                : m.kind === "break"
                  ? "Break · No classes"
                  : m.kind === "exam"
                    ? "Final examination"
                    : "Student orientation"}
            </strong>
          </li>
        ))}
      </ul>
    </>
  );
}
type Mutate = (
  action: string,
  payload: Record<string, unknown>,
) => Promise<unknown>;
function EnrollmentForm({
  snapshot: s,
  mutate,
}: {
  snapshot: Snapshot;
  mutate: Mutate;
}) {
  return (
    <Panel title="Request enrollment">
      <Form
        label="Request enrollment"
        onSave={(d) =>
          mutate("request_enrollment", {
            offering_id: text(d, "offering_id"),
            accepted: d.get("accepted") === "on",
          })
        }
      >
        <Choose name="offering_id" label="Primary school">
          {s.offerings.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
        </Choose>
        <p>
          One year · Tuesdays, 6:30–9:00 PM · 3–4 hours of independent study per
          teaching week.
        </p>
        <p>
          Spring tuition: $500. Fall tuition: $500. Enrollment is approved by
          church staff after spring tuition is paid or covered by an authorized
          waiver.
        </p>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="accepted"
            required
            className="mt-1 size-5"
          />
          I have reviewed the schedule, tuition, and independent study
          expectations.
        </label>
      </Form>
    </Panel>
  );
}
function timeLabel(value: string) {
  return (
    new Date(value).toLocaleString("en-US", {
      timeZone: "America/Chicago",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " Memphis time"
  );
}

function WorkPanel({
  assessment: a,
  snapshot: s,
  refresh,
  readOnly,
}: {
  assessment: Content;
  snapshot: Snapshot;
  refresh: () => Promise<void>;
  readOnly: boolean;
}) {
  const existing = s.work
    .filter((w) => w.assessment_id === a.id && w.user_id === s.userId)
    .sort((x, y) => y.attempt - x.attempt)[0];
  const [response, setResponse] = useState(existing?.response ?? ""),
    [answers, setAnswers] = useState<Record<string, string>>(
      existing?.answers ?? {},
    ),
    [workId, setWorkId] = useState(existing?.id),
    [status, setStatus] = useState(
      existing ? "Draft loaded." : "No draft saved yet.",
    ),
    [error, setError] = useState(""),
    [locked, setLocked] = useState(existing?.status === "submitted"),
    [busy, setBusy] = useState(false);
  const changed = useRef(false),
    queue = useRef<Promise<unknown>>(Promise.resolve()),
    submitting = useRef(false),
    revision = useRef(0);
  const isExam = a.kind === "exam",
    deadline = a.data.closes_at ? Date.parse(a.data.closes_at) : Infinity;
  const closed = isExam && Date.now() >= deadline,
    notOpen =
      isExam && !!a.data.opens_at && Date.now() < Date.parse(a.data.opens_at),
    disabled =
      readOnly ||
      locked ||
      busy ||
      closed ||
      notOpen ||
      a.data.mode === "in-person";
  const save = useCallback(
    async (
      action: string,
      currentResponse: string,
      currentAnswers: Record<string, string>,
    ) => {
      const r = await schoolCommand(action, {
        assessment_id: a.id,
        response: currentResponse,
        answers: currentAnswers,
      });
      if (r.id) setWorkId(r.id);
      if (r.closed) {
        setLocked(true);
        setStatus(
          "The examination window closed. The latest saved answers were finalized.",
        );
      }
      return r;
    },
    [a.id],
  );
  useEffect(() => {
    if (!isExam || !changed.current || disabled || submitting.current) return;
    const rev = revision.current;
    setStatus("Unsaved changes…");
    const timer = setTimeout(() => {
      queue.current = queue.current
        .catch(() => undefined)
        .then(async () => {
          if (submitting.current) return;
          try {
            await save("save_work", response, answers);
            if (revision.current === rev) {
              setStatus("All responses saved.");
              setError("");
            }
          } catch (e) {
            setError((e as Error).message);
            setStatus(
              "Responses are not saved. Check your connection and retry.",
            );
          }
        });
    }, 700);
    return () => clearTimeout(timer);
  }, [response, answers, isExam, disabled, save]);
  useEffect(() => {
    if (
      !isExam ||
      locked ||
      !Number.isFinite(deadline) ||
      a.data.mode !== "online"
    )
      return;
    const timer = setInterval(() => {
      if (Date.now() >= deadline) {
        clearInterval(timer);
        setLocked(true);
        setStatus("Examination closed. Finalizing the latest saved responses…");
        void queue.current
          .catch(() => undefined)
          .then(() => save("save_work", response, answers))
          .then(refresh)
          .catch((e) => {
            setError((e as Error).message);
            setStatus(
              "The examination closed. Refresh to see finalization status.",
            );
          });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isExam, locked, deadline, a.data.mode, save, response, answers, refresh]);
  const grade = s.grades.find((g) => g.work_id === existing?.id && g.released);
  return (
    <Panel title={a.title}>
      <p className="mb-3">
        {a.data.max_points} points possible · {a.kind}
        {existing && ` · Attempt ${existing.attempt}`}
      </p>
      <p className="mb-5 whitespace-pre-wrap">{a.data.body}</p>
      {a.data.due_at && (
        <p className="mb-4 text-sm">
          Due {timeLabel(a.data.due_at)}. Late assignments are accepted and
          labeled.
        </p>
      )}
      {isExam && a.data.mode === "online" && (
        <div className="mb-5 rounded-lg border p-4">
          <p>Opens: {a.data.opens_at && timeLabel(a.data.opens_at)}</p>
          <p>Closes: {a.data.closes_at && timeLabel(a.data.closes_at)}</p>
          <p className="mt-2 text-sm">
            One attempt. Responses autosave. When the window closes, only your
            latest saved responses are finalized. An instructor must authorize a
            retake.
          </p>
        </div>
      )}
      {a.data.mode === "in-person" ? (
        <p>
          This examination is completed in class. Your instructor will record
          the result.
        </p>
      ) : (
        <>
          <fieldset disabled={disabled} className="space-y-5">
            {isExam ? (
              (a.data.questions ?? []).map((q, i) => (
                <div key={q.id} className="rounded-lg border p-4">
                  <label className="font-medium" htmlFor={`q-${q.id}`}>
                    {i + 1}. {q.prompt} ({q.points} points)
                  </label>
                  {q.type === "written" ? (
                    <textarea
                      id={`q-${q.id}`}
                      rows={5}
                      className={control}
                      value={answers[q.id] ?? ""}
                      onChange={(e) => {
                        changed.current = true;
                        revision.current++;
                        setAnswers({ ...answers, [q.id]: e.target.value });
                      }}
                    />
                  ) : (
                    <select
                      id={`q-${q.id}`}
                      className={control}
                      value={answers[q.id] ?? ""}
                      onChange={(e) => {
                        changed.current = true;
                        revision.current++;
                        setAnswers({ ...answers, [q.id]: e.target.value });
                      }}
                    >
                      <option value="">Choose an answer</option>
                      {q.options?.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))
            ) : (
              <label className="block font-medium">
                Your response
                <textarea
                  rows={8}
                  className={control}
                  value={response}
                  onChange={(e) => {
                    changed.current = true;
                    setResponse(e.target.value);
                    setStatus("Unsaved changes.");
                  }}
                />
              </label>
            )}
          </fieldset>
          <p role="status" className="my-4 text-sm">
            {locked
              ? "Submitted · Read-only"
              : notOpen
                ? "This examination has not opened."
                : closed
                  ? "The examination window is closed."
                  : status}
          </p>
          {error && (
            <p role="alert" className="mb-4 text-destructive">
              {error}
            </p>
          )}
          {!disabled && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={button}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    await queue.current;
                    await save("save_work", response, answers);
                    setStatus("Draft saved.");
                    await refresh();
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Save draft
              </button>
              <button
                type="button"
                className={button}
                onClick={async () => {
                  submitting.current = true;
                  setBusy(true);
                  setError("");
                  try {
                    await queue.current.catch(() => undefined);
                    const result = await save("submit_work", response, answers);
                    setLocked(true);
                    setStatus(
                      result.closed
                        ? "Window closed; saved answers finalized."
                        : "Submitted successfully.",
                    );
                    await refresh();
                  } catch (e) {
                    submitting.current = false;
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Submit {isExam ? "exam" : "assignment"}
              </button>
            </div>
          )}
        </>
      )}
      {!isExam && workId && (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold">Attachments</h3>
          <Files snapshot={s} workId={workId} />
          {!disabled && <Uploader workId={workId} refresh={refresh} />}
        </div>
      )}
      {!isExam && !workId && !disabled && (
        <p className="mt-4 text-sm text-muted-foreground">
          Save your draft to attach files before submitting.
        </p>
      )}
      {grade && (
        <section className="mt-6 rounded-lg border p-4">
          <h3 className="font-semibold">
            Result: {grade.score} / {a.data.max_points}
          </h3>
          <p className="mt-3 whitespace-pre-wrap">{grade.feedback}</p>
        </section>
      )}
    </Panel>
  );
}

function Progress({
  snapshot: s,
  offering,
  userId,
  mutate,
  readOnly,
}: {
  snapshot: Snapshot;
  offering: string;
  userId: string;
  mutate: Mutate;
  readOnly: boolean;
}) {
  const [error, setError] = useState("");
  const assessments = s.content.filter(
    (c) =>
      c.offering_id === offering && ["assignment", "exam"].includes(c.kind),
  );
  const latest = s.work
    .filter((w) => w.offering_id === offering && w.user_id === userId)
    .filter(
      (w) =>
        !s.work.some(
          (x) =>
            x.assessment_id === w.assessment_id &&
            x.user_id === userId &&
            x.attempt > w.attempt,
        ),
    );
  const rows = latest.flatMap((w) => {
    const a = assessments.find((a) => a.id === w.assessment_id),
      g = s.grades.find((g) => g.work_id === w.id && g.released);
    return a
      ? [
          {
            score: g?.score ?? null,
            max_points: a.data.max_points ?? 0,
            work: w,
            assessment: a,
            grade: g,
          },
        ]
      : [];
  });
  const total = gradeSummary(rows);
  return (
    <div className="space-y-6">
      <Panel title="Academic progress">
        <p className="font-serif text-3xl">
          {total.percentage === null
            ? "No released grades yet"
            : `${total.percentage}%`}
        </p>
        <p className="mt-2 text-sm">
          {total.earned} / {total.possible} graded points. Pending work is not
          treated as zero. Attendance and reading do not change this grade.
        </p>
        {rows.map((r) => (
          <article className="border-b py-4" key={r.work.id}>
            <strong>{r.assessment.title}</strong>
            <p>
              {r.grade
                ? `${r.grade.score} / ${r.max_points}`
                : r.work.status === "submitted"
                  ? "Awaiting released result"
                  : "Draft"}{" "}
              {r.work.late && "· Late"}
            </p>
            {r.grade && (
              <p className="mt-2 whitespace-pre-wrap text-sm">
                {r.grade.feedback}
              </p>
            )}
          </article>
        ))}
        <p className="mt-4">
          Program completion:{" "}
          <strong>
            {s.enrollments.find(
              (e) => e.user_id === userId && e.offering_id === offering,
            )?.status === "completed"
              ? "Confirmed by staff"
              : "Not yet confirmed by staff"}
          </strong>
        </p>
      </Panel>
      <Panel title="Chapter reading">
        <p className="mb-4 text-sm">
          45 chapter slots. Reading checkmarks are separate from graded
          coursework.
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          {Array.from({ length: 45 }, (_, i) => i + 1).map((ch) => {
            const checked = s.progress.some(
              (p) =>
                p.offering_id === offering &&
                p.user_id === userId &&
                p.chapter === ch,
            );
            return (
              <label
                className="flex min-h-11 items-center gap-2 rounded-md border p-3 text-sm"
                key={ch}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={readOnly}
                  onChange={(e) =>
                    void mutate("progress", {
                      offering_id: offering,
                      chapter: ch,
                      done: e.target.checked,
                    }).catch((e) => setError(e.message))
                  }
                />
                {ch}
              </label>
            );
          })}
        </div>
        {error && <p role="alert">{error}</p>}
      </Panel>
      <Panel title="Attendance">
        <ul className="divide-y">
          {s.attendance
            .filter((r) => r.offering_id === offering && r.user_id === userId)
            .map((r) => (
              <li
                className="flex flex-wrap justify-between gap-2 py-3"
                key={r.meeting_id}
              >
                <span>{dateLabel(r.meeting_id)}</span>
                <strong className="capitalize">{r.status}</strong>
              </li>
            ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Breaks and orientation are not attendance requirements.
        </p>
      </Panel>
    </div>
  );
}

function CurriculumEditor({
  snapshot: s,
  offering,
  mutate,
  refresh,
}: {
  snapshot: Snapshot;
  offering: string;
  mutate: Mutate;
  refresh: () => Promise<void>;
}) {
  const [selected, setSelected] = useState(""),
    [draftId, setDraftId] = useState(""),
    [preview, setPreview] = useState(false);
  const drafts = s.content.filter(
    (c) => c.offering_id === offering && c.kind === "draft",
  );
  const draft = drafts.find((c) => c.id === (selected || draftId));
  const seed = MEETINGS.find((m) => m.kind === "instruction");
  return (
    <div className="space-y-6">
      <Panel title="Ministry curriculum editor">
        <p className="mb-4 text-sm">
          Drafts stay private. Choose a file directly, preview the lesson, then
          publish for enrolled students.
        </p>
        <label className="block text-sm font-medium">
          Lesson draft
          <select
            className={control}
            value={selected || draftId}
            onChange={(e) => {
              setSelected(e.target.value);
              setDraftId("");
              setPreview(false);
            }}
          >
            <option value="">Create a lesson</option>
            {drafts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      </Panel>
      <Panel title={draft ? "Edit lesson" : "New lesson"}>
        <Form
          key={draft?.id ?? "new"}
          label="Save private draft"
          onSave={async (d) => {
            const chapters = text(d, "chapters")
              .split(",")
              .map(Number)
              .filter((n) => Number.isInteger(n) && n >= 1 && n <= 45);
            const r = (await mutate("save_content", {
              id: draft?.id,
              offering_id: offering,
              kind: "draft",
              title: text(d, "title"),
              data: {
                ...draft?.data,
                meeting_id: text(d, "meeting_id"),
                chapters,
                objectives: text(d, "objectives"),
                body: text(d, "body"),
                practical: text(d, "practical"),
                study: text(d, "study"),
              },
            })) as { id: string };
            setDraftId(r.id);
            setSelected(r.id);
          }}
        >
          <Field
            label="Lesson title"
            name="title"
            value={draft?.title}
            required
          />
          <Choose
            name="meeting_id"
            label="Teaching meeting"
            value={draft?.data.meeting_id ?? seed?.id}
          >
            {MEETINGS.filter((m) => m.kind === "instruction").map((m) => (
              <option key={m.id} value={m.id}>
                {dateLabel(m.date)} · Week {m.week}
              </option>
            ))}
          </Choose>
          <Field
            name="chapters"
            label="Chapter numbers (comma separated)"
            value={draft?.data.chapters?.join(", ")}
          />
          <Field
            name="objectives"
            label="Learning objectives"
            type="textarea"
            value={draft?.data.objectives}
          />
          <Field
            name="body"
            label="Lesson content"
            type="textarea"
            value={draft?.data.body}
          />
          <Field
            name="practical"
            label="Practical ministry exercise"
            type="textarea"
            value={draft?.data.practical}
          />
          <Field
            name="study"
            label="Independent study instructions"
            type="textarea"
            value={draft?.data.study}
          />
        </Form>
      </Panel>
      {draft && (
        <>
          <Panel title="Lesson attachments">
            <Files snapshot={s} contentId={draft.id} />
            <Uploader contentId={draft.id} refresh={refresh} />
          </Panel>
          <Panel title="Preview & publish">
            <button
              className={`${button} mb-4`}
              type="button"
              onClick={() => setPreview(!preview)}
            >
              {preview ? "Close preview" : "Preview saved draft"}
            </button>
            {preview && (
              <article className="mb-5 rounded-lg border p-5">
                <h3 className="font-serif text-2xl">{draft.title}</h3>
                <p>{chapterLabel(draft.data.chapters ?? [])}</p>
                {[
                  draft.data.objectives,
                  draft.data.body,
                  draft.data.practical,
                  draft.data.study,
                ].map((body, i) => (
                  <p key={i} className="my-3 whitespace-pre-wrap">
                    {body}
                  </p>
                ))}
                <Files snapshot={s} contentId={draft.id} />
              </article>
            )}
            <Form
              label="Publish saved lesson"
              onSave={() => mutate("publish_lesson", { id: draft.id })}
            >
              <p className="text-sm">
                Publishing makes this saved version available to enrolled
                students. New edits remain private until republished.
              </p>
            </Form>
          </Panel>
        </>
      )}
    </div>
  );
}

function AssessmentEditor({
  offering,
  mutate,
  existing,
}: {
  offering: string;
  mutate: Mutate;
  existing?: Content;
}) {
  const [kind, setKind] = useState<string>(existing?.kind ?? "assignment"),
    [mode, setMode] = useState<string>(existing?.data.mode ?? "online"),
    [questions, setQuestions] = useState<Question[]>(
      existing?.data.questions ?? [],
    ),
    [keys, setKeys] = useState<Record<string, string>>({});
  useEffect(() => {
    if (existing?.kind === "exam")
      void fetch("/api/ministry?answerKey=" + existing.id).then(async (r) => {
        if (r.ok) setKeys(await r.json());
      });
  }, [existing?.id, existing?.kind]);
  return (
    <Panel title="Create assignment, exam, or announcement">
      <Form
        label="Save assessment or announcement"
        onSave={(d) => {
          const data: ContentData & { answer_key?: Record<string, string> } = {
            body: text(d, "body"),
            semester: text(d, "semester"),
          };
          if (kind !== "announcement") {
            data.max_points = Number(text(d, "max_points"));
            if (text(d, "due_at"))
              data.due_at = chicagoInputToIso(text(d, "due_at"));
          }
          if (kind === "exam") {
            data.mode = mode as "online" | "in-person";
            if (mode === "online") {
              data.opens_at = chicagoInputToIso(text(d, "opens_at"));
              data.closes_at = chicagoInputToIso(text(d, "closes_at"));
              data.questions = questions;
              data.answer_key = keys;
            }
          }
          return mutate("save_content", {
            id: existing?.id,
            offering_id: offering,
            kind,
            title: text(d, "title"),
            data,
            published: d.get("published") === "on",
          });
        }}
      >
        <label className="block text-sm font-medium">
          Type
          <select
            name="kind"
            className={control}
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="assignment">Assignment</option>
            <option value="exam">Semester final examination</option>
            <option value="announcement">Announcement</option>
          </select>
        </label>
        <Field name="title" label="Title" value={existing?.title} required />
        <Field
          name="body"
          label="Instructions or announcement"
          type="textarea"
          value={existing?.data.body}
          required
        />
        <Choose
          name="semester"
          label="Semester"
          value={existing?.data.semester}
        >
          <option value="spring">Spring</option>
          <option value="fall">Fall</option>
        </Choose>
        {kind !== "announcement" && (
          <>
            <Field
              name="max_points"
              label="Points possible"
              type="number"
              value={existing?.data.max_points}
              required
            />
            {kind === "assignment" && (
              <Field
                name="due_at"
                label="Deadline (Memphis time)"
                type="datetime-local"
                value={chicagoInputValue(existing?.data.due_at)}
                required
              />
            )}
          </>
        )}
        {kind === "exam" && (
          <>
            <label className="block text-sm font-medium">
              Delivery
              <select
                className={control}
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="online">Online</option>
                <option value="in-person">In person</option>
              </select>
            </label>
            {mode === "online" && (
              <>
                <Field
                  name="opens_at"
                  label="Opens (Memphis time)"
                  type="datetime-local"
                  value={chicagoInputValue(existing?.data.opens_at)}
                  required
                />
                <Field
                  name="closes_at"
                  label="Closes (Memphis time)"
                  type="datetime-local"
                  value={chicagoInputValue(existing?.data.closes_at)}
                  required
                />
                {questions.map((q, i) => (
                  <fieldset
                    key={q.id}
                    className="space-y-3 rounded-lg border p-4"
                  >
                    <legend>Question {i + 1}</legend>
                    <label className="block">
                      Question type
                      <select
                        className={control}
                        value={q.type}
                        onChange={(e) =>
                          setQuestions(
                            questions.map((x) =>
                              x.id === q.id
                                ? {
                                    ...x,
                                    type: e.target.value as Question["type"],
                                  }
                                : x,
                            ),
                          )
                        }
                      >
                        <option value="written">Written response</option>
                        <option value="multiple-choice">Multiple choice</option>
                      </select>
                    </label>
                    <label className="block">
                      Prompt
                      <textarea
                        required
                        className={control}
                        value={q.prompt}
                        onChange={(e) =>
                          setQuestions(
                            questions.map((x) =>
                              x.id === q.id
                                ? { ...x, prompt: e.target.value }
                                : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="block">
                      Points
                      <input
                        type="number"
                        min="1"
                        required
                        className={control}
                        value={q.points}
                        onChange={(e) =>
                          setQuestions(
                            questions.map((x) =>
                              x.id === q.id
                                ? { ...x, points: Number(e.target.value) }
                                : x,
                            ),
                          )
                        }
                      />
                    </label>
                    {q.type === "multiple-choice" && (
                      <>
                        <label className="block">
                          Choices (one per line)
                          <textarea
                            className={control}
                            value={q.options?.join("\n") ?? ""}
                            onChange={(e) =>
                              setQuestions(
                                questions.map((x) =>
                                  x.id === q.id
                                    ? {
                                        ...x,
                                        options: e.target.value.split("\n"),
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                        </label>
                        <label className="block">
                          Correct answer
                          <select
                            className={control}
                            required
                            value={keys[q.id] ?? ""}
                            onChange={(e) =>
                              setKeys({ ...keys, [q.id]: e.target.value })
                            }
                          >
                            <option value="">Choose the correct answer</option>
                            {q.options?.filter(Boolean).map((v, n) => (
                              <option key={n}>{v}</option>
                            ))}
                          </select>
                        </label>
                      </>
                    )}
                    <button
                      type="button"
                      className="min-h-11 text-destructive underline"
                      onClick={() =>
                        setQuestions(questions.filter((x) => x.id !== q.id))
                      }
                    >
                      Remove question
                    </button>
                  </fieldset>
                ))}
                <button
                  type="button"
                  className={button}
                  onClick={() =>
                    setQuestions([
                      ...questions,
                      {
                        id: crypto.randomUUID(),
                        type: "written",
                        prompt: "",
                        points: 1,
                      },
                    ])
                  }
                >
                  Add question
                </button>
                <p className="text-sm">
                  Question points must total the examination points possible.
                  Answer keys remain private.
                </p>
              </>
            )}
          </>
        )}
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="published"
            defaultChecked={existing?.published}
          />
          Release to enrolled students
        </label>
      </Form>
    </Panel>
  );
}

function Teaching({
  snapshot: s,
  offering,
  mutate,
  refresh,
  name,
}: {
  snapshot: Snapshot;
  offering: string;
  mutate: Mutate;
  refresh: () => Promise<void>;
  name: (id: string) => string;
}) {
  const [student, setStudent] = useState(""),
    [review, setReview] = useState(""),
    [editId, setEditId] = useState("");
  const roster = s.enrollments.filter(
    (e) =>
      e.offering_id === offering &&
      ["approved", "completed"].includes(e.status),
  );
  const work = s.work.filter(
      (w) => w.offering_id === offering && w.status === "submitted",
    ),
    w = work.find((w) => w.id === review),
    a = s.content.find((a) => a.id === w?.assessment_id),
    g = s.grades.find((g) => g.work_id === w?.id);
  return (
    <div className="space-y-6">
      <Panel title="Teaching workspace">
        <p>
          Manage only your assigned school. Tuition records are handled by
          school administrators.
        </p>
        <label className="mt-4 block font-medium">
          Student record
          <select
            className={control}
            value={student}
            onChange={(e) => setStudent(e.target.value)}
          >
            <option value="">Choose a student</option>
            {roster.map((e) => (
              <option key={e.id} value={e.user_id}>
                {name(e.user_id)}
              </option>
            ))}
          </select>
        </label>
      </Panel>
      {student && (
        <>
          <Progress
            snapshot={s}
            offering={offering}
            userId={student}
            mutate={mutate}
            readOnly
          />
          <Panel title="Record attendance">
            <Form
              label="Save attendance"
              onSave={(d) =>
                mutate("attendance", {
                  offering_id: offering,
                  user_id: student,
                  meeting_id: text(d, "meeting_id"),
                  status: text(d, "status"),
                })
              }
            >
              <Choose name="meeting_id" label="Meeting">
                {MEETINGS.filter((m) =>
                  ["instruction", "exam"].includes(m.kind),
                ).map((m) => (
                  <option key={m.id} value={m.id}>
                    {dateLabel(m.date)}
                  </option>
                ))}
              </Choose>
              <Choose name="status" label="Attendance">
                {["present", "late", "absent", "excused"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Choose>
            </Form>
          </Panel>
        </>
      )}
      <Panel title="Review submissions & gradebook">
        <label className="block font-medium">
          Submission
          <select
            className={control}
            value={review}
            onChange={(e) => setReview(e.target.value)}
          >
            <option value="">Choose submitted work</option>
            {work.map((w) => (
              <option key={w.id} value={w.id}>
                {name(w.user_id)} ·{" "}
                {s.content.find((a) => a.id === w.assessment_id)?.title} ·
                Attempt {w.attempt}
                {s.grades.some((g) => g.work_id === w.id && g.released)
                  ? " · Returned"
                  : " · Needs review"}
              </option>
            ))}
          </select>
        </label>
        {w && a && (
          <div className="mt-5 space-y-4">
            <p>
              {w.late ? "Late submission" : "Submitted"} ·{" "}
              {w.submitted_at && timeLabel(w.submitted_at)}
            </p>
            <p className="whitespace-pre-wrap">{w.response}</p>
            {a.data.questions?.map((q) => (
              <article className="rounded-lg border p-4" key={q.id}>
                <h3 className="font-semibold">{q.prompt}</h3>
                <p className="mt-2 whitespace-pre-wrap">
                  {w.answers[q.id] || "No response"}
                </p>
              </article>
            ))}
            <Files snapshot={s} workId={w.id} />
            <Form
              key={w.id}
              label="Save grade"
              onSave={(d) =>
                mutate("grade", {
                  id: w.id,
                  score: Number(text(d, "score")),
                  feedback: text(d, "feedback"),
                  released: d.get("released") === "on",
                })
              }
            >
              <Field
                name="score"
                label={`Points earned (maximum ${a.data.max_points})`}
                type="number"
                value={g?.score}
                required
              />
              <Field
                name="feedback"
                label="Instructor feedback"
                type="textarea"
                value={g?.feedback}
              />
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="released"
                  defaultChecked={g?.released}
                />
                Release result to student
              </label>
            </Form>
            {a.kind === "exam" && (
              <Form
                label="Authorize a new attempt"
                onSave={() => mutate("retake", { id: w.id })}
              >
                <p className="text-sm">
                  Previous attempts remain in the academic record. The exam must
                  have an open window before the student can resume.
                </p>
              </Form>
            )}
          </div>
        )}
      </Panel>
      <Panel title="Edit assessment or announcement">
        <label className="block">
          Choose an item
          <select
            className={control}
            value={editId}
            onChange={(e) => setEditId(e.target.value)}
          >
            <option value="">Create a new item</option>
            {s.content
              .filter(
                (c) =>
                  c.offering_id === offering &&
                  ["assignment", "exam", "announcement"].includes(c.kind),
              )
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} · {c.published ? "Released" : "Draft"}
                </option>
              ))}
          </select>
        </label>
        <p className="mt-3 text-sm">
          Assessment editing is locked once an attempt exists. Examination
          windows and grading remain available.
        </p>
      </Panel>
      <Panel title="Record missing assignment">
        <Form
          label="Record zero for missing work"
          onSave={(d) =>
            mutate("mark_missing", {
              assessment_id: text(d, "assessment_id"),
              user_id: text(d, "user_id"),
              released: d.get("released") === "on",
            })
          }
        >
          <Choose label="Student" name="user_id">
            {roster.map((e) => (
              <option key={e.id} value={e.user_id}>
                {name(e.user_id)}
              </option>
            ))}
          </Choose>
          <Choose label="Assignment" name="assessment_id">
            {s.content
              .filter(
                (c) => c.offering_id === offering && c.kind === "assignment",
              )
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
          </Choose>
          <label className="flex items-center gap-3">
            <input type="checkbox" name="released" />
            Release missing-work result
          </label>
          <p className="text-sm">
            This explicitly records zero points and preserves an instructor
            audit entry. Missing work is never scored automatically.
          </p>
        </Form>
      </Panel>
      <AssessmentEditor
        key={editId || offering}
        existing={s.content.find((c) => c.id === editId)}
        offering={offering}
        mutate={mutate}
      />
      {s.content
        .filter((c) => c.offering_id === offering && c.kind === "exam")
        .map((exam) => (
          <Panel key={exam.id} title={exam.title}>
            {exam.data.mode === "online" ? (
              <Form
                label="Update examination window"
                onSave={(d) =>
                  mutate("exam_window", {
                    id: exam.id,
                    opens_at: chicagoInputToIso(text(d, "opens_at")),
                    closes_at: chicagoInputToIso(text(d, "closes_at")),
                  })
                }
              >
                <Field
                  name="opens_at"
                  label="Opens (Memphis time)"
                  type="datetime-local"
                  value={chicagoInputValue(exam.data.opens_at)}
                  required
                />
                <Field
                  name="closes_at"
                  label="Closes (Memphis time)"
                  type="datetime-local"
                  value={chicagoInputValue(exam.data.closes_at)}
                  required
                />
              </Form>
            ) : (
              <Form
                label="Record in-person examination result"
                onSave={(d) =>
                  mutate("in_person_score", {
                    assessment_id: exam.id,
                    user_id: text(d, "user_id"),
                    score: Number(text(d, "score")),
                    feedback: text(d, "feedback"),
                    released: d.get("released") === "on",
                  })
                }
              >
                <Choose label="Student" name="user_id">
                  {roster.map((e) => (
                    <option key={e.id} value={e.user_id}>
                      {name(e.user_id)}
                    </option>
                  ))}
                </Choose>
                <Field
                  name="score"
                  label={`Points earned (maximum ${exam.data.max_points})`}
                  type="number"
                  required
                />
                <Field name="feedback" label="Feedback" type="textarea" />
                <label className="flex items-center gap-3">
                  <input name="released" type="checkbox" />
                  Release result
                </label>
              </Form>
            )}
          </Panel>
        ))}
      <Panel title="Completion recommendation">
        <Form
          label="Send recommendation to administrators"
          onSave={(d) =>
            mutate("recommend_completion", {
              offering_id: offering,
              user_id: text(d, "user_id"),
              recommendation: text(d, "recommendation"),
            })
          }
        >
          <Choose name="user_id" label="Student">
            {roster.map((e) => (
              <option key={e.id} value={e.user_id}>
                {name(e.user_id)}
              </option>
            ))}
          </Choose>
          <Field
            name="recommendation"
            label="Recommendation"
            type="textarea"
            required
          />
        </Form>
      </Panel>
      <p className="text-sm text-muted-foreground">
        Lesson publishing is managed in{" "}
        <Link className="text-primary underline" href="/admin/studio/ministry">
          Sanity curriculum editor
        </Link>
        .
      </p>
      <button
        type="button"
        className="min-h-11 text-primary underline"
        onClick={() => void refresh()}
      >
        Refresh academic records
      </button>
    </div>
  );
}

function Administration({
  snapshot: s,
  offering,
  mutate,
  name,
}: {
  snapshot: Snapshot;
  offering: string;
  mutate: Mutate;
  name: (id: string) => string;
}) {
  const [selected, setSelected] = useState("");
  const enrollments = s.enrollments.filter((e) => e.offering_id === offering),
    e = enrollments.find((e) => e.id === selected);
  const pending = enrollments.filter((item) => item.status === "pending");
  const tuition = e ? approvalTuition(e, s.enrollments, s.ledger) : null;
  return (
    <div className="space-y-6">
      <Panel title="Student approvals">
        <p className="mb-4 text-sm">
          $500 per semester · $1,000 annually. Record spring tuition payment or
          an authorized waiver, then approve the student. Payment alone does not
          grant course access.
        </p>
        {pending.length === 0 ? (
          <p>No pending students in this school.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((student) => {
              const account = approvalTuition(student, s.enrollments, s.ledger);
              return (
                <li
                  key={student.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{name(student.user_id)}</p>
                    <p className="text-sm">
                      {account.ready
                        ? "Tuition covered · Ready for approval"
                        : `Awaiting tuition · ${money(account.balance)} spring balance`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={button}
                    onClick={() => setSelected(student.id)}
                  >
                    Review payment &amp; enrollment
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      <Panel title="2027 school administration">
        <p>
          America/Chicago · 27 teaching meetings · 2 finals · Staff-confirmed
          completion.
        </p>
        <label className="mt-4 block font-medium">
          Enrollment
          <select
            className={control}
            value={selected}
            onChange={(ev) => setSelected(ev.target.value)}
          >
            <option value="">Choose an enrollment</option>
            {enrollments.map((e) => (
              <option key={e.id} value={e.id}>
                {name(e.user_id)} · {e.status}
              </option>
            ))}
          </select>
        </label>
        {e && (
          <div className="mt-5">
            {tuition?.primary && (
              <TuitionRecords
                snapshot={s}
                enrollmentId={tuition.primary.id}
                mutate={mutate}
              />
            )}
            {e.status === "pending" &&
              (tuition?.ready ? (
                <Form
                  label="Approve student"
                  onSave={() =>
                    mutate("enrollment", { id: e.id, status: "approved" })
                  }
                >
                  <p>
                    Spring tuition is covered. This student is ready for your
                    approval.
                  </p>
                </Form>
              ) : (
                <p className="my-4 rounded-lg border p-4" role="status">
                  Approval is unavailable until the full spring tuition is
                  covered. Record a payment or authorized waiver above.
                </p>
              ))}
            <Form
              key={`${e.id}:${e.status}`}
              label="Update enrollment"
              onSave={(d) =>
                mutate("enrollment", { id: e.id, status: text(d, "status") })
              }
            >
              <Choose name="status" label="Enrollment status" value={e.status}>
                {[
                  "pending",
                  "approved",
                  "declined",
                  "suspended",
                  "withdrawn",
                  "completed",
                ].map((v) => (
                  <option
                    key={v}
                    value={v}
                    disabled={
                      (v === "approved" &&
                        !e.first_approved_at &&
                        !tuition?.ready) ||
                      (v === "completed" && !e.first_approved_at)
                    }
                  >
                    {v}
                  </option>
                ))}
              </Choose>
              <p className="text-sm">
                Choose Completed only after reviewing the student’s academic
                record. Suspension and withdrawal remove course access. Tuition
                does not change this status automatically.
              </p>
            </Form>
            <div className="mt-5">
              {s.recommendations
                .filter(
                  (r) => r.offering_id === offering && r.user_id === e.user_id,
                )
                .map((r) => (
                  <article
                    key={r.user_id}
                    className="mb-4 rounded-lg border p-4"
                  >
                    <h3 className="font-semibold">Instructor recommendation</h3>
                    <p className="whitespace-pre-wrap">{r.recommendation}</p>
                  </article>
                ))}
              <Progress
                snapshot={s}
                offering={offering}
                userId={e.user_id}
                mutate={mutate}
                readOnly
              />
            </div>
          </div>
        )}
      </Panel>
      <Panel title="Assign an additional school">
        <Form
          label="Grant additional enrollment"
          onSave={(d) =>
            mutate("grant_enrollment", {
              offering_id: offering,
              user_id: text(d, "user_id"),
            })
          }
        >
          <Choose name="user_id" label="Church member">
            {s.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name || "Church member"}
              </option>
            ))}
          </Choose>
          <p className="text-sm">
            Grants an additional school to an approved student whose primary
            spring tuition is covered. New students must apply and have tuition
            recorded before approval.
          </p>
        </Form>
      </Panel>
      <Panel title="Instructor assignments">
        <Form
          label="Save instructor assignment"
          onSave={(d) =>
            mutate("instructor", {
              offering_id: offering,
              user_id: text(d, "user_id"),
              remove: d.get("remove") === "on",
            })
          }
        >
          <Choose name="user_id" label="Church member">
            {s.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name || "Church member"}
              </option>
            ))}
          </Choose>
          <label className="flex items-center gap-3">
            <input type="checkbox" name="remove" />
            Remove this instructor assignment
          </label>
        </Form>
        <ul className="mt-4">
          {s.instructors
            .filter((i) => i.offering_id === offering)
            .map((i) => (
              <li key={i.user_id}>{name(i.user_id)}</li>
            ))}
        </ul>
      </Panel>
      <Panel title="Curriculum & calendar">
        <p>
          Official academic dates are shared by all five schools. Public
          descriptions and calendar notes are managed in Sanity; private lesson
          content stays in the gated curriculum editor.
        </p>
        <Link
          className="mt-4 inline-flex min-h-11 items-center text-primary underline"
          href="/admin/studio/ministry"
        >
          Open Sanity curriculum editor
        </Link>
      </Panel>
    </div>
  );
}

function TuitionRecords({
  snapshot: s,
  enrollmentId,
  mutate,
}: {
  snapshot: Snapshot;
  enrollmentId: string;
  mutate: Mutate;
}) {
  const entries = s.ledger.filter((l) => l.enrollment_id === enrollmentId);
  return (
    <section
      className="mb-6 rounded-lg border p-4"
      aria-label="Student tuition account"
    >
      <h3 className="text-lg font-semibold">
        Record tuition payment, waiver, or correction
      </h3>
      <div className="my-4 grid gap-3 sm:grid-cols-2">
        {TUITION.map((t) => (
          <p key={t.semester} className="capitalize">
            {t.semester} balance:{" "}
            <strong>
              {money(
                entries
                  .filter((l) => l.semester === t.semester)
                  .reduce((n, l) => n + l.cents, 0),
              )}
            </strong>
          </p>
        ))}
      </div>
      <details className="mb-4">
        <summary className="cursor-pointer py-2">Payment history</summary>
        {entries.map((l) => (
          <p key={l.id} className="my-2 text-sm">
            {l.semester} · {l.description} · {money(l.cents)}
          </p>
        ))}
      </details>
      <Form
        label="Append tuition record"
        onSave={(d) => {
          const kind = text(d, "kind"),
            amount = Math.round(Number(text(d, "amount")) * 100);
          if (!Number.isFinite(amount) || amount === 0)
            throw new Error("Enter a non-zero amount.");
          return mutate("tuition", {
            enrollment_id: enrollmentId,
            semester: text(d, "semester"),
            kind,
            cents: kind === "correction" ? amount : -Math.abs(amount),
            description: text(d, "description"),
          });
        }}
      >
        <Choose label="Semester" name="semester">
          <option value="spring">Spring</option>
          <option value="fall">Fall</option>
        </Choose>
        <Choose label="Record type" name="kind">
          <option value="payment">Payment</option>
          <option value="waiver">Waiver</option>
          <option value="correction">Signed balance correction</option>
        </Choose>
        <label className="block font-medium">
          Amount in dollars (negative corrections reduce the balance)
          <input
            className={control}
            name="amount"
            type="number"
            step="0.01"
            required
          />
        </label>
        <Field
          name="description"
          label="Description visible to student"
          required
        />
        <p className="text-sm">
          Records are retained. Correct mistakes with a new entry. This staff
          record is not a payment-processor receipt.
        </p>
      </Form>
    </section>
  );
}
