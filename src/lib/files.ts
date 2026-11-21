import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";

// Documents are stored in the database (StoredFile), keyed by a random id.

// Vercel functions reject request bodies over 4.5 MB, so uploads are capped lower there.
export const MAX_UPLOAD_BYTES = (process.env.VERCEL ? 4 : 12) * 1024 * 1024;
export const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG image",
  "image/png": "PNG image",
  "image/heic": "HEIC image",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel spreadsheet",
};

export async function storeEncrypted(buf: Buffer) {
  const storageKey = randomBytes(16).toString("hex");
  await db.storedFile.create({ data: { key: storageKey, data: buf } });
  return { storageKey };
}

export async function readDecrypted(d: { storageKey: string }) {
  const row = await db.storedFile.findUnique({ where: { key: d.storageKey } });
  if (!row) throw new Error("stored file not found");
  return Buffer.from(row.data);
}
