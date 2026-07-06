import { getCliClient } from "sanity/cli";
import { createReadStream } from "fs";
import { readdir } from "fs/promises";
import { join, basename, extname } from "path";

const client = getCliClient();

async function main() {
  const curriculumDir = join(__dirname, "../curriculum");
  const files = await readdir(curriculumDir);

  console.log(`Found ${files.length} files in curriculum directory.`);

  for (const file of files) {
    if (file === ".DS_Store" || file === "Transcript.txt") continue;

    const filePath = join(curriculumDir, file);
    const fileName = basename(file, extname(file));
    
    // Parse week number if present (e.g. Lesson1, Handout4)
    const weekMatch = fileName.match(/\d+/);
    const week = weekMatch ? parseInt(weekMatch[0], 10) : undefined;
    
    // Extract series (e.g. "Wonder")
    let series = "Wonder";
    if (fileName.includes("GrowStudents")) {
      series = "Wonder (GrowStudents)";
    }

    console.log(`Uploading ${file}...`);
    
    try {
      const asset = await client.assets.upload("file", createReadStream(filePath), {
        filename: file,
      });

      console.log(`Asset uploaded: ${asset._id}. Creating document...`);

      const doc = {
        _type: "youthMinistryDocument",
        title: fileName.replace(/_/g, " "),
        file: {
          _type: "file",
          asset: {
            _type: "reference",
            _ref: asset._id,
          },
        },
        series,
        week,
      };

      await client.create(doc);
      console.log(`Document created for ${file}`);
    } catch (error) {
      console.error(`Failed to process ${file}:`, error);
    }
  }
}

main().catch(console.error);
