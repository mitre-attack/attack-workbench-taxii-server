const { execSync } = require("child_process");

const MAX_RETRIES = 2;
const brunoCmd = process.argv.slice(2).join(" ") || "bru run --env CI --format junit --output report.xml";

for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
  console.log(`\n=== Attempt ${attempt} of ${MAX_RETRIES + 1} ===\n`);
  try {
    execSync(brunoCmd, { stdio: "inherit", cwd: __dirname });
    console.log(`\nTests passed on attempt ${attempt}.`);
    process.exit(0);
  } catch (e) {
    console.error(`\nAttempt ${attempt} failed (exit code ${e.status}).`);
    if (attempt <= MAX_RETRIES) {
      console.log("Retrying...");
    }
  }
}

console.error(`\nAll ${MAX_RETRIES + 1} attempts failed.`);
process.exit(1);
