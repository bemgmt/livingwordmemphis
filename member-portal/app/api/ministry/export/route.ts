import {
  ministrySession,
  ministryHeaders as headers,
} from "@/lib/ministry/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const session = await ministrySession();
  if (!session)
    return Response.json(
      { error: "Sign in to continue." },
      { status: 401, headers },
    );
  const q = new URL(request.url).searchParams,
    school = q.get("school"),
    student = q.get("student") || session.user.id;
  if (!school || !/^[0-9a-f-]{36}$/i.test(student))
    return Response.json(
      { error: "Choose a school and student." },
      { status: 400, headers },
    );
  const identity = await session.supabase.rpc("ministry_identity");
  if (!identity.data?.admin && student !== session.user.id) {
    const role = await session.supabase
      .from("som_instructors")
      .select("user_id")
      .eq("offering_id", school)
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (!role.data)
      return Response.json(
        { error: "Assigned instructor access required." },
        { status: 403, headers },
      );
  }
  const r = await session.supabase
    .from("som_work")
    .select(
      "id,assessment_id,user_id,attempt,status,answers,response,saved_at,submitted_at,late,assessment_snapshot,som_grades(score,feedback,released,completion_status)",
    )
    .eq("offering_id", school)
    .eq("user_id", student)
    .order("saved_at");
  if (r.error)
    return Response.json(
      { error: "Academic export unavailable." },
      { status: 503, headers },
    );
  return Response.json(
    {
      school,
      student,
      exported_at: new Date().toISOString(),
      submissions: r.data,
    },
    {
      headers: {
        ...headers,
        "Content-Disposition": 'attachment; filename="academic-responses.json"',
      },
    },
  );
}
