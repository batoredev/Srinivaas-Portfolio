import { NextResponse, type NextRequest } from "next/server";
import { MODE_COOKIE, MODE_LOCKED, PROFESSIONAL_PATH } from "@/lib/mode";

/**
 * Server half of the one-way door (see src/lib/mode.ts).
 * - Visiting /professional stamps the lock cookie (session-scoped).
 * - Any later request for a cinematic page (the root, or an AR projector
 *   page) is redirected to /professional.
 */
const isCinematic = (pathname: string) => pathname === "/" || pathname === "/ar" || pathname.startsWith("/ar/");

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locked = request.cookies.get(MODE_COOKIE)?.value === MODE_LOCKED;

  if (isCinematic(pathname) && locked) {
    const url = request.nextUrl.clone();
    url.pathname = PROFESSIONAL_PATH;
    url.search = "";
    url.hash = "";
    const res = NextResponse.redirect(url, 307);
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const res = NextResponse.next();
  if (isCinematic(pathname)) {
    // Never let a shared cache hand a cinematic page to a locked visitor.
    res.headers.set("Cache-Control", "private, no-store");
  }
  if (pathname.startsWith(PROFESSIONAL_PATH) && !locked) {
    res.cookies.set({ name: MODE_COOKIE, value: MODE_LOCKED, path: "/", sameSite: "lax" });
  }
  return res;
}

export const config = {
  matcher: ["/", "/ar/:path*", "/professional/:path*"],
};
