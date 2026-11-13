"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LibraryDocument } from "@/lib/ministry/course-types";
import { courseCommand } from "./workbook";
const control =
  "mt-2 min-h-11 w-full min-w-0 rounded-md border bg-background px-3 py-2 text-base";
const button =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50";
export function LibraryPublisher({
  documents,
  reload,
}: {
  documents: LibraryDocument[];
  reload: () => Promise<void>;
}) {
  const [id, setId] = useState(""),
    [upload, setUpload] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const attach = async (file: File) => {
    setBusy(true);
    setError("");
    setUpload("");
    setStatus("Uploading the source document…");
    try {
      const mime =
        file.type ||
        (/\.pdf$/i.test(file.name)
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      const prepared = await courseCommand("library_prepare", {
        document_id: id,
        filename: file.name,
        mime,
        size: file.size,
      });
      const r = await createClient()
        .storage.from(prepared.bucket)
        .uploadToSignedUrl(prepared.path, prepared.token, file, {
          contentType: prepared.mime,
        });
      if (r.error) throw r.error;
      await courseCommand("library_finish", { id: prepared.id });
      setUpload(prepared.id);
      setStatus("File attached and verified. Preview it before publishing.");
    } catch (e) {
      setError((e as Error).message);
      setStatus(
        "The document has not been published. Retry attaching the file.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="mt-6 rounded-lg border p-4">
      <h3 className="font-serif text-xl">
        Attach or replace a library document
      </h3>
      <p className="mt-3 text-sm">
        Choose a Word document or PDF. Existing published material remains
        available until you publish the replacement.
      </p>
      <label className="mt-4 block font-medium">
        Library document
        <select
          className={control}
          value={id}
          disabled={busy}
          onChange={(e) => {
            setId(e.target.value);
            setUpload("");
            setStatus("");
            setError("");
          }}
        >
          <option value="">
            Choose a document or missing-material placeholder
          </option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title} · {d.state}
            </option>
          ))}
        </select>
      </label>
      {id && (
        <label className="mt-4 block font-medium">
          Attach library file
          <input
            className={control}
            type="file"
            disabled={busy}
            accept=".docx,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void attach(file);
            }}
          />
        </label>
      )}
      <p role="status" className="mt-3">
        {status}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-destructive">
          {error}
        </p>
      )}
      {upload && (
        <div className="mt-4 flex flex-wrap gap-4">
          <a
            className="inline-flex min-h-11 items-center text-primary underline"
            target="_blank"
            rel="noreferrer"
            href={`/api/ministry/library/${upload}?draft=1`}
          >
            Preview attached document
          </a>
          <button
            className={button}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await courseCommand("library_publish", { id: upload });
                setStatus(
                  "Library document published. Chapter text and assignment publication are managed separately.",
                );
                setUpload("");
                await reload();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Publish library document
          </button>
        </div>
      )}
    </section>
  );
}
