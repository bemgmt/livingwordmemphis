import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are a biblical study assistant for Living Word Memphis, a church community. Your role is to help members explore and understand the Bible, theology, church history, and practical Christian living.

Guidelines:
- Ground your answers in Scripture whenever possible, citing book, chapter, and verse.
- Present multiple denominational perspectives when a topic is debated, but note the church's teaching where applicable.
- Be encouraging, pastoral, and accessible in tone.
- If you're unsure about something, say so rather than guessing.
- Do not provide medical, legal, or financial advice.
- Keep responses focused on biblical studies and Christian education.

When additional church-provided knowledge base context is available below, use it to inform your responses:
`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Study assistant is not configured." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { messages, sessionId } = body as {
    messages: { role: "user" | "assistant"; content: string }[];
    sessionId?: string;
  };

  if (!messages?.length) {
    return NextResponse.json(
      { error: "No messages provided." },
      { status: 400 },
    );
  }

  let knowledgeContext = "";
  try {
    const { data: articles } = await supabase
      .from("study_knowledge_base_cache")
      .select("title, content_text")
      .limit(20);

    if (!articles || articles.length === 0) {
      // Knowledge base cache doesn't exist yet -- that's fine
    } else {
      knowledgeContext = articles
        .map(
          (a: { title: string; content_text: string }) =>
            `### ${a.title}\n${a.content_text}`,
        )
        .join("\n\n");
    }
  } catch {
    // Table may not exist yet; continue without KB context
  }

  const systemMessage = knowledgeContext
    ? `${SYSTEM_PROMPT}\n\n--- KNOWLEDGE BASE ---\n${knowledgeContext}`
    : SYSTEM_PROMPT;

  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemMessage },
      ...messages.slice(-20),
    ],
    max_tokens: 2048,
  });

  const reply = completion.choices[0]?.message?.content ?? "";

  if (sessionId) {
    const userMsg = messages[messages.length - 1];
    await supabase.from("study_messages").insert([
      { session_id: sessionId, role: "user", content: userMsg.content },
      { session_id: sessionId, role: "assistant", content: reply },
    ]);
    await supabase
      .from("study_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId);
  }

  return NextResponse.json({ reply });
}
