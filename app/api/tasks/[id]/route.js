import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "../../../../lib/auth";
import { toggleTask, updateTask, deleteTask } from "../../../../lib/db/tasks";

export async function PATCH(request, { params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body    = await request.json();
  const { id }  = await params;

  // Toggle rápido: { done: bool }
  if (Object.keys(body).length === 1 && "done" in body) {
    const task = await toggleTask(id, body.done);
    return NextResponse.json(task);
  }

  // Edição completa
  const task = await updateTask(id, body);
  return NextResponse.json(task);
}

export async function DELETE(request, { params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  await deleteTask(id);
  return NextResponse.json({ ok: true });
}
