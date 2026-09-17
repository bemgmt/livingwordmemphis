import { readFile } from "fs/promises";
import { join } from "path";
import { getCliClient } from "sanity/cli";

type LegacyYouthDocument = {
  _id: string;
  title?: string;
  series?: string;
  asset: {
    _id: string;
    url: string;
    originalFilename?: string;
    mimeType: string;
    size: number;
  };
};

const client = getCliClient();
const portalEnvPath = join(__dirname, "../member-portal/.env.local");
const storageBucket = "youth-curriculum";
const maxFileBytes = 50 * 1024 * 1024;
const allowedContentTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "video/mp4",
]);

async function loadPortalEnv() {
  const values = new Map<string, string>();
  const source = await readFile(portalEnvPath, "utf8");

  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    values.set(match[1], match[2].replace(/^(["'])(.*)\1$/, "$2"));
  }

  const url = values.get("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = values.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    throw new Error(
      "member-portal/.env.local must define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return { url: url.replace(/\/$/, ""), serviceRoleKey };
}

function safePathSegment(value: string) {
  return (
    value
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "file"
  );
}

function fallbackFilename(document: LegacyYouthDocument) {
  const extensionByType: Record<string, string> = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      ".pptx",
    "video/mp4": ".mp4",
  };
  const stem = safePathSegment(document.title || "curriculum-file");
  return `${stem}${extensionByType[document.asset.mimeType] || ""}`;
}

function storagePathFor(document: LegacyYouthDocument) {
  const filename = safePathSegment(
    document.asset.originalFilename || fallbackFilename(document),
  );
  const assetId = safePathSegment(document.asset._id);
  return `legacy/${assetId}/${filename}`;
}

async function uploadAsset(
  document: LegacyYouthDocument,
  storagePath: string,
  supabase: { url: string; serviceRoleKey: string },
) {
  if (!allowedContentTypes.has(document.asset.mimeType)) {
    throw new Error(`Unsupported content type: ${document.asset.mimeType}`);
  }

  const sourceResponse = await fetch(document.asset.url);
  if (!sourceResponse.ok) {
    throw new Error(
      `Sanity download failed: ${sourceResponse.status} ${sourceResponse.statusText}`,
    );
  }
  const bytes = Buffer.from(await sourceResponse.arrayBuffer());
  if (!bytes.length) throw new Error("Sanity returned an empty asset.");

  const encodedPath = storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const uploadResponse = await fetch(
    `${supabase.url}/storage/v1/object/${storageBucket}/${encodedPath}`,
    {
      method: "POST",
      headers: {
        apikey: supabase.serviceRoleKey,
        Authorization: `Bearer ${supabase.serviceRoleKey}`,
        "Content-Type": document.asset.mimeType,
        "Cache-Control": "max-age=3600",
        "x-upsert": "true",
      },
      body: bytes,
    },
  );

  if (!uploadResponse.ok) {
    throw new Error(
      `Supabase upload failed: ${uploadResponse.status} ${await uploadResponse.text()}`,
    );
  }
}

async function main() {
  const supabase = await loadPortalEnv();
  const documents = await client.fetch<LegacyYouthDocument[]>(`*[
    _type == "youthMinistryDocument" &&
    !defined(protectedFile.storagePath) &&
    defined(file.asset)
  ] | order(_id asc) {
    _id,
    title,
    series,
    "asset": file.asset->{ _id, url, originalFilename, mimeType, size }
  }`);

  console.log(`Migrating ${documents.length} legacy youth curriculum documents.`);
  const uploadedPaths = new Set<string>();
  const skipped: LegacyYouthDocument[] = [];

  for (const [index, document] of documents.entries()) {
    if (!document.asset?.url || !document.asset.mimeType) {
      throw new Error(`Document ${document._id} is missing Sanity asset metadata.`);
    }

    if (document.asset.size > maxFileBytes) {
      skipped.push(document);
      console.warn(
        `Skipped ${document._id}: ${document.asset.originalFilename || document.title || "file"} is larger than 50 MB.`,
      );
      continue;
    }

    const storagePath = storagePathFor(document);
    if (!uploadedPaths.has(storagePath)) {
      await uploadAsset(document, storagePath, supabase);
      uploadedPaths.add(storagePath);
    }

    const originalFilename =
      document.asset.originalFilename || fallbackFilename(document);
    await client
      .patch(document._id)
      .set({
        protectedFile: {
          storagePath,
          originalFilename,
          contentType: document.asset.mimeType,
          size: document.asset.size,
        },
        sourcePath: `legacy-sanity/${document.asset._id}/${originalFilename}`,
      })
      .unset(["file"])
      .commit({ visibility: "sync" });

    const completed = index + 1;
    if (completed % 10 === 0 || completed === documents.length) {
      console.log(`Migrated ${completed}/${documents.length} documents.`);
    }
  }

  if (skipped.length) {
    console.warn(
      `${skipped.length} document(s) remain on legacy Sanity assets because they exceed the Supabase Free-plan 50 MB limit.`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
