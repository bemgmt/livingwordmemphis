"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDelete } from "@/components/confirm-delete";

import {
  createStudySession,
  deleteStudySession,
  loadSessionMessages,
} from "./actions";

type Session = { id: string; title: string; updated_at: string };
type Message = { role: "user" | "assistant"; content: string };

export function StudyAssistant({
  sessions,
}: {
  sessions: Session[];
}) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  }, []);

  function handleNewSession() {
    startTransition(async () => {
      const res = await createStudySession("New Study");
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCurrentSessionId(res.sessionId);
      setMessages([]);
    });
  }

  function handleLoadSession(sessionId: string) {
    startTransition(async () => {
      const res = await loadSessionMessages(sessionId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCurrentSessionId(sessionId);
      setMessages(
        res.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      );
      scrollToBottom();
    });
  }

  function handleDeleteSession(sessionId: string) {
    startTransition(async () => {
      const res = await deleteStudySession(sessionId);
      if (!res.ok) toast.error(res.error);
      else {
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([]);
        }
        toast.success("Session deleted");
      }
    });
  }

  async function handleSend() {
    if (!input.trim() || loading) return;

    let sessionId = currentSessionId;

    if (!sessionId) {
      const res = await createStudySession(
        input.trim().slice(0, 60) || "New Study",
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      sessionId = res.sessionId;
      setCurrentSessionId(sessionId);
    }

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, sessionId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Request failed");
      }

      const data = await res.json();
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply },
      ]);
      scrollToBottom();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <Button
              size="sm"
              className="mb-2 w-full"
              onClick={handleNewSession}
              disabled={isPending}
            >
              New session
            </Button>
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-1"
              >
                <button
                  onClick={() => handleLoadSession(s.id)}
                  className={`flex-1 rounded px-2 py-1.5 text-left text-sm transition-colors ${
                    currentSessionId === s.id
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="line-clamp-1">{s.title}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    {new Date(s.updated_at).toLocaleDateString()}
                  </span>
                </button>
                <ConfirmDelete
                  onConfirm={() => handleDeleteSession(s.id)}
                  disabled={isPending}
                  title="Delete this study session?"
                  description="All messages in this session will be permanently removed."
                >
                  <button
                    className="px-1 text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                  >
                    &times;
                  </button>
                </ConfirmDelete>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="py-2 text-xs text-muted-foreground">
                No sessions yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card className="flex h-[600px] flex-col">
          <CardHeader className="shrink-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {currentSessionId ? "Chat" : "Start a new session to begin"}
            </CardTitle>
          </CardHeader>
          <CardContent
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-4"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-secondary px-4 py-2 text-sm text-muted-foreground">
                  Thinking…
                </div>
              </div>
            )}
            {messages.length === 0 && !loading && (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Ask a question about the Bible, theology, or church history.
                </p>
              </div>
            )}
          </CardContent>
          <div className="shrink-0 border-t border-border p-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask about a Bible passage, topic, or question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={2}
                className="resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                className="self-end"
                disabled={loading || !input.trim()}
                onClick={handleSend}
              >
                {loading ? "…" : "Send"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
