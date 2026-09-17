"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FIRST_SCHOOL_MONTH, SCHOOL_CLASSES, SUNDAY_SCHOOL_BUCKET, sundayDates, lessonDateLabel, validateLesson } from "@/lib/sunday-school";
import { validateCurriculumFile } from "@/lib/youth-curriculum";

async function requestUpload(body: Record<string, unknown>) {
  const response = await fetch("/api/sunday-school/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Upload failed. Please try again.");
  return data;
}
export function CurriculumUpload() {
  const [month, setMonth] = useState(FIRST_SCHOOL_MONTH);
  const [date, setDate] = useState(sundayDates(FIRST_SCHOOL_MONTH)[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [publishTicket, setPublishTicket] = useState<string | null>(null);
  const router = useRouter();
  async function publish(ticket: string) {
    await requestUpload({ step: "publish", ticket });
    setPublishTicket(null);
    router.push("/member/sunday-school"); router.refresh();
  }
  const inputClass = "mt-2 min-h-11 w-full min-w-0 rounded-md border bg-background px-3 text-base";
  return <form className="space-y-5 rounded-xl border bg-card p-5" onSubmit={async event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      if (publishTicket) { setStatus("Publishing curriculum…"); await publish(publishTicket); return; }
      const lesson = validateLesson(Object.fromEntries(data));
      const file = data.get("file");
      if (!(file instanceof File)) throw new Error("Choose a curriculum file.");
      const validation = validateCurriculumFile({ filename: file.name, contentType: file.type, size: file.size });
      if (!validation.ok) throw new Error(validation.error);
      setStatus("Preparing upload…");
      const prepared = await requestUpload({ step: "prepare", ...lesson, filename: file.name, contentType: validation.contentType, size: file.size });
      setStatus("Uploading file… Please keep this page open.");
      const { error: storageError } = await createClient().storage.from(SUNDAY_SCHOOL_BUCKET).uploadToSignedUrl(prepared.storagePath, prepared.token, file, { contentType: prepared.contentType });
      if (storageError) throw new Error("The file upload did not finish. Please try again.");
      setPublishTicket(prepared.ticket);
      setStatus("Publishing curriculum…");
      await publish(prepared.ticket);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to upload. Please try again."); setStatus(""); }
    finally { setBusy(false); }
  }}>
    <fieldset disabled={busy || !!publishTicket} className="space-y-5">
      <div><label htmlFor="title" className="text-sm font-medium">Lesson title *</label><input id="title" name="title" required maxLength={160} className={inputClass} /></div>
      <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="month" className="text-sm font-medium">Month *</label><input id="month" name="month" type="month" min={FIRST_SCHOOL_MONTH} max="2099-12" value={month} required onChange={e => { setMonth(e.target.value); setDate(sundayDates(e.target.value)[0] ?? ""); }} className={inputClass} /></div>
      <div><label htmlFor="classGroup" className="text-sm font-medium">Class *</label><select id="classGroup" name="classGroup" className={inputClass} required>{SCHOOL_CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div></div>
      <div><label htmlFor="lessonDate" className="text-sm font-medium">Sunday lesson *</label><select id="lessonDate" name="lessonDate" required value={date} onChange={e => setDate(e.target.value)} className={inputClass}><option value="">Choose a Sunday</option>{sundayDates(month).map((day, i) => <option key={day} value={day}>Week {i + 1} · {lessonDateLabel(day)}</option>)}</select></div>
      <div><label htmlFor="description" className="text-sm font-medium">Description (optional)</label><textarea id="description" name="description" rows={3} maxLength={2000} className="mt-2 w-full rounded-md border bg-background p-3" /></div>
      <div><label htmlFor="file" className="text-sm font-medium">Curriculum file *</label><input id="file" name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4" required className="mt-2 block w-full min-w-0 text-sm file:mr-3 file:min-h-11 file:rounded-md file:border file:bg-secondary file:px-3" /><p className="mt-2 text-xs text-muted-foreground">PDF, Word, PowerPoint, or MP4. Maximum 50 MB. Upload additional files separately for the same Sunday.</p></div>
    </fieldset>
    {error && <p role="alert" className="break-words rounded-md border border-destructive p-3 text-sm text-destructive">{error}</p>}
    {publishTicket && !busy && <p className="text-sm">Your file is saved. Retry publishing to add it to the curriculum list. Keep this page open until it finishes.</p>}
    {status && <p role="status" className="text-sm text-muted-foreground">{status}</p>}
    <Button type="submit" disabled={busy}>{busy ? "Please wait…" : publishTicket ? "Retry publishing" : "Upload & publish"}</Button>
    {publishTicket && !busy && <Button className="ml-3" type="button" variant="outline" onClick={() => { setPublishTicket(null); setError(""); }}>Start a new upload</Button>}
  </form>;
}
