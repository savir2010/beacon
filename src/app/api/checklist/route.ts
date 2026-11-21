import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { buildGuided, parseGuided } from "@/content/guided";
import { track } from "@/lib/metrics";

// Builds the preparation checklist as a PDF. Nothing is stored.
export async function GET(req: Request) {
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const { stageKey, aware, topicKeys } = parseGuided(sp);
  if (!stageKey) return new Response("Missing stage", { status: 400 });
  const r = buildGuided(stageKey, topicKeys, aware);

  const doc = await PDFDocument.create();
  doc.setTitle("Beacon preparation checklist");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.078, 0.188, 0.29);
  const muted = rgb(0.29, 0.38, 0.46);
  const accent = rgb(0.165, 0.416, 0.604);
  let page: PDFPage = doc.addPage([612, 792]);
  let y = 736;
  const M = 56;
  const W = 500;

  const wrap = (text: string, f: PDFFont, size: number, width: number) => {
    const out: string[] = [];
    let line = "";
    for (const w of text.split(" ")) {
      const t = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(t, size) > width) {
        out.push(line);
        line = w;
      } else line = t;
    }
    if (line) out.push(line);
    return out;
  };
  const ensure = (h: number) => {
    if (y - h < 64) {
      page = doc.addPage([612, 792]);
      y = 736;
    }
  };
  const text = (t: string, opts: { f?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; x?: number; gap?: number } = {}) => {
    const { f = font, size = 11, color = ink, x = M, gap = 4 } = opts;
    for (const line of wrap(t, f, size, W - (x - M))) {
      ensure(size + gap);
      page.drawText(line, { x, y, size, font: f, color });
      y -= size + gap;
    }
  };

  text("Beacon Mediation Services", { size: 10, color: muted });
  y -= 10;
  text("Your preparation checklist", { f: bold, size: 22, gap: 8 });
  text(`${r.stage.label}. Preparing for: ${r.topics.map((t) => t.label.toLowerCase()).join(", ")}.`, { color: muted });
  if (r.awarenessNote) {
    y -= 8;
    text(r.awarenessNote, { color: muted, size: 10 });
  }
  y -= 18;
  text("Next steps", { f: bold, size: 14, color: accent, gap: 8 });
  r.steps.forEach((s, i) => {
    text(`${i + 1}.  ${s.title}`, { f: bold });
    if (s.detail) text(s.detail, { x: M + 16, color: muted, size: 10 });
    y -= 4;
  });
  for (const g of r.checklist) {
    y -= 14;
    ensure(40);
    text(`${g.topic}: what to gather`, { f: bold, size: 14, color: accent, gap: 8 });
    for (const it of g.items) {
      ensure(20);
      page.drawRectangle({ x: M, y: y - 1, width: 9, height: 9, borderColor: muted, borderWidth: 0.8 });
      text(it.title, { x: M + 18 });
      if (it.detail) text(it.detail, { x: M + 18, color: muted, size: 10 });
      y -= 4;
    }
  }
  y -= 14;
  ensure(40);
  text("Questions to discuss with a mediator", { f: bold, size: 14, color: accent, gap: 8 });
  for (const g of r.questions) {
    text(g.topic, { f: bold, size: 10, color: muted });
    for (const q of g.items) text(`-  ${q}`, { x: M + 6 });
    y -= 6;
  }
  y -= 16;
  text("Draft content, pending legal review. General information only, not legal advice.", { size: 9, color: muted });
  text("In an emergency, call 911. National Domestic Violence Hotline: 1-800-799-7233.", { size: 9, color: muted });

  await track("checklist.download");
  return new Response(Buffer.from(await doc.save()), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="beacon-preparation-checklist.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
