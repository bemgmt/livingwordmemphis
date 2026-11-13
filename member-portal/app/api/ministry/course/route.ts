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
  const params = new URL(request.url).searchParams;
  if(params.has("history")){
    const result=await session.supabase.rpc("ministry_record_versions",{record:params.get("history")});
    if(result.error)return Response.json({error:"Record history unavailable."},{status:404,headers});
    return Response.json(result.data,{headers});
  }
  if (params.has("unit")) {
    const r = await session.supabase.rpc("ministry_unit_detail", {
      unit: params.get("unit"),
      draft: params.get("draft") === "true",
    });
    if (r.error)
      return Response.json(
        { error: "This material is unavailable for your school or role." },
        { status: 404, headers },
      );
    return Response.json(r.data, { headers });
  }
  const load = async (table: string) => {
    const all: unknown[] = [];
    for (let start = 0; ; start += 1000) {
      const r = await session.supabase
        .from(table)
        .select("*")
        .range(start, start + 999);
      if (r.error) throw r.error;
      all.push(...r.data);
      if (r.data.length < 1000) break;
    }
    return all;
  };
  try {
    const [documents, units, records] = await Promise.all([
      load("som_library"),
      load("som_units"),
      load("som_records"),
    ]);
    return Response.json({ documents, units, records }, { headers });
  } catch {
    return Response.json(
      { error: "The course library could not be loaded. Please retry." },
      { status: 503, headers },
    );
  }
}
