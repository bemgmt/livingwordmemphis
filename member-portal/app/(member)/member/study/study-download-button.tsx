"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { buildStudyExport } from "./download-study";

type Session = { id: string; title: string; updated_at: string };

export function StudyDownloadButton({ sessions }: { sessions: Session[] }) {
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"all" | "pick">("all");
  const [isPending, startTransition] = useTransition();

  function toggleSession(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(sessions.map((s) => s.id)));
  }

  function clearAll() {
    setSelectedIds(new Set());
  }

  function handleDownload() {
    startTransition(async () => {
      const sessionIds =
        mode === "pick" ? Array.from(selectedIds) : [];

      if (mode === "pick" && sessionIds.length === 0) {
        toast.error("Please select at least one session, or switch to All Sessions.");
        return;
      }

      const res = await buildStudyExport({
        sessionIds,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      // Trigger browser download
      const blob = new Blob([res.text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Study data downloaded!");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          ↓ Download my study data
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Download study data</DialogTitle>
          <DialogDescription>
            Export your notes, saved scriptures, and AI chat sessions as a
            plain-text file you can save on any device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Session scope */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Chat sessions to include</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("all")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  mode === "all"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                All sessions
              </button>
              <button
                onClick={() => setMode("pick")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  mode === "pick"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                Choose sessions
              </button>
            </div>

            {mode === "pick" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs text-primary hover:underline"
                  >
                    Select all
                  </button>
                  <span className="text-xs text-muted-foreground">·</span>
                  <button
                    onClick={clearAll}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Clear
                  </button>
                  {selectedIds.size > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {selectedIds.size} selected
                      </span>
                    </>
                  )}
                </div>
                <div className="max-h-52 overflow-y-auto rounded-lg border border-border">
                  {sessions.length === 0 && (
                    <p className="p-3 text-xs text-muted-foreground">
                      No sessions yet.
                    </p>
                  )}
                  {sessions.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-start gap-3 border-b border-border px-3 py-2.5 last:border-none hover:bg-secondary"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleSession(s.id)}
                        className="mt-0.5 size-4 accent-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-sm font-medium text-foreground">
                          {s.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(s.updated_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Date range{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              Filters notes, scriptures, and Bible notes by date. Leave blank to
              export everything.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                  From
                </Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  max={dateTo || undefined}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                  To
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom || undefined}
                />
              </div>
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear date range
              </button>
            )}
          </div>

          {/* Download button */}
          <Button
            className="w-full"
            onClick={handleDownload}
            disabled={isPending}
          >
            {isPending ? "Building export…" : "Download .txt file"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            The file opens in any text editor, notes app, or e-reader.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
