"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Content, Snapshot, Work } from "@/lib/ministry/types";
import type { UnitDetail, WorkbookField } from "@/lib/ministry/course-types";

const control =
  "mt-2 min-h-11 w-full min-w-0 rounded-md border bg-background px-3 py-2 text-base";
const button =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50";
export async function courseCommand(
  action: string,
  payload: Record<string, unknown>,
) {
  const r = await fetch("/api/ministry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  const body = await r.json();
  if (!r.ok) throw Error(body.error || "Unable to save. Please retry.");
  return body;
}
export async function getUnit(id: string, draft = false): Promise<UnitDetail> {
  const r = await fetch(
    `/api/ministry/course?unit=${encodeURIComponent(id)}${draft ? "&draft=true" : ""}`,
    { cache: "no-store" },
  );
  const body = await r.json();
  if (!r.ok) throw Error(body.error || "This material could not be loaded.");
  return body;
}
export function AnswerFields({
  fields,
  answers,
  onChange,
  disabled = false,
}: {
  fields: WorkbookField[];
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
  disabled?: boolean;
}) {
  let previous = "";
  return (
    <fieldset disabled={disabled} className="space-y-5">
      {fields.map((field, index) => {
        const heading =
          field.section && field.section !== previous ? field.section : null;
        previous = field.section || "";
        const id = `answer-${field.id}`;
        return (
          <div key={field.id}>
            {heading && (
              <h3 className="mt-7 border-b pb-2 font-serif text-xl">
                {heading}
              </h3>
            )}
            <label
              htmlFor={id}
              className="block whitespace-pre-wrap font-medium"
            >
              {index + 1}. {field.label}
              {field.required ? " *" : " (optional)"}
            </label>
            {field.type === "choice" ? (
              <select
                id={id}
                className={control}
                value={answers[field.id] || ""}
                onChange={(e) => onChange(field.id, e.target.value)}
                required={field.required}
              >
                <option value="">Choose an answer</option>
                {field.options?.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            ) : field.type === "check" ? (
              <label className="mt-2 flex min-h-11 items-center gap-3">
                <input
                  id={id}
                  type="checkbox"
                  checked={answers[field.id] === "true"}
                  onChange={(e) => onChange(field.id, String(e.target.checked))}
                />{" "}
                Confirm
              </label>
            ) : field.type === "short" ? (
              <input
                id={id}
                className={control}
                maxLength={20000}
                value={answers[field.id] || ""}
                required={field.required}
                onChange={(e) => onChange(field.id, e.target.value)}
              />
            ) : (
              <textarea
                id={id}
                className={control}
                rows={5}
                maxLength={20000}
                value={answers[field.id] || ""}
                required={field.required}
                onChange={(e) => onChange(field.id, e.target.value)}
              />
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
export function WorkbookAssignment({
  assessment: a,
  snapshot: s,
  refresh,
  readOnly,
  detail: provided,
}: {
  assessment: Content;
  snapshot: Snapshot;
  refresh: () => Promise<void>;
  readOnly: boolean;
  detail?: UnitDetail;
}) {
  const existing = s.work
    .filter((w) => w.assessment_id === a.id && w.user_id === s.userId)
    .sort((x, y) => y.attempt - x.attempt)[0];
  const [detail, setDetail] = useState<UnitDetail | undefined>(provided);
  const [answers, setAnswers] = useState<Record<string, string>>(
    existing?.answers || {},
  );
  const [error, setError] = useState("");
  const [status, setStatus] = useState(
    existing
      ? "Saved draft loaded."
      : "Your responses will save automatically.",
  );
  const [busy, setBusy] = useState(false),
    [submitted, setSubmitted] = useState(existing?.status === "submitted");
  const dirty = useRef(false),
    version = useRef(0),
    queue = useRef<Promise<unknown>>(Promise.resolve()),
    submitting = useRef(false);
  const expected = useRef<string | null>(existing?.saved_at || null),
    current = useRef(answers);
  useEffect(() => {
    if (provided) return;
    let active = true;
    getUnit(a.data.unit_id!)
      .then((d) => {
        if (active) setDetail(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [a.data.unit_id, provided]);
  const fields = existing?.assessment_snapshot?.fields || detail?.fields || [];
  const save = useCallback(
    async (action: string, values: Record<string, string>) => {
      const result = await courseCommand(action, {
        assessment_id: a.id,
        answers: values,
        expected_saved_at: expected.current,
        source_version:
          existing?.assessment_snapshot?.source_version ||
          detail?.source_version,
      });
      expected.current = result.saved_at;
      return result;
    },
    [
      a.id,
      detail?.source_version,
      existing?.assessment_snapshot?.source_version,
    ],
  );
  useEffect(() => {
    if (
      !dirty.current ||
      submitted ||
      readOnly ||
      submitting.current ||
      !detail
    )
      return;
    const revision = version.current;
    const timer = setTimeout(() => {
      queue.current = queue.current
        .catch(() => undefined)
        .then(async () => {
          if (submitting.current) return;
          try {
            await save("workbook_save", answers);
            if (revision === version.current) {
              dirty.current = false;
              setStatus("All responses saved.");
              setError("");
            }
          } catch (e) {
            setStatus("Unsaved responses. Retry saving before leaving.");
            setError((e as Error).message);
          }
        });
    }, 700);
    return () => clearTimeout(timer);
  }, [answers, detail, readOnly, save, submitted]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current && !submitted) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [submitted]);
  const manualSave = async (submit: boolean) => {
    if (submit) {
      const missing = fields.find(
        (f) => f.required && !current.current[f.id]?.trim(),
      );
      if (missing) {
        setError(`Complete the required question: ${missing.label}`);
        return;
      }
    }
    setBusy(true);
    submitting.current = submit;
    setError("");
    try {
      await queue.current.catch(() => undefined);
      await save(submit ? "workbook_submit" : "workbook_save", current.current);
      dirty.current = false;
      setStatus(
        submit
          ? "Assignment submitted. Your instructor will review it."
          : "All responses saved.",
      );
      if (submit) {
        setSubmitted(true);
        await refresh();
      }
    } catch (e) {
      submitting.current = false;
      setStatus("Responses are not saved. Retry before leaving.");
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const grade = s.grades.find((g) => g.work_id === existing?.id && g.released);
  if (!detail)
    return (
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-serif text-2xl">{a.title}</h2>
        {error ? (
          <p role="alert">{error}</p>
        ) : (
          <p role="status">Loading assignment…</p>
        )}
      </section>
    );
  return (
    <section className="rounded-xl border bg-card p-5 sm:p-6">
      <h2 className="font-serif text-2xl">{a.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Complete this assignment here. No workbook download or upload is
        required.
      </p>
      <p className="mt-2 text-sm">
        Completion review · No points assigned
        {existing && ` · Revision ${existing.attempt}`}
      </p>
      <details className="my-5 rounded-lg border p-4">
        <summary className="cursor-pointer py-1 font-medium">
          Source workbook guidance
        </summary>
        <p className="mt-4 whitespace-pre-wrap">
          {existing?.assessment_snapshot?.instructions || detail.instructions}
        </p>
      </details>
      <p className="mb-5 text-sm">
        Use your own words. Personal reflections are optional; you may discuss
        sensitive matters privately with your instructor.
      </p>
      <AnswerFields
        fields={fields}
        answers={answers}
        disabled={submitted || readOnly || busy}
        onChange={(id, value) => {
          const next = { ...current.current, [id]: value };
          current.current = next;
          dirty.current = true;
          version.current++;
          setAnswers(next);
          setStatus("Unsaved changes…");
        }}
      />
      <div className="mt-6 rounded-lg border bg-background p-4">
        <p role="status" aria-live="polite">
          {submitted ? "Submitted · Read-only" : status}
        </p>
        {error && (
          <p className="mt-2 text-destructive" role="alert">
            {error}
          </p>
        )}
        {!submitted && !readOnly && (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className={button}
              disabled={busy}
              onClick={() => void manualSave(false)}
            >
              Save responses
            </button>
            <button
              className={button}
              disabled={busy}
              onClick={() => void manualSave(true)}
            >
              Submit assignment
            </button>
          </div>
        )}
      </div>
      {grade && (
        <section className="mt-5 rounded-lg border p-4">
          <h3 className="font-semibold">
            {grade.completion_status === "complete"
              ? "Complete"
              : "Revision requested"}
          </h3>
          <p className="mt-2 whitespace-pre-wrap">{grade.feedback}</p>
          <p className="mt-2 text-sm">
            An instructor must authorize a new revision before you edit
            submitted work.
          </p>
        </section>
      )}
    </section>
  );
}
export function WorkbookResponses({ work }: { work: Work }) {
  return (
    <div className="space-y-3">
      <p className="text-sm">
        Assignment version:{" "}
        {work.assessment_snapshot?.source_version?.slice(0, 12)}
      </p>
      {work.assessment_snapshot?.fields?.map((f) => (
        <article key={f.id} className="rounded-lg border p-4">
          <h3 className="font-medium">{f.label}</h3>
          <p className="mt-2 whitespace-pre-wrap">
            {work.answers[f.id] || "No response provided"}
          </p>
        </article>
      ))}
    </div>
  );
}
