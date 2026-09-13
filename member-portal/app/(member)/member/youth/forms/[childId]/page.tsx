import Link from "next/link";
import { notFound } from "next/navigation";
import { GuardianForm } from "@/components/youth-forms/guardian-form";
import { formSession, assertId } from "@/lib/youth-forms/server";
import type { Child } from "@/lib/youth-forms/schema";

export const dynamic = "force-dynamic";
export default async function ChildFormPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  try { assertId(childId); } catch { notFound(); }
  const { supabase, user } = await formSession();
  const { data, error } = await supabase.from("youth_children").select("*").eq("id", childId).eq("guardian_id", user.id).single();
  if (error || !data) notFound();
  return <div className="mx-auto max-w-3xl space-y-6">
    <Link className="text-sm text-primary underline" href="/member/youth/forms">← Your children&apos;s forms</Link>
    <header><h1 className="font-serif text-3xl">Nursery registration</h1><p className="mt-2 text-muted-foreground">Child information, care instructions, and guardian acknowledgment.</p></header>
    <GuardianForm key={data.id} child={data as Child} />
  </div>;
}
