import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const API_BIBLE_BASE = "https://api.scripture.api.bible/v1";

const ALLOWED_PATH_PATTERNS = [
  /^\/bibles\/[^/]+\/books$/,
  /^\/bibles\/[^/]+\/books\/[^/]+\/chapters$/,
  /^\/bibles\/[^/]+\/chapters\/[^/]+$/,
  /^\/bibles\/[^/]+\/search$/,
];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.API_BIBLE_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Bible API is not configured." },
      { status: 503 },
    );
  }

  const rawPath = request.nextUrl.searchParams.get("path");
  if (!rawPath) {
    return NextResponse.json(
      { error: 'Missing "path" query parameter.' },
      { status: 400 },
    );
  }

  const [pathOnly] = rawPath.split("?");
  if (!ALLOWED_PATH_PATTERNS.some((re) => re.test(pathOnly))) {
    return NextResponse.json(
      { error: "Requested Bible API path is not allowed." },
      { status: 403 },
    );
  }

  const url = `${API_BIBLE_BASE}${rawPath}`;

  const res = await fetch(url, {
    headers: { "api-key": apiKey },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `API.Bible returned ${res.status}` },
      { status: res.status },
    );
  }

  const json = await res.json();
  return NextResponse.json(json);
}
