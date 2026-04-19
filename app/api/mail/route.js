import { ImapFlow } from "imapflow";
import { getConfigs } from "../../../lib/db/config.js";
import { DB_ENABLED } from "../../../lib/db.js";
import { verifyToken, COOKIE_NAME } from "../../../lib/auth.js";
import { cookies } from "next/headers";
import getDb from "../../../lib/db.js";

export const dynamic = "force-dynamic";

const DEMO_EMAILS = [
  { id: "1", from: "Ana Costa",       fromEmail: "ana@empresa.pt",       subject: "Encomenda #ENC-2024-001 — confirmação",  date: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: "2", from: "Carlos Ferreira", fromEmail: "carlos@parceiro.pt",   subject: "Stock crítico — SKU-789",                date: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: "3", from: "Rita Alves",      fromEmail: "rita@logistica.pt",    subject: "Relatório diário expedições",            date: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { id: "4", from: "Suporte AT",      fromEmail: "suporte@at.gov.pt",    subject: "SAF-T validado com sucesso",             date: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
  { id: "5", from: "Pedro Marques",   fromEmail: "pedro@cliente.pt",     subject: "Pedido de orçamento — urgente",          date: new Date(Date.now() - 1000 * 60 * 240).toISOString() },
  { id: "6", from: "Wisedat",         fromEmail: "no-reply@wisedat.com", subject: "Actualização de documentação XML",       date: new Date(Date.now() - 1000 * 60 * 360).toISOString() },
];

async function getGlobalImapCredentials() {
  if (DB_ENABLED) {
    const cfg = await getConfigs(["imap_host", "imap_port", "imap_user", "imap_password", "imap_tls"]);
    if (cfg.imap_host && cfg.imap_user && cfg.imap_password) {
      return { host: cfg.imap_host, port: parseInt(cfg.imap_port || "993", 10), user: cfg.imap_user, password: cfg.imap_password, tls: cfg.imap_tls !== "false" };
    }
  }
  const host = process.env.IMAP_HOST, user = process.env.IMAP_USER, password = process.env.IMAP_PASSWORD;
  if (host && user && password) {
    return { host, port: parseInt(process.env.IMAP_PORT || "993", 10), user, password, tls: process.env.IMAP_TLS !== "false" };
  }
  return null;
}

async function getPersonalImapCredentials(userId) {
  if (!DB_ENABLED) return null;
  const sql = getDb();
  const [u] = await sql`SELECT imap_host, imap_port, imap_user, imap_password, imap_tls FROM users WHERE id = ${userId}`;
  if (!u?.imap_host || !u?.imap_user || !u?.imap_password) return null;
  return { host: u.imap_host, port: parseInt(u.imap_port || "993", 10), user: u.imap_user, password: u.imap_password, tls: u.imap_tls !== false };
}

async function fetchImapEmails(creds) {
  const client = new ImapFlow({
    host: creds.host, port: creds.port, secure: creds.tls,
    auth: { user: creds.user, pass: creds.password },
    logger: false, connectionTimeout: 8000, greetingTimeout: 5000,
  });
  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  const messages = [];
  try {
    const { exists, unseen } = client.mailbox;
    // Últimos 5 recebidos por número de sequência (mais recentes = sequências mais altas)
    const first = Math.max(1, exists - 4);
    const range = exists > 0 ? `${first}:*` : "1:0";
    if (exists > 0) {
      for await (const msg of client.fetch(range, { uid: true, envelope: true, flags: true })) {
        messages.push({
          id:        String(msg.uid),
          from:      msg.envelope.from?.[0]?.name || msg.envelope.from?.[0]?.address || "Desconhecido",
          fromEmail: msg.envelope.from?.[0]?.address || "",
          subject:   msg.envelope.subject || "(sem assunto)",
          date:      msg.envelope.date?.toISOString() || new Date().toISOString(),
          seen:      msg.flags?.has("\\Seen") ?? false,
        });
      }
    }
    return { messages: messages.sort((a, b) => new Date(b.date) - new Date(a.date)), unseen: unseen ?? 0 };
  } finally {
    lock.release();
    await client.logout();
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source"); // "global" | "personal"

  // Caixa pessoal — requer autenticação
  if (source === "personal") {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const sessionUser = token ? await verifyToken(token) : null;
    if (!sessionUser) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const creds = await getPersonalImapCredentials(sessionUser.id).catch(() => null);
    if (!creds) return Response.json({ configured: false, emails: [], unread: 0 });

    try {
      const { messages, unseen } = await fetchImapEmails(creds);
      return Response.json({ unread: unseen, emails: messages, demo: false, configured: true });
    } catch {
      return Response.json({ unread: 0, emails: [], demo: false, configured: true, error: "Ligação falhou" });
    }
  }

  // Caixa global (comportamento por omissão)
  const creds = await getGlobalImapCredentials();
  if (!creds) return Response.json({ unread: DEMO_EMAILS.length, emails: DEMO_EMAILS, demo: true });

  try {
    const { messages, unseen } = await fetchImapEmails(creds);
    return Response.json({ unread: unseen, emails: messages, demo: false });
  } catch {
    return Response.json({ unread: DEMO_EMAILS.length, emails: DEMO_EMAILS, demo: true });
  }
}
