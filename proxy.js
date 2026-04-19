import { NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "./lib/auth";

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Protege todas as rotas /dashboard/*
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redireciona /login para / se já autenticado
  if (pathname === "/login") {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      const user = await verifyToken(token);
      if (user) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
