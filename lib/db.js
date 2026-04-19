import postgres from "postgres";

// Devolve true se a base de dados está configurada
export const DB_ENABLED = !!process.env.DATABASE_URL;

let _sql = null;

/**
 * Conexão singleton PostgreSQL.
 * Lança erro claro se DATABASE_URL não estiver definida.
 */
export function getDb() {
  if (!DB_ENABLED) {
    throw new Error("DATABASE_URL não configurada — a usar dados mock");
  }
  if (!_sql) {
    _sql = postgres(process.env.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return _sql;
}

export default getDb;
