"use client";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, forwardRef } from "react";

/**
 * Drop-in replacement for next/link, tuned for Cloudflare Workers' CPU limits.
 *  - Public pages: a plain <a>. A full page load is served from the edge page cache (a few ms of CPU), whereas a
 *    client-side navigation asks the server for an uncached React payload (?_rsc=…, 50–300 ms of CPU each).
 *  - Admin / account (never cached, interactive): next/link without background prefetch; prefetch only on intent
 *    (mouse hover / finger down).
 */
type Props = ComponentProps<typeof NextLink>;
const APP_AREA = /^\/(fr|ar|en)\/(admin|account)(\/|$|\?)/;

export default forwardRef<HTMLAnchorElement, Props>(function Link({ prefetch, onMouseEnter, onTouchStart, href, ...rest }, ref) {
  const router = useRouter();
  const url = typeof href === "string" ? href : href.pathname ? `${href.pathname}${href.search ?? ""}${href.hash ?? ""}` : "";
  if (!APP_AREA.test(url)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { replace, scroll, shallow, passHref, legacyBehavior, locale, ...anchor } = rest as Props & Record<string, unknown>;
    return <a ref={ref} href={url} onMouseEnter={onMouseEnter} onTouchStart={onTouchStart} {...(anchor as ComponentProps<"a">)} />;
  }
  const intent = () => {
    if (prefetch === false) return;
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
