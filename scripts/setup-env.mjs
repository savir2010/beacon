// Creates a local .env with a fresh file-encryption key and session secret if one does not exist.
import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { userInfo } from "node:os";

if (existsSync(".env")) {
  console.log(".env already exists; leaving it alone.");
} else {
  writeFileSync(
    ".env",
    [
      `DATABASE_URL="postgresql://${userInfo().username}@localhost:5432/beacon"`,
      `BEACON_FILE_KEY="${randomBytes(32).toString("base64")}"`,
      'BEACON_APP_URL="http://localhost:3000"',
      "# Live demo: every sign-in code is 000000. Remove both lines before any real use.",
      'BEACON_DEMO_CODE="000000"',
      'BEACON_ALLOW_DEMO_CODE="1"',
      "",
    ].join("\n"),
  );
  console.log("Wrote .env with a new file-encryption key.");
}
