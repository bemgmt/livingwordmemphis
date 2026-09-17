import { sundaySchoolSession } from "@/lib/auth/sunday-school";
import { sanityWriteClient } from "@/lib/sanity/client";
import { SUNDAY_SCHOOL_BUCKET } from "@/lib/sunday-school";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
export async function GET(_request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const session = await sundaySchoolSession();
  if (!session) return Response.json({ error: "Sign in to download curriculum." }, { status: 401, headers });
  const { documentId } = await params;
  if (!/^[a-zA-Z0-9_-][a-zA-Z0-9._-]{0,199}$/.test(documentId) || documentId.startsWith("drafts.")) return Response.json({ error: "Not found." }, { status: 404, headers });
  try {
    const file = await sanityWriteClient.fetch<{ storagePath: string; originalFilename: string } | null>(
      `*[_type == "sundaySchoolLesson" && _id == $id && !(_id in path("drafts.**"))][0].protectedFile`,
      { id: documentId }, { cache: "no-store", perspective: "published" },
    );
    if (!file?.storagePath || file.storagePath.includes("..") || file.storagePath.startsWith("/")) return Response.json({ error: "Not found." }, { status: 404, headers });
    const { data, error } = await session.supabase.storage.from(SUNDAY_SCHOOL_BUCKET).createSignedUrl(file.storagePath, 60, { download: file.originalFilename || true });
    if (error || !data) return Response.json({ error: "Download unavailable. Please try again." }, { status: 503, headers });
    return new Response(null, { status: 302, headers: { ...headers, Location: data.signedUrl } });
  } catch { return Response.json({ error: "Curriculum is temporarily unavailable." }, { status: 503, headers }); }
}
