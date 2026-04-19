import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { verifyToken, COOKIE_NAME } from "../../../lib/auth";
import { getAllUsers, createUser } from "../../../lib/db/users";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Base de dados indisponível" }, { status: 503 });
  }
}

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { name, initials, email, password, role } = await request.json();
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Campos obrigatórios em falta" }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = await createUser({
      name,
      initials: initials || name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase(),
      email,
      passwordHash,
      role,
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch {
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: "Base de dados offline — utilizador não persistido (modo dev)" }, { status: 503 });
    }
    return NextResponse.json({ error: "Base de dados indisponível" }, { status: 503 });
  }
}
