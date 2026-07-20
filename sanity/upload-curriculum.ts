import { createReadStream } from "fs";
import { readdir, readFile } from "fs/promises";
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
  console.log(`Uploading ${manifest.files.length} files for ${manifest.series}.`);

  for (const file of manifest.files) {
    const filePath = join(seriesDirectory, file.path);
    const week = weekFromPath(file.path);
    const asset = await client.assets.upload("file", createReadStream(filePath), {
      filename: basename(filePath),
    });

    await client.create({
      _type: "youthMinistryDocument",
      title: file.title,
      description: file.description ?? resourceLabels[file.resourceType],
      file: {
        _type: "file",
        asset: { _type: "reference", _ref: asset._id },
      },
      series: manifest.series,
      resourceType: file.resourceType,
      week,
    });

    console.log(`Uploaded ${file.path}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});