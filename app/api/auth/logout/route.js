import { NextResponse } from "next/server";
import { COOKIE_NAME } from "../../../../lib/auth";

export async function POST(request) {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const isHttps = proto === "https";

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure:   isHttps,
    sameSite: "lax",
    maxAge:   0,
    path:     "/",
  });
  return response;
}
