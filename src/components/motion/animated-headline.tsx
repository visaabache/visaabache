import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Word-by-word reveal headline (pure CSS, server-rendered). Words listed in `highlight`
 * get the animated gold gradient.
 */
export function AnimatedHeadline({ text, highlight = [], className, as: Tag = "h1", delay = 0 }: {
  text: string; highlight?: string[]; className?: string; as?: "h1" | "h2"; delay?: number;
}): ReactNode {
  const words = text.split(" ");
  const norm = (w: string) => w.replace(/[.,!?؟،]/g, "").toLowerCase();
  const hl = new Set(highlight.map(norm));
  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <span
            className={cn("inline-block animate-word-in", hl.has(norm(w)) && "text-gradient-gold")}
            style={{ animationDelay: `${delay + i * 0.08}s` }}
          >
            {w}
          </span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </Tag>
  );
}
