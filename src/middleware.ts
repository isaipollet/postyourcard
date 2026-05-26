import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage =
    pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi =
    pathname.startsWith("/api/admin") && pathname !== "/api/admin/login";

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    if (isAdminPage) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieToken = request.cookies.get("admin-token")?.value;
  const headerToken = request.headers
    .get("authorization")
    ?.replace("Bearer ", "");

  let authorized = false;
  if (cookieToken) {
    authorized = await verifySession(cookieToken, adminKey);
  }
  if (!authorized && headerToken) {
    authorized = headerToken === adminKey;
  }

  if (!authorized) {
    if (isAdminPage) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
