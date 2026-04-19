import { NextResponse } from "next/server";
import { getConfigs, setConfig } from "../../../../lib/db/config.js";
import { DB_ENABLED } from "../../../../lib/db.js";

const KEYS = ["imap_host", "imap_port", "imap_user", "imap_password", "imap_tls"];

// GET — devolve configuração sem expor a password
export async function GET() {
  if (!DB_ENABLED) {
    return NextResponse.json({ configured: false, demo: true });
  }

  const cfg = await getConfigs(KEYS);

  return NextResponse.json({
    host:       cfg.imap_host     || "",
    port:       cfg.imap_port     || "993",
    user:       cfg.imap_user     || "",
    password:   cfg.imap_password ? "••••••••" : "",
    tls:        cfg.imap_tls !== "false",
    configured: !!cfg.imap_host && !!cfg.imap_user && !!cfg.imap_password,
  });
}

// POST — grava todos os campos (password apenas se não for "••••••••")
export async function POST(req) {
  if (!DB_ENABLED) {
    return NextResponse.json({ error: "Base de dados não configurada" }, { status: 503 });
  }

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const { host, port, user, password, tls } = body || {};

  if (!host || !user) {
    return NextResponse.json({ error: "host e user são obrigatórios" }, { status: 400 });
  }

  await setConfig("imap_host", host);
  await setConfig("imap_port", port || "993");
  await setConfig("imap_user", user);
  await setConfig("imap_tls",  String(tls !== false));

  // Só actualiza a password se vier uma nova (não é o placeholder)
  if (password && password !== "••••••••") {
    await setConfig("imap_password", password);
  }

  return NextResponse.json({ ok: true });
}
