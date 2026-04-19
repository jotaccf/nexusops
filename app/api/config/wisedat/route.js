import { NextResponse } from "next/server";
import { getConfigs, setConfig } from "../../../../lib/db/config.js";
import { DB_ENABLED } from "../../../../lib/db.js";

const KEYS = ["wisedat_url", "wisedat_api_key", "wisedat_username", "wisedat_password", "wisedat_token"];

// GET — devolve configuração sem expor password nem token completo
export async function GET() {
  if (!DB_ENABLED) {
    return NextResponse.json({ configured: false, demo: true });
  }

  const cfg = await getConfigs(KEYS);
  const token = cfg.wisedat_token || "";

  return NextResponse.json({
    url:        cfg.wisedat_url      || "",
    apiKey:     cfg.wisedat_api_key  || "",
    username:   cfg.wisedat_username || "",
    password:   cfg.wisedat_password ? "••••••••" : "",
    hasToken:   !!token,
    tokenPreview: token ? `${token.slice(0, 20)}…` : "",
    configured: !!cfg.wisedat_url && !!cfg.wisedat_api_key && !!token,
  });
}

// POST — grava configuração e/ou token
export async function POST(req) {
  if (!DB_ENABLED) {
    return NextResponse.json({ error: "Base de dados não configurada" }, { status: 503 });
  }

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const { url, apiKey, username, password, token } = body || {};

  if (url)      await setConfig("wisedat_url",      url);
  if (apiKey)   await setConfig("wisedat_api_key",  apiKey);
  if (username) await setConfig("wisedat_username", username);
  if (password && password !== "••••••••") {
    await setConfig("wisedat_password", password);
  }
  if (token)    await setConfig("wisedat_token", token);

  return NextResponse.json({ ok: true });
}
