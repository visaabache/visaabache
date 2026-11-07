import "server-only";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/** Renders admin-authored markdown to sanitized HTML (defence in depth against XSS). */
export function renderMarkdown(md: string | null | undefined): string {
  if (!md) return "";
  const html = marked.parse(md, { async: false, gfm: true, breaks: true }) as string;
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "h4"]),
    allowedAttributes: { a: ["href", "title", "target", "rel"], img: ["src", "alt", "title", "width", "height", "loading"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tagName, attribs) => {
        const external = /^https?:\/\//.test(attribs.href || "");
        return { tagName, attribs: { ...attribs, ...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {}) } };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
  });
}

export function readingMinutes(text: string) {
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}
