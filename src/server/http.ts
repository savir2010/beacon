import "server-only";

/** An error the API turns into a JSON response with this status and a plain-language message. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
export const fail = (status: number, message: string): never => {
  throw new ApiError(status, message);
};
export const notFound = () => fail(404, "Not found");

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store", ...headers } });

/** Request body as JSON, or {} when empty. */
export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  const t = await req.text();
  if (!t) return {} as T;
  try {
    return JSON.parse(t) as T;
  } catch {
    return fail(400, "The request wasn't valid JSON.");
  }
}

export const s = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
