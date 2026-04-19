import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "../../../lib/auth";
import { getLeads, createLead } from "../../../lib/db/leads";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const leads = await getLeads();
  return NextResponse.json(leads);
}

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json();
  const lead = await createLead(body);
  return NextResponse.json(lead, { status: 201 });
}
