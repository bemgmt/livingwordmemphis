/**
 * DEPRECATED: This API route proxied requests to the external API.Bible service.
 * Bible content is now stored locally in Supabase (bible_translations, bible_books,
 * bible_verses) and accessed via server actions in app/(member)/member/bible/actions.ts.
 *
 * This route is kept as a stub that returns a 410 Gone response.
 * It can be safely deleted once all references are confirmed removed.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "This endpoint has been deprecated. Bible content is now served from the local database.",
    },
    { status: 410 },
  );
}
