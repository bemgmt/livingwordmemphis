import { userHasYouthAccess } from "@/lib/auth/youth";
import { sanityClient } from "@/lib/sanity/client";
import { createClient } from "@/lib/supabase/server";
import { YOUTH_CURRICULUM_BUCKET } from "@/lib/youth-curriculum";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProtectedFile = {
  storagePath: string;
  originalFilename: string;
};

const protectedFileQuery = `*[
  _type == "youthMinistryDocument" && _id == $documentId
][0]{ protectedFile { storagePath, originalFilename } }.protectedFile`;

function jsonError(error: string, status: number) {
  return Response.json(
    { error },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return jsonError("Authentication required.", 401);
  if (!(await userHasYouthAccess(supabase, user.id))) {
    return jsonError("You do not have access to youth curriculum.", 403);
  }

  const protectedFile = await sanityClient.fetch<ProtectedFile | null>(
    protectedFileQuery,
    { documentId },
    { cache: "no-store" },
  );

  if (
    !protectedFile?.storagePath ||
    protectedFile.storagePath.startsWith("/") ||
    protectedFile.storagePath.includes("..")
  ) {
    return jsonError("Curriculum file not found.", 404);
  }

  const { data, error } = await supabase.storage
    .from(YOUTH_CURRICULUM_BUCKET)
    .createSignedUrl(protectedFile.storagePath, 60, {
      download: protectedFile.originalFilename || true,
    });

  if (error || !data?.signedUrl) {
    console.error("Unable to sign youth curriculum download", error);
    return jsonError("The curriculum file could not be opened.", 500);
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: data.signedUrl,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
