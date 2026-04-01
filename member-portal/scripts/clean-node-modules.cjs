/**
 * Windows-friendly removal of node_modules (ENOTEMPTY / EPERM from npm often
 * means a corrupted or locked tree). Close dev servers and IDE file watchers first.
 */
const fs = require("fs");
const path = require("path");

const target = path.join(__dirname, "..", "node_modules");

if (!fs.existsSync(target)) {
  console.log("No node_modules to remove.");
  process.exit(0);
}

try {
  fs.rmSync(target, {
    recursive: true,
    force: true,
    maxRetries: 15,
    retryDelay: 200,
  });
} catch (err) {
  if (err && (err.code === "EPERM" || err.code === "EBUSY")) {
    console.error(
      "Could not delete node_modules (files in use). Close Cursor/VS Code terminals, stop `next dev`, " +
        "pause OneDrive/antivirus scanning on this folder, then run this script again — or delete " +
        "member-portal\\node_modules from an elevated PowerShell: Remove-Item -Recurse -Force .\\node_modules",
    );
    process.exit(1);
  }
  throw err;
}

console.log("Removed member-portal/node_modules");
