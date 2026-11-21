/** Renders the library's light markdown: paragraphs, "## " headings and "- " lists. Text only, never HTML. */
export function Prose({ body }: { body: string }) {
  const blocks = body.trim().split(/\n\s*\n/);
  return (
    <div className="prose-b text-[18px] leading-[1.7]">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines[0].startsWith("## ")) {
          const rest = lines.slice(1);
          return (
            <div key={i}>
              <h2>{lines[0].slice(3)}</h2>
              {rest.length > 0 && <Block lines={rest} />}
            </div>
          );
        }
        return <Block key={i} lines={lines} />;
      })}
    </div>
  );
}

function Block({ lines }: { lines: string[] }) {
  if (lines.every((l) => l.startsWith("- "))) {
    return (
      <ul>
        {lines.map((l, i) => (
          <li key={i}>{l.slice(2)}</li>
        ))}
      </ul>
    );
  }
  return <p>{lines.join(" ")}</p>;
}
