import getDb, { DB_ENABLED } from "../db.js";

/**
 * Lê uma chave de configuração da tabela system_config.
 * Devolve null se não existir ou se DB não estiver disponível.
 */
export async function getConfig(key) {
  if (!DB_ENABLED) return null;
  try {
    const sql = getDb();
    const rows = await sql`SELECT value FROM system_config WHERE key = ${key}`;
    return rows.length > 0 ? rows[0].value : null;
  } catch {
    return null;
  }
}

/**
 * Grava ou actualiza uma chave de configuração (upsert).
 */
export async function setConfig(key, value) {
  if (!DB_ENABLED) throw new Error("Base de dados não configurada");
  const sql = getDb();
  await sql`
    INSERT INTO system_config (key, value, updated_at)
    VALUES (${key}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value,
          updated_at = NOW()
  `;
}

/**
 * Lê múltiplas chaves de uma vez.
 * Devolve objecto { key: value } — chaves em falta ficam null.
 */
export async function getConfigs(keys) {
  if (!DB_ENABLED) return Object.fromEntries(keys.map(k => [k, null]));
  try {
    const sql = getDb();
    const rows = await sql`SELECT key, value FROM system_config WHERE key = ANY(${keys})`;
    const map  = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return Object.fromEntries(keys.map(k => [k, map[k] ?? null]));
  } catch {
    return Object.fromEntries(keys.map(k => [k, null]));
  }
}
