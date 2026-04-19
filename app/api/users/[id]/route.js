import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "../../../../lib/auth";
import getDb from "../../../../lib/db";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user || user.role !== "admin") return null;
  return user;
}

// PATCH /api/users/[id] — actualizar active, role, imap pessoal
export async function PATCH(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const sql = getDb();
  const allowed = ["active", "role", "imap_host", "imap_port", "imap_user", "imap_tls"];
  const sets = [];
  const values = [id];

  for (const field of allowed) {
    if (field in body) {
      sets.push(`${field} = $${values.length + 1}`);
      values.push(body[field]);
    }
  }
  // Password IMAP tratada separadamente (nunca devolver em SELECT)
  if (body.imap_password && body.imap_password !== "••••••••") {
    sets.push(`imap_password = $${values.length + 1}`);
    values.push(body.imap_password);
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "Nenhum campo para actualizar" }, { status: 400 });
  }

  const rows = await sql.unsafe(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $1 RETURNING id, name, initials, email, role, active, imap_host, imap_port, imap_user, imap_tls`,
    values
  );

  if (!rows.length) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

// DELETE /api/users/[id]
export async function DELETE(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM users WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
