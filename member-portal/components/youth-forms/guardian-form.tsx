"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveDraft, signForm } from "@/app/(member)/member/youth/forms/actions";
import { AnswerReview } from "./answer-review";
import { SECTIONS, TERMS, FORM_VERSION, normalizeAnswers, visible, type Answers, type Child } from "@/lib/youth-forms/schema";

export function GuardianForm({ child }: { child: Child }) {
  const [answers, setAnswers] = useState<Answers>({ childName: child.display_name, ...child.draft });
  const [revision, setRevision] = useState(child.revision);
  const [review, setReview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [signature, setSignature] = useState("");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change(key: string, value: string | string[]) {
    setAnswers(previous => ({ ...previous, [key]: value }));
    setDirty(true); setMessage(""); setConsent(false); setSignature("");
  }
  function save(toReview: boolean) {
    setError(""); setMessage("");
    start(async () => {
      try {
        const clean = normalizeAnswers(answers, toReview);
        const result = await saveDraft(child.id, revision, clean);
        if (result.error || result.revision === undefined) throw new Error(result.error || "Unable to save.");
        setAnswers(clean); setRevision(result.revision); setDirty(false);
        setMessage(toReview ? "Your answers are saved. Review them and the waiver before signing." : "Draft saved. You can return to this form later.");
        setReview(toReview);
        if (toReview) window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) { setError(error instanceof Error ? error.message : "Connection lost. Please try again."); }
    });
  }
  return <div className="space-y-6">
    <div className="rounded-xl bg-primary/5 p-4 text-sm">
      <p className="font-medium">{review ? "2. Review & sign" : "1. Child information"}</p>
      <p className="mt-1 text-muted-foreground">{review ? "Signing creates a permanent copy of these answers and terms." : "About 5 minutes. Required questions are marked *. Save a draft before leaving."}</p>
    </div>
    {message && <p role="status" className="rounded-lg border p-3 text-sm">{message}</p>}
    {error && <p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{error}</p>}
    {review ? <>
      <div className="rounded-xl border bg-card p-5"><AnswerReview answers={answers} /></div>
      <section className="space-y-4 rounded-xl border bg-card p-5" aria-labelledby="waiver-heading">
        <h2 id="waiver-heading" className="font-serif text-2xl">Nursery Rules & Liability Waiver</h2>
        <h3 className="font-semibold">Nursery Rules & Expectations</h3>
        <ul className="list-disc space-y-3 pl-5 text-sm">{TERMS.rules.map(rule => <li key={rule}>{rule}</li>)}</ul>
        <h3 className="font-semibold">Liability Waiver & Release</h3>
        {TERMS.waiver.map(paragraph => <p key={paragraph} className="text-sm leading-relaxed">{paragraph}</p>)}
        <h3 className="font-semibold">Parent/Guardian Acknowledgment</h3>
        <p className="text-sm">{TERMS.acknowledgment}</p>
      </section>
      <form className="rounded-xl border bg-card p-5" onSubmit={event => {
        event.preventDefault(); setError("");
        start(async () => {
          try {
            const result = await signForm(child.id, revision, signature, consent, FORM_VERSION);
            if (result.error) setError(result.error);
            else { router.push(`/member/youth/forms/submissions/${result.id}`); router.refresh(); }
          } catch { setError("Connection lost. Your signature may have been saved. Return to Youth Forms to check its status before trying again."); }
        });
      }}>
        <fieldset disabled={pending} className="space-y-4">
          <legend className="mb-3 text-lg font-semibold">Sign electronically</legend>
          <label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 size-5 shrink-0" />{TERMS.electronicConsent}</label>
          <label className="block text-sm font-medium" htmlFor="signature">Type your full name as your signature *</label>
          <input id="signature" required maxLength={200} value={signature} onChange={e => setSignature(e.target.value)} autoComplete="name" className="min-h-12 w-full rounded-md border bg-background px-3 font-serif text-xl" />
          <p className="text-xs text-muted-foreground">Use the same name entered in the guardian information. The signing date is recorded automatically.</p>
          <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={() => { setReview(false); setConsent(false); setSignature(""); setMessage(""); }}>Edit answers</Button><Button type="submit">{pending ? "Saving signed copy…" : "Sign & submit"}</Button></div>
        </fieldset>
      </form>
    </> : <form onSubmit={event => { event.preventDefault(); save(true); }}>
      <fieldset disabled={pending} className="space-y-6">
        {SECTIONS.map(section => <section key={section.title} className="space-y-5 rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          {section.fields.filter(field => visible(field, answers)).map(field => <div key={field.key}>
            {field.type === "multi" ? <fieldset><legend className="mb-2 text-sm font-medium">{field.label}</legend><div className="grid gap-2 sm:grid-cols-2">{field.options?.map(option => <label key={option} className="flex min-h-11 items-center gap-3 rounded-md border px-3 py-2 text-sm"><input type="checkbox" className="size-4" checked={Array.isArray(answers[field.key]) && answers[field.key].includes(option)} onChange={event => {
              const old = Array.isArray(answers[field.key]) ? answers[field.key] as string[] : [];
              change(field.key, event.target.checked ? [...old, option] : old.filter(v => v !== option));
            }} />{option}</label>)}</div></fieldset> : <>
              <label htmlFor={field.key} className="mb-2 block text-sm font-medium">{field.label}{field.required && " *"}</label>
              {field.type === "textarea" ? <textarea id={field.key} rows={3} required={field.required} maxLength={2000} value={String(answers[field.key] ?? "")} onChange={e => change(field.key, e.target.value)} className="w-full rounded-md border bg-background p-3" /> : field.type === "yesno" ? <select id={field.key} required={field.required} value={String(answers[field.key] ?? "")} onChange={e => change(field.key, e.target.value)} className="min-h-11 w-full rounded-md border bg-background px-3"><option value="">Select an answer</option><option>Yes</option><option>No</option></select> : <input id={field.key} type={field.type ?? "text"} required={field.required} maxLength={200} value={String(answers[field.key] ?? "")} onChange={e => change(field.key, e.target.value)} className="min-h-11 w-full min-w-0 rounded-md border bg-background px-3" />}
            </>}
            {field.hint && <p className="mt-2 text-xs text-muted-foreground">{field.hint}</p>}
          </div>)}
        </section>)}
        <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={() => save(false)}>Save draft</Button><Button type="submit">{pending ? "Saving…" : "Review & sign"}</Button></div>
      </fieldset>
    </form>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
