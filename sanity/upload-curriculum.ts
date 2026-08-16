import { readdir, readFile, stat } from "fs/promises";
import { basename, extname, join, relative } from "path";
import { getCliClient } from "sanity/cli";

type ResourceType =
  | "overview"
  | "shopping-prep"
  | "high-school-hacks"
  | "middle-school-hacks"
  | "lesson-outline"
  | "lesson-guide"
  | "discussion-questions"
  | "handout";

type CurriculumFile = {
  path: string;
  title: string;
  resourceType: ResourceType;
  description?: string;
};

type CurriculumManifest = {
  series: string;
  files: CurriculumFile[];
};

const resourceLabels: Record<ResourceType, string> = {
  overview: "Overview",
  "shopping-prep": "Shopping / prep list",
  "high-school-hacks": "High school hacks",
  "middle-school-hacks": "Middle school hacks",
  "lesson-outline": "Lesson outline",
  "lesson-guide": "Lesson guide",
  "discussion-questions": "Discussion questions",
  handout: "Handout",
};

const client = getCliClient();
const curriculumRoot = join(__dirname, "../curriculum");
const portalEnvPath = join(__dirname, "../member-portal/.env.local");
const storageBucket = "youth-curriculum";

const contentTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".mp4": "video/mp4",
};

async function loadPortalEnv() {
  const values = new Map<string, string>();
  const source = await readFile(portalEnvPath, "utf8");

  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const value = match[2].replace(/^(["'])(.*)\1$/, "$2");
    values.set(match[1], value);
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
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "file";
}

function storagePathFor(series: string, filePath: string) {
  const seriesSlug = safePathSegment(series).toLowerCase();
  const path = filePath.split(/[\\/]/).map(safePathSegment).join("/");
  return `bulk/${seriesSlug}/${path}`;
}

async function uploadToProtectedStorage(
  filePath: string,
  storagePath: string,
  contentType: string,
  supabase: { url: string; serviceRoleKey: string },
) {
  const encodedPath = storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const response = await fetch(
    `${supabase.url}/storage/v1/object/${storageBucket}/${encodedPath}`,
    {
      method: "POST",
      headers: {
        apikey: supabase.serviceRoleKey,
        Authorization: `Bearer ${supabase.serviceRoleKey}`,
        "Content-Type": contentType,
        "Cache-Control": "max-age=3600",
        "x-upsert": "true",
      },
      body: await readFile(filePath),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Supabase upload failed for ${storagePath}: ${response.status} ${detail}`,
    );
  }
}

function weekFromPath(filePath: string) {
  const match = filePath.match(/(?:^|[\\/])week-(\d+)(?:[\\/]|$)/i);
  return match ? Number.parseInt(match[1], 10) : undefined;
}

async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? filesUnder(path) : [path];
    }),
  );
  return results.flat();
}

function inferredResourceType(filePath: string): ResourceType | undefined {
  const name = basename(filePath).toLowerCase();
  if (name.includes("shopprep")) return "shopping-prep";
  if (name.includes("highschoolhacks")) return "high-school-hacks";
  if (name.includes("middleschoolhacks")) return "middle-school-hacks";
  if (name.includes("outline")) return "lesson-outline";
  if (name.includes("lesson")) return "lesson-guide";
  if (name.includes("discussion")) return "discussion-questions";
  if (name.includes("handout")) return "handout";
  if (name.includes("overview") || name.includes("topic")) return "overview";
  return undefined;
}

async function readManifest(seriesDirectory: string): Promise<CurriculumManifest> {
  const manifestPath = join(seriesDirectory, "manifest.json");
  try {
    return JSON.parse(await readFile(manifestPath, "utf8")) as CurriculumManifest;
  } catch {
    const files = (await filesUnder(seriesDirectory))
      .filter((file) => !file.endsWith("manifest.json") && extname(file) !== ".txt")
      .map((file) => ({
        path: relative(seriesDirectory, file).replaceAll("\\", "/"),
        title: basename(file, extname(file)).replaceAll("_", " "),
        resourceType: inferredResourceType(file),
      }))
      .filter((file): file is CurriculumFile => Boolean(file.resourceType));

    return { series: basename(seriesDirectory), files };
  }
}

async function main() {
  const seriesName = process.argv[2];
  if (!seriesName) {
    throw new Error(
      "Choose one series folder. Example: npx tsx upload-curriculum.ts stick-together",
    );
  }

  const seriesDirectory = join(curriculumRoot, seriesName);
  const manifest = await readManifest(seriesDirectory);
  const supabase = await loadPortalEnv();
  console.log(`Uploading ${manifest.files.length} files for ${manifest.series}.`);

  for (const file of manifest.files) {
    const filePath = join(seriesDirectory, file.path);
    const week = weekFromPath(file.path);
    const extension = extname(filePath).toLowerCase();
    const contentType = contentTypes[extension];
    if (!contentType) throw new Error(`Unsupported file type: ${file.path}`);

    const storagePath = storagePathFor(manifest.series, file.path);
    const fileStat = await stat(filePath);
    await uploadToProtectedStorage(
      filePath,
      storagePath,
      contentType,
      supabase,
    );

    const sourcePath = file.path.replaceAll("\\", "/");
    const existingId = await client.fetch<string | null>(
      `*[
        _type == "youthMinistryDocument" &&
        (
          sourcePath == $sourcePath ||
          (
            series == $series &&
            title == $title &&
            resourceType == $resourceType &&
            coalesce(week, 0) == $week
          )
        )
      ][0]._id`,
      {
        sourcePath,
        series: manifest.series,
        title: file.title,
        resourceType: file.resourceType,
        week: week ?? 0,
      },
    );

    const document = {
      title: file.title,
      description: file.description ?? resourceLabels[file.resourceType],
      protectedFile: {
        storagePath,
        originalFilename: basename(filePath),
        contentType,
        size: fileStat.size,
      },
      sourcePath,
      series: manifest.series,
      resourceType: file.resourceType,
      week,
    };

    if (existingId) {
      await client.patch(existingId).set(document).unset(["file"]).commit();
    } else {
      await client.create({ _type: "youthMinistryDocument", ...document });
    }

    console.log(`Protected ${file.path} and updated Sanity.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
