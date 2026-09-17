import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmissionDetail } from "@/components/youth-forms/submission-detail";
import { formSession, assertId } from "@/lib/youth-forms/server";
import type { Submission } from "@/lib/youth-forms/schema";

export const dynamic = "force-dynamic";
export default async function SignedFormPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  try { assertId(submissionId); } catch { notFound(); }
  const { supabase, user } = await formSession();
  const { data, error } = await supabase.from("youth_form_submissions").select("*").eq("id", submissionId).eq("guardian_id", user.id).single();
  if (error || !data) notFound();
  return <div className="mx-auto max-w-3xl space-y-6"><Link href="/member/youth/forms" className="text-sm text-primary underline">← Your children&apos;s forms</Link><SubmissionDetail submission={data as Submission} /></div>;
}
