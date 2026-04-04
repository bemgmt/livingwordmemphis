"use strict";

const { execSync } = require("node:child_process");

if (process.platform !== "win32") {
  process.exit(0);
}

const cwd = process.cwd();
const driveMatch = cwd.match(/^([A-Za-z]):\\/);
if (!driveMatch) {
  process.exit(0);
}

const letter = driveMatch[1].toUpperCase();

try {
  const out = execSync(`fsutil fsinfo volumeinfo ${letter}:`, {
    encoding: "utf8",
    windowsHide: true,
  });
  if (/\bexfat\b/i.test(out)) {
    console.error(
      "Next.js production builds on Windows require an NTFS volume. This project is on " +
        `${letter}: (exFAT), which makes Node's readlink fail with EISDIR during webpack.\n` +
        "Fix: clone or copy the repo to an NTFS drive (for example C:\\), or run `npm run build` from WSL/Linux.",
    );
    process.exit(1);
  }
} catch {
  // fsutil unavailable or failed — let `next build` run and surface any error.
}
