"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Snapshot } from "@/lib/ministry/types";
import type {
  CourseCatalog,
  SchoolRecord,
  UnitDetail,
  WorkbookField,
} from "@/lib/ministry/course-types";
import {
  AnswerFields,
  WorkbookAssignment,
  courseCommand,
  getUnit,
} from "./workbook";
import { LibraryPublisher } from "./library-publisher";
const base = "/member/school-of-ministry";
const control =
  "mt-2 min-h-11 w-full min-w-0 rounded-md border bg-background px-3 py-2 text-base";
const button =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50";
function useCatalog() {
  const [catalog, setCatalog] = useState<CourseCatalog>(),
    [error, setError] = useState("");
  const reload = useCallback(async () => {
    const r = await fetch("/api/ministry/course", { cache: "no-store" });
    const body = await r.json();
    if (!r.ok) throw Error(body.error);
    setCatalog(body);
    setError("");
  }, []);
  useEffect(() => {
    void reload().catch((e) => setError(e.message));
  }, [reload]);
  return { catalog, error, reload };
}
function Status({ state }: { state: string }) {
  return (
    <span className="rounded-md bg-muted px-2 py-1 text-xs">
      {state === "available"
        ? "Available"
        : state === "review_required"
          ? "Curriculum review required"
          : state === "missing"
            ? "Material being prepared"
            : state}
    </span>
  );
}
export function CourseLibrary({ offering }: { offering: string }) {
  const { catalog, error, reload } = useCatalog();
  const [kind, setKind] = useState("chapter");
  if (error)
    return (
      <div role="alert">
        {error}
        <button
          className={button}
          onClick={() => void reload().catch(() => undefined)}
        >
          Retry library
        </button>
      </div>
    );
  if (!catalog) return <p role="status">Loading school library…</p>;
  const documents = catalog.documents.filter((d) => d.offering_id === offering);
  const units = catalog.units
    .filter((u) => u.offering_id === offering && u.kind === kind)
    .sort((a, b) => a.number - b.number);
  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-serif text-2xl">School library</h2>
        <p className="mt-3">
          Read the supplied materials and complete workbook responses here.
          Missing materials stay clearly marked; they are not examinations or
          graded requirements.
        </p>
        <Link
          href={`${base}/school`}
          className="mt-3 inline-flex min-h-11 items-center text-primary underline"
        >
          Back to My School
        </Link>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-serif text-2xl">
          Resources and preparation status
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {documents.map((d) => (
            <article key={d.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="font-medium">{d.title}</h3>
                <Status state={d.state} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{d.edition}</p>
              {d.notes && <p className="mt-2 text-sm">{d.notes}</p>}
              {d.state === "available" && d.filename && (
                <a
                  className="mt-3 inline-flex min-h-11 items-center text-primary underline"
                  href={`/api/ministry/library/${d.id}?download=1`}
                >
                  Download optional reference
                </a>
              )}
            </article>
          ))}
        </div>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-serif text-2xl">Read and complete your work</h2>
        <div
          className="my-5 flex flex-wrap gap-2"
          role="group"
          aria-label="Learning material type"
        >
          {[
            ["chapter", "Chapter workbooks"],
            ["week", "Weekly assignments"],
            ["practicum", "Practicums"],
            ["portfolio", "Portfolio"],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={kind === value}
              className={`min-h-11 rounded-md border px-3 ${kind === value ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setKind(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {units.length === 0 ? (
          <p>No {kind} materials have been supplied for this school yet.</p>
        ) : (
          <ol className="space-y-3">
            {units.map((u) => (
              <li key={u.id} className="rounded-lg border p-4">
                <Link
                  className="inline-flex min-h-11 items-center font-medium text-primary underline"
                  href={`${base}/unit/${encodeURIComponent(u.id)}`}
                >
                  {u.title}
                </Link>
                <div className="mt-2">
                  <Status state={u.state} />
                </div>
                {u.notes && <p className="mt-2 text-sm">{u.notes}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
export function CourseUnit({
  id,
  snapshot,
  refresh,
  readOnly,
}: {
  id: string;
  snapshot: Snapshot;
  refresh: () => Promise<void>;
  readOnly: boolean;
}) {
  const [detail, setDetail] = useState<UnitDetail>(),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getUnit(id)
      .then((d) => {
        if (active) setDetail(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (error) return <p role="alert">{error}</p>;
  if (!detail) return <p role="status">Loading learning materials…</p>;
  const a = snapshot.content.find((a) => a.id === detail.assignment_id);
  return (
    <div className="space-y-6">
      <Link
        href={`${base}/library`}
        className="inline-flex min-h-11 items-center text-primary underline"
      >
        Back to school library
      </Link>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-serif text-2xl">{detail.title}</h2>
        <div className="mt-3">
          <Status state={detail.state} />
        </div>
        {detail.notes && (
          <p className="mt-4 rounded-lg border p-4">{detail.notes}</p>
        )}
        {detail.reading ? (
          <details className="mt-5" open>
            <summary className="cursor-pointer py-2 font-medium">
              Read the supplied chapter
            </summary>
            <div className="mt-4 whitespace-pre-wrap text-base leading-7">
              {detail.reading}
            </div>
          </details>
        ) : (
          <p className="mt-5 text-muted-foreground">
            This unit’s teaching text has not been prepared for the web. Check
            the school library for any supplied reference manual. Available
            workbook questions are below.
          </p>
        )}
      </section>
      {detail.state === "available" && a ? (
        <WorkbookAssignment
          key={`${a.id}:${snapshot.work.filter((w) => w.assessment_id === a.id && w.user_id === snapshot.userId).sort((x, y) => y.attempt - x.attempt)[0]?.attempt || 1}`}
          assessment={a}
          snapshot={snapshot}
          refresh={refresh}
          readOnly={readOnly}
          detail={detail}
        />
      ) : (
        <section className="rounded-xl border bg-card p-5">
          <h3 className="font-serif text-xl">Assignment being prepared</h3>
          <p className="mt-3">
            {detail.state === "review_required"
              ? "This workbook section is awaiting reconciliation with the controlling manual. Use the available weekly assignment while it is reviewed."
              : "The actual instructions or assessment materials have not been supplied. No submission or score is required for this placeholder."}
          </p>
        </section>
      )}
    </div>
  );
}
export function CourseApplication({
  offering,
  snapshot: s,
}: {
  offering: string;
  snapshot: Snapshot;
}) {
  const { catalog, error, reload } = useCatalog();
  const [unit, setUnit] = useState<UnitDetail>(),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [recordId, setRecordId] = useState<string>(),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    getUnit(`${offering}-application`)
      .then((d) => {
        if (active) setUnit(d);
      })
      .catch((e) => {
        if (active) setStatus(e.message);
      });
    return () => {
      active = false;
    };
  }, [offering]);
  const own = catalog?.records.find(
    (r) =>
      r.offering_id === offering &&
      r.user_id === s.userId &&
      r.kind === "application",
  );
  useEffect(() => {
    if (own) {
      setRecordId(own.id);
      setAnswers((own.data.answers || {}) as Record<string, string>);
    }
  }, [own]);
  const submitted = own?.status === "submitted" || own?.status === "complete";
  const save = async (submit: boolean) => {
    setBusy(true);
    try {
      const result = await courseCommand("record_save", {
        id: recordId,
        offering_id: offering,
        kind: "application",
        status: submit ? "submitted" : "draft",
        data: { answers, source_version: unit?.source_version },
      });
      setRecordId(result.id);
      setStatus(
        submit
          ? "Application submitted for school review."
          : "Application draft saved.",
      );
      await reload();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-serif text-2xl">Application and orientation</h2>
      <p className="my-4">
        Complete the school’s supplied application here. Reference and interview
        notes are handled privately by authorized school administrators. Tuition
        payment and enrollment approval remain separate steps.
      </p>
      {error && <p role="alert">{error}</p>}
      {unit ? (
        <AnswerFields
          fields={
            (own?.data.template as { fields?: WorkbookField[] } | undefined)
              ?.fields || unit.fields
          }
          answers={answers}
          disabled={submitted || busy}
          onChange={(id, value) => setAnswers({ ...answers, [id]: value })}
        />
      ) : (
        <p role="status">Loading application questions…</p>
      )}
      <p role="status" className="my-4">
        {submitted ? "Application submitted · Read-only" : status}
      </p>
      {!submitted && unit && (
        <div className="flex flex-wrap gap-3">
          <button
            className={button}
            disabled={busy}
            onClick={() => void save(false)}
          >
            Save application draft
          </button>
          <button
            className={button}
            disabled={busy}
            onClick={() => void save(true)}
          >
            Submit application
          </button>
        </div>
      )}
      <Orientation
        offering={offering}
        records={catalog?.records || []}
        userId={s.userId}
        reload={reload}
      />
      {catalog && (
        <StudentSchoolForms
          offering={offering}
          userId={s.userId}
          catalog={catalog}
          reload={reload}
        />
      )}
    </section>
  );
}
function Orientation({
  offering,
  records,
  userId,
  reload,
}: {
  offering: string;
  records: SchoolRecord[];
  userId: string;
  reload: () => Promise<void>;
}) {
  const [ack, setAck] = useState(false),
    [status, setStatus] = useState("");
  const record = records.find(
    (r) =>
      r.offering_id === offering &&
      r.user_id === userId &&
      r.kind === "orientation",
  );
  return (
    <section className="mt-7 border-t pt-5">
      <h3 className="font-serif text-xl">Orientation acknowledgement</h3>
      <p className="mt-2 text-sm">
        Review the published schedule, tuition, study expectations, and any
        available student handbook. Missing documents are not treated as
        acknowledged.
      </p>
      {record && ["submitted", "complete"].includes(record.status) ? (
        <p className="mt-3">
          Acknowledgement recorded for the published program information.
        </p>
      ) : (
        <>
          <label className="my-4 flex items-start gap-3">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
            />
            I have reviewed the published program schedule, tuition, and study
            expectations.
          </label>
          <button
            className={button}
            disabled={!ack}
            onClick={async () => {
              try {
                await courseCommand("record_save", {
                  offering_id: offering,
                  kind: "orientation",
                  status: "submitted",
                  data: {
                    acknowledged: true,
                    version: "2027-program-information",
                  },
                });
                await reload();
                setStatus("Acknowledgement saved.");
              } catch (e) {
                setStatus((e as Error).message);
              }
            }}
          >
            Record acknowledgement
          </button>
        </>
      )}
      <p role="status" className="mt-3">
        {status}
      </p>
    </section>
  );
}
const recordNames: Record<string, string> = {
  application: "Student application",
  reference: "Private reference",
  admission_review: "Admissions review",
  orientation: "Orientation",
  practicum: "Practicum evaluation",
  remediation: "Remediation plan",
  readiness: "Private readiness review",
  completion: "Completion review",
  certificate: "Certificate issuance",
  concern: "Student concern",
  request: "School request",
  case_note: "Restricted case note",
};
function RecordBody({ record }: { record: SchoolRecord }) {
  const template = record.data.template as
    | { fields?: WorkbookField[] }
    | undefined;
  const answers = (record.data.answers || {}) as Record<string, string>;
  return (
    <div className="mt-3 space-y-3">
      {template?.fields?.map((f) => (
        <div key={f.id}>
          <h4 className="font-medium">{f.label}</h4>
          <p className="whitespace-pre-wrap">
            {answers[f.id] || "No response"}
          </p>
        </div>
      ))}
      <dl className="space-y-2">
        {Object.entries(record.data)
          .filter(
            ([key]) => !["source_version", "template", "answers"].includes(key),
          )
          .map(([key, value]) => (
            <div key={key}>
              <dt className="font-medium capitalize">
                {key.replaceAll("_", " ")}
              </dt>
              <dd className="whitespace-pre-wrap break-words">
                {typeof value === "object"
                  ? JSON.stringify(value, null, 2)
                  : String(value)}
              </dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
function RecordHistory({ id }: { id: string }) {
  const [items, setItems] =
      useState<
        { data: Record<string, unknown>; status: string; recorded_at: string }[]
      >(),
    [error, setError] = useState("");
  return (
    <div className="mt-3">
      <button
        className="min-h-11 text-primary underline"
        onClick={async () => {
          try {
            const r = await fetch(
              `/api/ministry/course?history=${encodeURIComponent(id)}`,
              { cache: "no-store" },
            );
            const body = await r.json();
            if (!r.ok) throw Error(body.error);
            setItems(body);
            setError("");
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        View record correction history
      </button>
      {error && <p role="alert">{error}</p>}
      {items && (
        <div className="mt-3">
          {items.length === 0 ? (
            <p>No prior corrections.</p>
          ) : (
            items.map((v, index) => (
              <details key={index} className="my-2 rounded-lg border p-3">
                <summary className="cursor-pointer">
                  {v.status} · {new Date(v.recorded_at).toLocaleString()}
                </summary>
                <pre className="mt-3 whitespace-pre-wrap break-words text-sm">
                  {JSON.stringify(v.data, null, 2)}
                </pre>
              </details>
            ))
          )}
        </div>
      )}
    </div>
  );
}
function StudentSchoolForms({
  offering,
  userId,
  catalog,
  reload,
}: {
  offering: string;
  userId: string;
  catalog: CourseCatalog;
  reload: () => Promise<void>;
}) {
  const [id, setId] = useState(""),
    [detail, setDetail] = useState<UnitDetail>(),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [status, setStatus] = useState("");
  const forms = catalog.units.filter(
    (u) =>
      u.offering_id === offering &&
      u.kind === "application" &&
      !u.id.endsWith("-application"),
  );
  useEffect(() => {
    setAnswers({});
    setDetail(undefined);
    if (id)
      void getUnit(id)
        .then(setDetail)
        .catch((e) => setStatus(e.message));
  }, [id]);
  return (
    <section className="mt-7 border-t pt-5">
      <h3 className="font-serif text-xl">School forms and requests</h3>
      <p className="mt-2 text-sm">
        Use the supplied student-facing forms to submit a concern or request.
        References, interviews, and internal case notes remain restricted to
        authorized staff.
      </p>
      <label className="mt-4 block font-medium">
        School form
        <select
          className={control}
          value={id}
          onChange={(e) => setId(e.target.value)}
        >
          <option value="">Choose a form</option>
          {forms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.title}
            </option>
          ))}
        </select>
      </label>
      {detail && (
        <div className="mt-4">
          <AnswerFields
            fields={detail.fields}
            answers={answers}
            onChange={(key, value) => setAnswers({ ...answers, [key]: value })}
          />
          <button
            className={button + " mt-4"}
            onClick={async () => {
              try {
                await courseCommand("record_save", {
                  offering_id: offering,
                  kind: detail.source_sections.record_kind || "request",
                  unit_id: detail.id,
                  status: "submitted",
                  data: { answers, source_version: detail.source_version },
                });
                setStatus("School form submitted for authorized staff review.");
                setId("");
                await reload();
              } catch (e) {
                setStatus((e as Error).message);
              }
            }}
          >
            Submit school form
          </button>
        </div>
      )}
      <p role="status" className="my-3">
        {status}
      </p>
      {catalog.records
        .filter(
          (r) =>
            r.offering_id === offering &&
            r.user_id === userId &&
            ["request", "concern"].includes(r.kind),
        )
        .map((r) => (
          <details key={r.id} className="my-3 rounded-lg border p-4">
            <summary className="cursor-pointer">
              {forms.find((f) => f.id === r.unit_id)?.title ||
                recordNames[r.kind]}{" "}
              · {r.status}
            </summary>
            <RecordBody record={r} />
            <RecordHistory id={r.id} />
          </details>
        ))}
    </section>
  );
}
export function AcademicRecords({
  offering,
  userId,
  snapshot: s,
  refresh,
}: {
  offering: string;
  userId: string;
  snapshot: Snapshot;
  refresh: () => Promise<void>;
}) {
  const { catalog, error, reload } = useCatalog();
  const [kind, setKind] = useState(s.admin ? "admission_review" : "practicum"),
    [selected, setSelected] = useState(""),
    [status, setStatus] = useState("");
  const records = (catalog?.records || []).filter(
    (r) => r.offering_id === offering && r.user_id === userId,
  );
  const existing = records.find((r) => r.id === selected);
  const allowed = s.admin
    ? Object.keys(recordNames)
    : ["practicum", "remediation", "readiness"];
  const practicums =
    catalog?.units.filter(
      (u) => u.offering_id === offering && u.kind === "practicum",
    ) || [];
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const data: Record<string, string> = {};
      for (const key of [
        "notes",
        "review",
        "action",
        "reassessment",
        "due_date",
        "rating",
        "certificate_number",
        "reviewer",
        "issued_date",
      ])
        if (form.has(key)) data[key] = String(form.get(key) || "").trim();
      await courseCommand("record_save", {
        id: existing?.id,
        offering_id: offering,
        user_id: userId,
        kind,
        status: String(form.get("status")),
        unit_id: form.get("unit_id") || undefined,
        data,
      });
      setStatus("School record saved.");
      setSelected("");
      await reload();
      await refresh();
    } catch (e) {
      setStatus((e as Error).message);
    }
  };
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-serif text-2xl">Admissions and academic records</h2>
      <p className="mt-3 text-sm">
        Use the supplied school forms as the reference. Confidential references
        and case notes are restricted to school administrators. Completion and
        certificates require explicit authorized decisions.
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="my-5 space-y-3">
        {records.map((r) => (
          <article key={r.id} className="rounded-lg border p-4">
            <h3 className="font-semibold">
              {recordNames[r.kind] || r.kind} · {r.status}
            </h3>
            <p className="mt-2 text-sm">
              {new Date(r.updated_at).toLocaleString()}
            </p>
            <RecordBody record={r} />
            {allowed.includes(r.kind) && (
              <button
                className="mt-3 min-h-11 text-primary underline"
                onClick={() => {
                  setKind(r.kind);
                  setSelected(r.id);
                }}
              >
                Update this record
              </button>
            )}
          </article>
        ))}
      </div>
      <label className="block font-medium">
        Record type
        <select
          className={control}
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setSelected("");
          }}
        >
          {allowed.map((k) => (
            <option key={k} value={k}>
              {recordNames[k]}
            </option>
          ))}
        </select>
      </label>
      {(kind === "application" || kind === "orientation") && !existing ? (
        <p className="mt-4">
          The student’s application and orientation acknowledgement appear above
          after they are saved. Select an existing record to return it for
          revision. Use admissions review for staff decisions.
        </p>
      ) : (
        <form
          key={existing?.id || kind}
          className="mt-5 space-y-4"
          onSubmit={save}
        >
          {kind === "practicum" && (
            <>
              <label className="block font-medium">
                Practicum
                <select
                  name="unit_id"
                  className={control}
                  defaultValue={existing?.unit_id || ""}
                  required
                >
                  <option value="">Choose a supplied practicum</option>
                  {practicums.map((p) => (
                    <option
                      disabled={p.state !== "available"}
                      key={p.id}
                      value={p.id}
                    >
                      {p.title}
                      {p.state !== "available"
                        ? " · Materials being prepared"
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-sm">
                A missing practicum cannot be evaluated or awarded a score.
              </p>
              <label className="block font-medium">
                Evaluator outcome
                <select
                  name="rating"
                  className={control}
                  defaultValue={String(existing?.data.rating || "")}
                >
                  <option value="">Choose an outcome</option>
                  <option>Complete</option>
                  <option>Revision required</option>
                  {offering === "2027-teacher" &&
                    [
                      "1 — Unsatisfactory",
                      "2 — Developing",
                      "3 — Proficient",
                      "4 — Exemplary",
                    ].map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
            </>
          )}
          {kind === "remediation" && (
            <>
              {["action", "reassessment", "due_date"].map((key) => (
                <label key={key} className="block font-medium capitalize">
                  {key.replaceAll("_", " ")}
                  <input
                    name={key}
                    type={key === "due_date" ? "date" : "text"}
                    className={control}
                    defaultValue={String(existing?.data[key] || "")}
                    required
                  />
                </label>
              ))}
            </>
          )}
          {kind === "certificate" && (
            <>
              {["certificate_number", "issued_date", "reviewer"].map((key) => (
                <label key={key} className="block font-medium capitalize">
                  {key.replaceAll("_", " ")}
                  <input
                    className={control}
                    name={key}
                    type={key === "issued_date" ? "date" : "text"}
                    defaultValue={String(existing?.data[key] || "")}
                    required
                  />
                </label>
              ))}
              <p className="text-sm">
                Issue only after staff-confirmed completion. This records
                educational completion, not ordination or a ministry office.
              </p>
            </>
          )}
          <label className="block font-medium">
            {kind === "completion"
              ? "Authorized completion review"
              : [
                    "reference",
                    "admission_review",
                    "readiness",
                    "case_note",
                  ].includes(kind)
                ? "Restricted staff notes"
                : "Notes visible to this student"}
            <textarea
              name={kind === "completion" ? "review" : "notes"}
              rows={5}
              className={control}
              defaultValue={String(
                existing?.data.review || existing?.data.notes || "",
              )}
              required
            />
          </label>
          <label className="block font-medium">
            Record status
            <select
              name="status"
              className={control}
              defaultValue={existing?.status || "draft"}
            >
              {[
                "draft",
                "submitted",
                "revision_required",
                "complete",
                "open",
                "closed",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          {kind === "completion" && (
            <p className="rounded-lg border p-4 text-sm">
              Choosing Complete confirms program completion after your review.
              Missing manuals, exams, and practicum materials are not
              automatically marked as completed.
            </p>
          )}
          <button className={button}>Save school record</button>
        </form>
      )}
      <p role="status" className="mt-4">
        {status}
      </p>
      <a
        className="mt-4 inline-flex min-h-11 items-center text-primary underline"
        href={`/api/ministry/export?school=${encodeURIComponent(offering)}&student=${encodeURIComponent(userId)}`}
      >
        Export student academic responses
      </a>
    </section>
  );
}
export function CourseEditor({ offering }: { offering: string }) {
  const { catalog, reload, error } = useCatalog();
  const [id, setId] = useState(""),
    [detail, setDetail] = useState<UnitDetail>(),
    [preview, setPreview] = useState<UnitDetail>(),
    [status, setStatus] = useState(""),
    [reconciled, setReconciled] = useState(false);
  const units =
    catalog?.units.filter(
      (u) => u.offering_id === offering && u.kind !== "application",
    ) || [];
  useEffect(() => {
    setDetail(undefined);
    setPreview(undefined);
    setReconciled(false);
    if (id)
      void getUnit(id, true)
        .then(setDetail)
        .catch((e) => setStatus(e.message));
  }, [id]);
  const update = (key: string, value: unknown) =>
    setDetail(detail ? { ...detail, [key]: value } : undefined);
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-serif text-2xl">
        Imported curriculum and workbook editor
      </h2>
      <p className="mt-3">
        Review available source material, resolve held chapters, and prepare
        missing instructions. Save and preview a draft before publishing.
        Student submissions keep their original question version.
      </p>
      {error && <p role="alert">{error}</p>}
      <p className="mt-3 text-sm">
        {units.filter((u) => u.state === "available").length} available units ·{" "}
        {units.filter((u) => u.state === "review_required").length} awaiting
        reconciliation · {units.filter((u) => u.state === "missing").length}{" "}
        missing material
      </p>
      <LibraryPublisher
        documents={
          catalog?.documents.filter((d) => d.offering_id === offering) || []
        }
        reload={reload}
      />
      <label className="mt-4 block font-medium">
        Learning unit
        <select
          className={control}
          value={id}
          onChange={(e) => setId(e.target.value)}
        >
          <option value="">Choose a chapter, week, or practicum</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.title} · {u.state}
            </option>
          ))}
        </select>
      </label>
      {detail && (
        <div className="mt-5 space-y-5">
          <label className="block font-medium">
            Unit title
            <input
              className={control}
              value={detail.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </label>
          <label className="block font-medium">
            Reading material
            <textarea
              className={control}
              rows={8}
              value={detail.reading}
              onChange={(e) => update("reading", e.target.value)}
            />
          </label>
          <label className="block font-medium">
            Workbook instructions
            <textarea
              className={control}
              rows={6}
              value={detail.instructions}
              onChange={(e) => update("instructions", e.target.value)}
            />
          </label>
          {detail.fields.map((f, index) => (
            <div className="rounded-lg border p-4" key={f.id}>
              <label className="block font-medium">
                Question {index + 1}
                <textarea
                  className={control}
                  rows={3}
                  value={f.label}
                  onChange={(e) =>
                    update(
                      "fields",
                      detail.fields.map((v, i) =>
                        i === index ? { ...v, label: e.target.value } : v,
                      ),
                    )
                  }
                />
              </label>
              <label className="mt-3 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!f.required}
                  onChange={(e) =>
                    update(
                      "fields",
                      detail.fields.map((v, i) =>
                        i === index ? { ...v, required: e.target.checked } : v,
                      ),
                    )
                  }
                />
                Required response
              </label>
              <button
                className="mt-2 min-h-11 text-destructive underline"
                onClick={() =>
                  update(
                    "fields",
                    detail.fields.filter((_, i) => i !== index),
                  )
                }
              >
                Remove question {index + 1}
              </button>
            </div>
          ))}
          <button
            className={button}
            onClick={() =>
              update("fields", [
                ...detail.fields,
                {
                  id: `q-${crypto.randomUUID()}`,
                  label: "",
                  type: "written",
                  required: false,
                } satisfies WorkbookField,
              ])
            }
          >
            Add question
          </button>
          <div className="flex flex-wrap gap-3">
            <button
              className={button}
              onClick={async () => {
                try {
                  await courseCommand("unit_save_draft", {
                    unit_id: detail.id,
                    data: {
                      title: detail.title,
                      reading: detail.reading,
                      instructions: detail.instructions,
                      fields: detail.fields,
                    },
                  });
                  setPreview(undefined);
                  setStatus("Draft saved. Preview before publishing.");
                } catch (e) {
                  setStatus((e as Error).message);
                }
              }}
            >
              Save workbook draft
            </button>
            <button
              className={button}
              onClick={async () => {
                try {
                  setPreview(await getUnit(id, true));
                  setStatus("Previewing the saved draft.");
                } catch (e) {
                  setStatus((e as Error).message);
                }
              }}
            >
              Preview saved workbook
            </button>
          </div>
          {detail.state === "review_required" && (
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={reconciled}
                onChange={(e) => setReconciled(e.target.checked)}
              />
              I have reconciled this workbook section against the controlling
              manual.
            </label>
          )}
          {preview && (
            <article className="rounded-lg border p-4">
              <h3 className="font-serif text-xl">{preview.title}</h3>
              <p className="my-4 whitespace-pre-wrap">{preview.instructions}</p>
              <AnswerFields
                fields={preview.fields}
                answers={{}}
                disabled
                onChange={() => undefined}
              />
              <button
                className={button}
                onClick={async () => {
                  try {
                    await courseCommand("unit_publish", {
                      unit_id: id,
                      reconciled,
                    });
                    setStatus("Workbook published.");
                    setPreview(undefined);
                    setDetail(await getUnit(id));
                    await reload();
                  } catch (e) {
                    setStatus((e as Error).message);
                  }
                }}
              >
                Publish saved workbook
              </button>
            </article>
          )}
        </div>
      )}
      <p role="status" className="mt-4">
        {status}
      </p>
    </section>
  );
}
