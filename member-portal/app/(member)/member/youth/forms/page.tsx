import Link from "next/link";
import { AddChild } from "@/components/youth-forms/add-child";
import { RetryArchiveButton } from "@/components/youth-forms/retry-button";
import { formSession } from "@/lib/youth-forms/server";
import { childStatus, type Child, type Submission } from "@/lib/youth-forms/schema";

export const dynamic = "force-dynamic";
export default async function YouthFormsPage() {
  const { supabase, user } = await formSession();
  const [childrenResult, submissionsResult] = await Promise.all([
    supabase.from("youth_children").select("*").eq("guardian_id", user.id).order("created_at"),
    supabase.from("youth_form_submissions").select("id,child_id,revision,status,signed_at").eq("guardian_id", user.id).order("signed_at", { ascending: false }),
  ]);
  if (childrenResult.error || submissionsResult.error) return <div className="rounded-xl border bg-card p-6"><h1 className="text-2xl font-semibold">Youth Forms</h1><p className="mt-3">Registration is temporarily unavailable. Please try again later or contact the church.</p></div>;
  const children = childrenResult.data as Child[];
  const submissions = submissionsResult.data as Submission[];
  return <div className="mx-auto max-w-3xl space-y-6">
    <header><p className="text-sm font-medium text-primary">Youth & families</p><h1 className="mt-1 font-serif text-3xl">Your children&apos;s forms</h1><p className="mt-3 text-muted-foreground">Complete a nursery questionnaire and waiver for each child. Your saved forms are private to your account and authorized archive administrators.</p></header>
    <p className="rounded-lg border p-3 text-sm">Available now: nursery registration. This form covers nursery care; it is not a waiver for older youth activities.</p>
    {children.length === 0 && <p className="text-sm text-muted-foreground">No children added yet. Start below.</p>}
    {children.map(child => {
      const history = submissions.filter(s => s.child_id === child.id);
      const status = childStatus(child, submissions);
      return <section key={child.id} className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="break-words text-xl font-semibold">{child.display_name}</h2><span className="rounded-full bg-secondary px-3 py-1 text-sm">{status}</span></div>
        <Link className="mt-4 inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4" href={`/member/youth/forms/${child.id}`}>{status === "Completed" ? "Update information & sign a new copy" : "Continue questionnaire"}</Link>
        {history.length > 0 && <details className="mt-4"><summary className="cursor-pointer py-2 text-sm font-medium">Signed copies & history ({history.length})</summary><ul className="mt-2 space-y-3">{history.map(s => <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm"><Link className="text-primary underline" href={`/member/youth/forms/submissions/${s.id}`}>Revision {s.revision} · {new Date(s.signed_at).toLocaleDateString("en-US", { timeZone: "America/Chicago" })} · {s.status === "completed" ? "Archived" : "Archive pending"}</Link>{s.status === "pending" && <RetryArchiveButton id={s.id} />}</li>)}</ul></details>}
      </section>;
    })}
    <AddChild />
  </div>;
}
