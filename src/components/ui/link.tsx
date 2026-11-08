"use client";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, forwardRef } from "react";

/**
 * Drop-in replacement for next/link that does NOT prefetch every visible link in the background.
 * Each background prefetch is a full server render on Cloudflare Workers (CPU-billed), and the
 * homepage alone has ~30 links. Instead we prefetch only when the visitor shows intent
 * (mouse hover / finger down), which keeps navigation fast at a fraction of the cost.
 */
type Props = ComponentProps<typeof NextLink>;

export default forwardRef<HTMLAnchorElement, Props>(function Link({ prefetch, onMouseEnter, onTouchStart, href, ...rest }, ref) {
  const router = useRouter();
  const intent = () => {
    if (prefetch === false) return;
    const url = typeof href === "string" ? href : href.pathname ? `${href.pathname}${href.search ?? ""}` : "";
    if (url.startsWith("/")) router.prefetch(url);
  };
  return (
    <NextLink
      ref={ref}
      href={href}
      prefetch={false}
      onMouseEnter={(e) => { intent(); onMouseEnter?.(e); }}
      onTouchStart={(e) => { intent(); onTouchStart?.(e); }}
      {...rest}
    />
  );
});
