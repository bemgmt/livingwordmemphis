import Link from "next/link";
import { redirect } from "next/navigation";
import { archiveAdmin } from "@/lib/youth-forms/server";
import { childStatus, type Child, type Submission } from "@/lib/youth-forms/schema";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 50;
export default async function YouthArchivePage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const session = await archiveAdmin().catch(() => null);
  if (!session) redirect("/member/dashboard");
  const search = await searchParams;
  const q = (search.q ?? "").trim().slice(0, 100).replace(/[%_\\]/g, "");
  const page = Math.max(1, Math.min(10000, Math.floor(Number(search.page) || 1)));
  let query = session.supabase.from("youth_children").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (q) query = query.ilike("display_name", `%${q}%`);
  const { data, count, error } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) return <p role="alert">Youth archives are temporarily unavailable. Please try again later.</p>;
  const children = data as Child[];
  const result = children.length ? await session.supabase.from("youth_form_submissions").select("id,child_id,revision,status,signed_at").in("child_id", children.map(c => c.id)).order("signed_at", { ascending: false }) : { data: [], error: null };
  if (result.error) return <p role="alert">Unable to load completion records. Please try again later.</p>;
  const submissions = result.data as Submission[];
  return <div className="mx-auto max-w-5xl space-y-6">
    <header><h1 className="font-serif text-3xl">Youth form archives</h1><p className="mt-3 text-muted-foreground">Nursery registration, signed copies, and revision history.</p><p className="mt-2 text-sm text-muted-foreground">This roster includes children added by their guardians. Families who have not added a child are not yet represented.</p></header>
    <form className="flex flex-wrap items-end gap-3"><div className="min-w-0 flex-1"><label htmlFor="q" className="mb-2 block text-sm font-medium">Search child name</label><input id="q" name="q" defaultValue={q} maxLength={100} className="min-h-11 w-full rounded-md border bg-card px-3" /></div><button className="min-h-11 rounded-md bg-primary px-4 text-sm text-primary-foreground">Search</button></form>
    <p className="text-sm text-muted-foreground">{count ?? 0} children{q ? " matching this search" : " registered"}. Showing up to {PAGE_SIZE} per page.</p>
    {children.length === 0 && <p>No children found.</p>}
    <div className="space-y-4">{children.map(child => <section key={child.id} className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap justify-between gap-3"><h2 className="break-words text-lg font-semibold">{child.display_name}</h2><span className="rounded-full bg-secondary px-3 py-1 text-sm">{childStatus(child, submissions)}</span></div>
      <p className="mt-2 break-all text-xs text-muted-foreground">Guardian account: {child.guardian_id}</p>
      <ul className="mt-3 space-y-2">{submissions.filter(s => s.child_id === child.id).map(s => <li key={s.id}><Link className="inline-flex min-h-11 items-center text-sm text-primary underline" href={`/admin/youth-forms/${s.id}`}>Revision {s.revision} · {new Date(s.signed_at).toLocaleDateString("en-US", { timeZone: "America/Chicago" })} · {s.status === "completed" ? "View signed copy" : "Archive pending — retry"}</Link></li>)}</ul>
      {!submissions.some(s => s.child_id === child.id) && <p className="mt-3 text-sm text-muted-foreground">No signed submission yet.</p>}
    </section>)}</div>
    <nav aria-label="Archive pages" className="flex gap-6 text-primary underline">{page > 1 && <Link href={`?q=${encodeURIComponent(q)}&page=${page - 1}`}>Previous</Link>}{page * PAGE_SIZE < (count ?? 0) && <Link href={`?q=${encodeURIComponent(q)}&page=${page + 1}`}>Next</Link>}</nav>
  </div>;
}
