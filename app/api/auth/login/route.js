import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "../../../../lib/db/users";
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "../../../../lib/auth";
import { ROLES } from "../../../../lib/roles";

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email e password obrigatórios" }, { status: 400 });
  }

  let user = null;

  try {
    const dbUser = await getUserByEmail(email);
    if (dbUser && dbUser.active) {
      const valid = await bcrypt.compare(password, dbUser.password_hash);
      if (valid) {
        user = {
          id:       String(dbUser.id),
          name:     dbUser.name,
          initials: dbUser.initials,
          role:     dbUser.role,
          email:    dbUser.email,
        };
      }
    }
  } catch {
    return NextResponse.json({ error: "Base de dados indisponível" }, { status: 503 });
  }

  if (!user) {
    return NextResponse.json({ error: "Credenciais inválidas ou conta inativa" }, { status: 401 });
  }

  const token = await signToken({
    id:       user.id,
    name:     user.name,
    initials: user.initials,
    role:     user.role,
    email:    user.email,
  });

  const role       = ROLES[user.role];
  const redirectTo = role?.dashboardPath || "/dashboard/config";

  // Detectar HTTPS dinamicamente — Safari rejeita cookies "secure" em HTTP
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const isHttps = proto === "https";

  const response = NextResponse.json({ redirectTo });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   isHttps,
    sameSite: "lax",
    maxAge:   COOKIE_MAX_AGE,
    path:     "/",
  });

  return response;
}
