// Used by Vercel to determine whether to build a specific app.
// Each app's vercel.json references this script via ignoreCommand.
// Exits 0 (skip build) if no files changed in the app's directory.
// Exits 1 (proceed with build) if files changed.

const { execSync } = require("child_process");

const app = process.env.APP_NAME;
if (!app) {
  console.log("APP_NAME not set, proceeding with build");
  process.exit(1);
}

const diff = execSync("git diff --name-only HEAD~1").toString();
const lines = diff.split("\n");
const appChanged = lines.some(
  (line) => line.startsWith(`apps/${app}/`) || line === "package.json"
);

if (appChanged) {
  console.log(`Changes detected in apps/${app}, proceeding with build`);
  process.exit(1);
} else {
  console.log(`No changes in apps/${app}, skipping build`);
  process.exit(0);
}
