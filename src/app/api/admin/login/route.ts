export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { signSession, SESSION_MAX_AGE_SECONDS } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { password } = await request.json();
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey || password !== adminKey) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await signSession(adminKey);

  const response = NextResponse.json({ success: true });
  response.cookies.set("admin-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
