import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["fr", "ar", "en"];
const DEFAULT = "fr";

function preferredLocale(req: NextRequest) {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && LOCALES.includes(cookie)) return cookie;
  const header = req.headers.get("accept-language") || "";
  for (const part of header.split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (LOCALES.includes(code)) return code;
  }
  return DEFAULT;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1];
  if (LOCALES.includes(first)) {
    const res = NextResponse.next();
    res.headers.set("x-locale", first);
    return res;
  }
  const url = req.nextUrl.clone();
  url.pathname = `/${preferredLocale(req)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip API routes, Next internals, static files and SEO files.
  matcher: ["/((?!api|_next|flags|images|favicon.ico|icon.svg|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt|xml)$).*)"],
};
