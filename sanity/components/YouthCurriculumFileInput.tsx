import { useRef, useState } from "react";
import { set, type ObjectInputProps } from "sanity";

type ProtectedFileValue = {
  _type?: string;
  storagePath?: string;
  originalFilename?: string;
  contentType?: string;
  size?: number;
};

type UploadInitResponse = {
  storagePath: string;
  signedUrl: string;
  contentType: string;
  error?: string;
};

const acceptedExtensions = ".pdf,.doc,.docx,.ppt,.pptx,.mp4";

function readableSize(size?: number) {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function YouthCurriculumFileInput(
  props: ObjectInputProps<ProtectedFileValue>,
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setIsUploading(true);
    setError(null);

    try {
      const initResponse = await fetch("/api/admin/youth-assets/upload-url", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      const uploadInit = (await initResponse.json()) as UploadInitResponse;

      if (!initResponse.ok) {
        throw new Error(uploadInit.error || "The secure upload could not start.");
      }

      const formData = new FormData();
      formData.append("cacheControl", "3600");
      formData.append("", file);

      const uploadResponse = await fetch(uploadInit.signedUrl, {
        method: "PUT",
        headers: { "x-upsert": "false" },
        body: formData,
      });

      if (!uploadResponse.ok) {
        let message = "The file could not be uploaded to protected storage.";
        try {
          const response = (await uploadResponse.json()) as { message?: string };
          if (response.message) message = response.message;
        } catch {
          // Storage may return an empty body for some failures.
        }
        throw new Error(message);
      }

      props.onChange(
        set({
          ...props.value,
          storagePath: uploadInit.storagePath,
          originalFilename: file.name,
          contentType: uploadInit.contentType,
          size: file.size,
        }),
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The curriculum file could not be uploaded.",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const filename = props.value?.originalFilename;
  const hasFile = Boolean(props.value?.storagePath && filename);

  return (
    <div
      style={{
        border: "1px solid var(--card-border-color)",
        borderRadius: 6,
        padding: 16,
      }}
    >
      {hasFile ? (
        <div style={{ marginBottom: 12 }}>
          <strong style={{ display: "block", overflowWrap: "anywhere" }}>
            {filename}
          </strong>
          <span style={{ color: "var(--card-muted-fg-color)", fontSize: 13 }}>
            Protected in Supabase Storage
            {props.value?.size ? ` - ${readableSize(props.value.size)}` : ""}
          </span>
        </div>
      ) : (
        <p style={{ margin: "0 0 12px", color: "var(--card-muted-fg-color)" }}>
          Upload the protected curriculum file before publishing this document.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedExtensions}
        disabled={props.readOnly || isUploading}
        aria-label={
          hasFile
            ? "Replace protected curriculum file"
            : "Upload protected curriculum file"
        }
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void upload(file);
        }}
      />

      {isUploading ? (
        <p role="status" style={{ margin: "12px 0 0" }}>
          Uploading securely. Keep this Studio tab open.
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          style={{
            color: "var(--card-critical-fg-color)",
            margin: "12px 0 0",
          }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
