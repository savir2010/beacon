// Creates a local .env with the local database address if one does not exist.
import { existsSync, writeFileSync } from "node:fs";
import { userInfo } from "node:os";

if (existsSync(".env")) {
  console.log(".env already exists; leaving it alone.");
} else {
  writeFileSync(
    ".env",
    [
      `DATABASE_URL="postgresql://${userInfo().username}@localhost:5432/beacon"`,
      'BEACON_APP_URL="http://localhost:3000"',
      "",
    ].join("\n"),
  );
  console.log("Wrote .env.");
}
