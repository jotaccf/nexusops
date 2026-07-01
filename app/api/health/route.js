import { NextResponse } from "next/server";
import getDb from "../../../lib/db";

export const dynamic = "force-dynamic";

const START_TIME = Date.now();

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (mins) parts.push(`${mins}m`);
  parts.push(`${secs}s`);
  return parts.join(" ");
}

export async function GET() {
  const uptimeMs = Date.now() - START_TIME;

  let dbStatus = "unknown";
  let dbError = null;
  try {
    const sql = getDb();
    const [row] = await sql`SELECT 1 AS ok`;
    dbStatus = row?.ok === 1 ? "ok" : "error";
  } catch (err) {
    dbStatus = "error";
    dbError = err.message;
  }

  const body = {
    status: dbStatus === "ok" ? "healthy" : "degraded",
    version: process.env.APP_VERSION || process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
    uptime: formatUptime(uptimeMs),
    uptime_ms: uptimeMs,
    started_at: new Date(START_TIME).toISOString(),
    db: { status: dbStatus, ...(dbError ? { error: dbError } : {}) },
    node: process.version,
    env: process.env.NODE_ENV,
    tz: process.env.TZ || "system default",
    now: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: dbStatus === "ok" ? 200 : 503 });
}
