import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { archiveAdmin, assertId } from "@/lib/youth-forms/server";
import { SubmissionDetail } from "@/components/youth-forms/submission-detail";
import type { Submission } from "@/lib/youth-forms/schema";

export const dynamic = "force-dynamic";
export default async function AdminSignedFormPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const session = await archiveAdmin().catch(() => null);
  if (!session) redirect("/member/dashboard");
  const { submissionId } = await params;
  try { assertId(submissionId); } catch { notFound(); }
  const { data, error } = await session.supabase.from("youth_form_submissions").select("*").eq("id", submissionId).single();
  if (error || !data) notFound();
  return <div className="mx-auto max-w-3xl space-y-6"><Link href="/admin/youth-forms" className="text-sm text-primary underline">← Youth form archives</Link><SubmissionDetail submission={data as Submission} /></div>;
}
