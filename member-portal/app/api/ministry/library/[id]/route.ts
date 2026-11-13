import {
  ministrySession,
  ministryHeaders as headers,
} from "@/lib/ministry/server";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await ministrySession();
  if (!session)
    return Response.json(
      { error: "Sign in to continue." },
      { status: 401, headers },
    );
  const { id } = await params;
  const draft = new URL(_request.url).searchParams.has("draft");
  const r = await session.supabase.rpc(
    draft ? "ministry_library_upload" : "ministry_library_file",
    draft ? { upload: id } : { document: id },
  );
  if (r.error || !r.data)
    return Response.json(
      { error: "Document unavailable or being prepared." },
      { status: 404, headers },
    );
  const signed = await session.supabase.storage
    .from(r.data.bucket)
    .createSignedUrl(r.data.path, 60, {
      download: new URL(_request.url).searchParams.has("download")
        ? r.data.filename
        : undefined,
    });
  if (signed.error)
    return Response.json(
      { error: "The document could not be opened. Please retry." },
      { status: 503, headers },
    );
  return Response.redirect(signed.data.signedUrl, 302);
}
