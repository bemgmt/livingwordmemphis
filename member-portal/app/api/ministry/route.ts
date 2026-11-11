import {
  ministrySession,
  ministryHeaders as headers,
} from "@/lib/ministry/server";
import { validateCurriculumFile } from "@/lib/youth-curriculum";
export const dynamic = "force-dynamic";
const fail = (error: string, status: number) =>
  Response.json({ error }, { status, headers });

export async function GET(request: Request) {
  const session = await ministrySession();
  if (!session) return fail("Sign in to continue.", 401);
  const { supabase, user } = session;
  const keyId = new URL(request.url).searchParams.get("answerKey");
  if (keyId) {
    const r = await supabase.rpc("ministry_exam_key", { assessment: keyId });
    if (r.error) return fail("Assigned instructor access required.", 403);
    return Response.json(r.data, { headers });
  }
  const finalized = await supabase.rpc("ministry_finalize_exams");
  if (finalized.error)
    return fail(
      "The school is not available yet. Please contact the church or retry shortly.",
      503,
    );
  const names = [
    "offerings",
    "enrollments",
    "instructors",
    "content",
    "work",
    "grades",
    "attendance",
    "progress",
    "ledger",
    "resources",
    "recommendations",
  ] as const;
  const rows = await Promise.all(
    names.map(async (name) => {
      const all: unknown[] = [];
      for (let start = 0; ; start += 1000) {
        const r = await supabase
          .from(`som_${name}`)
          .select("*")
          .range(start, start + 999);
        if (r.error) throw r.error;
        all.push(...r.data);
        if (r.data.length < 1000) break;
      }
      return [name, all];
    }),
  ).catch(() => null);
  const [identity, people] = await Promise.all([
    supabase.rpc("ministry_identity"),
    supabase.rpc("ministry_roster"),
  ]);
  if (!rows || identity.error || people.error)
    return fail("Unable to load the school. Please retry.", 503);
  return Response.json(
    {
      ...Object.fromEntries(rows),
      ...identity.data,
      userId: user.id,
      people: people.data,
    },
    { headers },
  );
}

export async function POST(request: Request) {
  const session = await ministrySession();
  if (!session) return fail("Sign in to continue.", 401);
  // Next's internal request URL may use localhost behind a proxy. Compare the
  // browser origin to the actual Host header, including its port.
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get("host"))
        return fail("Invalid request origin.", 403);
    } catch {
      return fail("Invalid request origin.", 403);
    }
  }
  try {
    const raw = await request.text();
    if (raw.length > 250000) return fail("Request is too large.", 413);
    const { action, payload = {} } = JSON.parse(raw);
    if (
      typeof action !== "string" ||
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    )
      return fail("Invalid request.", 400);
    if (action === "prepare_upload") {
      const v = validateCurriculumFile({
        filename: payload.filename,
        contentType: payload.mime,
        size: payload.size,
      });
      if (!v.ok) return fail(v.error, 400);
      payload.mime = v.contentType;
    }
    if (action === "finish_upload") {
      const { data: r } = await session.supabase
        .from("som_resources")
        .select("*")
        .eq("id", payload.id)
        .single();
      if (!r) return fail("File not found.", 404);
      const file = await session.supabase.storage.from(r.bucket).info(r.path);
      if (
        file.error ||
        file.data.size !== r.size ||
        file.data.contentType !== r.mime
      )
        return fail(
          "The uploaded file could not be verified. Retry after the upload completes.",
          409,
        );
    }
    const { data, error } = await session.supabase.rpc("ministry_command", {
      action,
      payload,
    });
    if (error) return fail(error.message, 400);
    if (action === "prepare_upload") {
      const upload = await session.supabase.storage
        .from(data.bucket)
        .createSignedUploadUrl(data.path);
      if (upload.error)
        return fail("The file upload could not be started. Please retry.", 503);
      return Response.json({ ...data, token: upload.data.token }, { headers });
    }
    return Response.json(data, { headers });
  } catch {
    return fail(
      "The request could not be completed. Please check your details and retry.",
      400,
    );
  }
}
