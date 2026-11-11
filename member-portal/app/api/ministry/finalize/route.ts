import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    return Response.json(
      { error: "School configuration unavailable" },
      { status: 503 },
    );
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.rpc("ministry_finalize_exams");
  if (error) {
    console.error("School examination finalization failed", error.code);
    return Response.json({ error: "Finalization failed" }, { status: 503 });
  }
  return Response.json(
    { finalized: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
