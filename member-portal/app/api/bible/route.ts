import { NextRequest, NextResponse } from "next/server";

const API_BIBLE_BASE = "https://api.scripture.api.bible/v1";

export async function GET(request: NextRequest) {
  const apiKey = process.env.API_BIBLE_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Bible API is not configured." },
      { status: 503 },
    );
  }

  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json(
      { error: 'Missing "path" query parameter.' },
      { status: 400 },
    );
  }

  const url = `${API_BIBLE_BASE}${path}`;

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
