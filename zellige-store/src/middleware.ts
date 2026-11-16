import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["fr", "ar", "en"];
const DEFAULT = "fr";

function preferredLocale(req: NextRequest) {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && LOCALES.includes(cookie)) return cookie;
  for (const part of (req.headers.get("accept-language") || "").split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (LOCALES.includes(code)) return code;
  }
  return DEFAULT;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1];
  if (LOCALES.includes(first)) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-locale", first);
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    if (req.cookies.get("NEXT_LOCALE")?.value !== first) res.cookies.set("NEXT_LOCALE", first, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return res;
  }
  const url = req.nextUrl.clone();
  url.pathname = `/${preferredLocale(req)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|admin|media|_next|catalog|brand|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico|txt|xml|webmanifest)$).*)"],
};
