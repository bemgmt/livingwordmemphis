import {
  ministrySession,
  ministryHeaders as headers,
} from "@/lib/ministry/server";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await ministrySession();
  if (!s)
    return Response.json(
      { error: "Sign in to download." },
      { status: 401, headers },
    );
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return Response.json({ error: "Not found." }, { status: 404, headers });
  const { data: r } = await s.supabase
    .from("som_resources")
    .select("*")
    .eq("id", id)
    .eq("ready", true)
    .single();
  if (!r)
    return Response.json({ error: "Not found." }, { status: 404, headers });
  const { data, error } = await s.supabase.storage
    .from(r.bucket)
    .createSignedUrl(r.path.split("#ref-")[0], 60, { download: r.filename });
  if (error)
    return Response.json(
      { error: "Download unavailable. Please retry." },
      { status: 503, headers },
    );
  return new Response(null, {
    status: 302,
    headers: { ...headers, Location: data.signedUrl },
  });
}
