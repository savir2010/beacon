import "server-only";
import { db } from "./db";

export async function track(name: string) {
  try {
    await db.metricEvent.create({ data: { name } });
  } catch {}
}
