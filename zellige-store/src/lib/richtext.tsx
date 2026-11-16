import { Fragment, type ReactNode } from "react";

/**
 * Minimal, safe rich text for admin-written pages and product descriptions (no HTML is ever injected):
 * "## " heading, "### " subheading, "- " list item, blank line = new paragraph,
 * **bold**, and [label](https://url) links.
 */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(((?:https?:\/\/|\/|mailto:|tel:)[^\s)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${key}-b${i++}`}>{m[1]}</strong>);
    else out.push(<a key={`${key}-a${i++}`} href={m[3]} {...(m[3].startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{m[2]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function renderRichText(src: string): ReactNode {
  const blocks = src.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return blocks.map((block, bi) => {
    const lines = block.split("\n").filter((l) => l.trim());
    if (!lines.length) return null;
    if (lines.every((l) => /^\s*[-•]\s+/.test(l)))
      return <ul key={bi}>{lines.map((l, li) => <li key={li}>{inline(l.replace(/^\s*[-•]\s+/, ""), `${bi}-${li}`)}</li>)}</ul>;
    if (lines[0].startsWith("### ")) return <Fragment key={bi}><h3>{inline(lines[0].slice(4), `${bi}h`)}</h3>{lines.length > 1 && <p>{inline(lines.slice(1).join(" "), `${bi}p`)}</p>}</Fragment>;
    if (lines[0].startsWith("## ")) return <Fragment key={bi}><h2>{inline(lines[0].slice(3), `${bi}h`)}</h2>{lines.length > 1 && <p>{inline(lines.slice(1).join(" "), `${bi}p`)}</p>}</Fragment>;
    return <p key={bi}>{lines.flatMap((l, li) => (li ? [<br key={`br${li}`} />, ...inline(l, `${bi}-${li}`)] : inline(l, `${bi}-${li}`)))}</p>;
  });
}
