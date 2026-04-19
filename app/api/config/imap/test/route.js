import { ImapFlow } from "imapflow";
import { NextResponse } from "next/server";

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const { host, port, user, password, tls } = body || {};

  if (!host || !user || !password) {
    return NextResponse.json({ error: "host, user e password são obrigatórios" }, { status: 400 });
  }

  const client = new ImapFlow({
    host,
    port:   parseInt(port || "993", 10),
    secure: tls !== false,
    auth:   { user, pass: password },
    logger: false,
    connectionTimeout: 8000,
    greetingTimeout:   5000,
  });

  try {
    await client.connect();
    const status = await client.status("INBOX", { messages: true, unseen: true });
    await client.logout();
    return NextResponse.json({
      ok:      true,
      messages: status.messages ?? null,
      unseen:   status.unseen   ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
