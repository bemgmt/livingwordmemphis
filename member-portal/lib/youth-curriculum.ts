export const YOUTH_CURRICULUM_BUCKET = "youth-curriculum";
export const YOUTH_CURRICULUM_MAX_BYTES = 50 * 1024 * 1024;

const MIME_TYPES_BY_EXTENSION: Record<string, readonly string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  mp4: ["video/mp4"],
};

export function curriculumFileExtension(filename: string) {
  return filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
}

export function validateCurriculumFile(input: {
  filename: string;
  contentType: string;
  size: number;
}) {
  const extension = curriculumFileExtension(input.filename);
  const allowedContentTypes = MIME_TYPES_BY_EXTENSION[extension];

  if (!allowedContentTypes) {
    return {
      ok: false as const,
      error: "Use a PDF, Word document, PowerPoint, or MP4 file.",
    };
  }

  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { ok: false as const, error: "The selected file is empty." };
  }

  if (input.size > YOUTH_CURRICULUM_MAX_BYTES) {
    return {
      ok: false as const,
      error: "The selected file is larger than 50 MB.",
    };
  }

  const normalizedContentType = input.contentType.toLowerCase().trim();
  if (
    normalizedContentType &&
    !allowedContentTypes.includes(normalizedContentType)
  ) {
    return {
      ok: false as const,
      error: "The file type does not match its filename.",
    };
  }

  return {
    ok: true as const,
    contentType: normalizedContentType || allowedContentTypes[0],
  };
}

export function safeCurriculumFilename(filename: string) {
  const normalized = filename.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-");
  return normalized.replace(/^-+|-+$/g, "").slice(-120) || "curriculum-file";
}
