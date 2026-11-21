import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { db } from "@/lib/db";

// Every document is encrypted with AES-256-GCM before it is stored. Only ciphertext reaches the database.

function key() {
  const k = Buffer.from(process.env.BEACON_FILE_KEY ?? "", "base64");
  if (k.length !== 32) throw new Error("BEACON_FILE_KEY is missing or not 32 bytes");
  return k;
}

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
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(buf), cipher.final()]);
  const storageKey = randomBytes(16).toString("hex");
  await db.storedFile.create({ data: { key: storageKey, data: enc } });
  return { storageKey, iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64") };
}

export async function readDecrypted(d: { storageKey: string; iv: string; authTag: string }) {
  if (!/^[a-f0-9]{32}$/.test(d.storageKey)) throw new Error("bad storage key");
  const row = await db.storedFile.findUnique({ where: { key: d.storageKey } });
  if (!row) throw new Error("stored file not found");
  const enc = Buffer.from(row.data);
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(d.iv, "base64"));
  decipher.setAuthTag(Buffer.from(d.authTag, "base64"));
  return Buffer.concat([decipher.update(enc), decipher.final()]);
}
