import { AnswerReview } from "./answer-review";
import { RetryArchiveButton } from "./retry-button";
import type { Submission } from "@/lib/youth-forms/schema";

export function SubmissionDetail({ submission: s }: { submission: Submission }) {
  return <div className="space-y-6">
    <section className="space-y-3 rounded-xl border bg-card p-5">
      <h1 className="font-serif text-3xl">{s.status === "completed" ? "Signed copy archived" : "Signature saved · archive pending"}</h1>
      <p className="text-sm text-muted-foreground">{s.status === "completed" ? "Your completed questionnaire and waiver have been saved. Download a copy for your records." : "Your answers and signature are saved. The PDF still needs to finish archiving. Retry below; you do not need to sign again."}</p>
      <p className="text-sm">Signed by {s.signature_name} · {new Date(s.signed_at).toLocaleString("en-US", { timeZone: "America/Chicago", timeZoneName: "short" })}</p>
      {s.status === "completed" ? <a href={`/api/youth/forms/${s.id}/pdf`} className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Download signed PDF</a> : <RetryArchiveButton id={s.id} />}
    </section>
    <div className="rounded-xl border bg-card p-5"><AnswerReview answers={s.answers} sections={s.terms.sections} /></div>
    <section className="space-y-3 rounded-xl border bg-card p-5"><h2 className="text-xl font-semibold">Terms accepted at signing</h2><h3 className="font-semibold">Nursery Rules & Expectations</h3><ul className="list-disc space-y-2 pl-5 text-sm">{s.terms.rules.map(rule => <li key={rule}>{rule}</li>)}</ul><h3 className="font-semibold">Liability Waiver & Release</h3>{s.terms.waiver.map(p => <p key={p} className="text-sm leading-relaxed">{p}</p>)}<p className="text-sm">{s.terms.acknowledgment}</p><p className="text-sm">{s.terms.electronicConsent}</p></section>
    <details className="rounded-xl border p-5 text-sm"><summary className="cursor-pointer font-medium">Signing record</summary><dl className="mt-4 space-y-2 break-words"><div><dt className="text-muted-foreground">Submission ID</dt><dd>{s.id}</dd></div><div><dt className="text-muted-foreground">Verified account email</dt><dd>{s.signer_email}</dd></div><div><dt className="text-muted-foreground">Form version / revision</dt><dd>{s.form_version} / {s.revision}</dd></div><div><dt className="text-muted-foreground">Signature method</dt><dd>Typed full name with affirmative electronic consent</dd></div>{s.pdf_sha256 && <div><dt className="text-muted-foreground">PDF SHA-256 checksum</dt><dd className="break-all font-mono text-xs">{s.pdf_sha256}</dd></div>}</dl></details>
  </div>;
}
