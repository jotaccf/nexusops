import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "../../../lib/auth";
import { getTasks, createTask } from "../../../lib/db/tasks";

export async function GET(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  const tasks = await getTasks({ role: role || user.role });
  return NextResponse.json(tasks);
}

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json();
  const task = await createTask({ ...body, assigneeId: body.assigneeId || null });
  return NextResponse.json(task, { status: 201 });
}
