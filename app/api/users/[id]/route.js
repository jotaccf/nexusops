import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { verifyToken, COOKIE_NAME } from "../../../../lib/auth";
import getDb from "../../../../lib/db";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user || user.role !== "admin") return null;
  return user;
}

// PATCH /api/users/[id] — actualizar dados do utilizador
export async function PATCH(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const sql = getDb();
  const allowed = ["name", "initials", "email", "active", "role", "imap_host", "imap_port", "imap_user", "imap_tls"];
  const sets = [];
  const values = [id];

  for (const field of allowed) {
    if (field in body) {
      sets.push(`${field} = $${values.length + 1}`);
      values.push(body[field]);
    }
  }

  // Password do utilizador (login) — hash com bcrypt se fornecida
  if (body.password && body.password.length > 0) {
    const hash = await bcrypt.hash(body.password, 12);
    sets.push(`password_hash = $${values.length + 1}`);
    values.push(hash);
  }

  // Password IMAP tratada separadamente (nunca devolver em SELECT)
  if (body.imap_password && body.imap_password !== "••••••••") {
    sets.push(`imap_password = $${values.length + 1}`);
    values.push(body.imap_password);
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "Nenhum campo para actualizar" }, { status: 400 });
  }

  let rows;
  try {
    rows = await sql.unsafe(
      `UPDATE users SET ${sets.join(", ")} WHERE id = $1 RETURNING id, name, initials, email, role, active, imap_host, imap_port, imap_user, imap_tls`,
      values
    );
  } catch (err) {
    if (err.code === "23505") return NextResponse.json({ error: "Email já existe" }, { status: 409 });
    throw err;
  }

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
