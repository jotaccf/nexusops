#!/bin/sh
set -e

echo "🔧 NexusOps — a iniciar..."

# Aplicar schema (idempotente — IF NOT EXISTS em todas as tabelas)
echo "📋 A aplicar schema..."
node -e "
import('postgres').then(({ default: postgres }) => {
  const sql = postgres(process.env.DATABASE_URL);
  import('fs').then(({ readFileSync }) => {
    const schema = readFileSync('./db/schema.sql', 'utf8');
    sql.unsafe(schema).then(() => {
      console.log('Schema OK');
      return sql.end();
    }).catch(e => { console.error('Schema falhou:', e.message); process.exit(1); });
  });
});
"

# Verificar se a tabela users está vazia — se sim, correr seed
echo "🌱 A verificar seed..."
node -e "
import('postgres').then(({ default: postgres }) => {
  const sql = postgres(process.env.DATABASE_URL);
  sql\`SELECT COUNT(*)::int AS c FROM users\`.then(([{ c }]) => {
    if (c === 0) {
      console.log('Tabela vazia — a correr seed...');
      import('./db/seed.js').then(() => sql.end());
    } else {
      console.log('Dados existentes (' + c + ' utilizadores) — seed ignorado.');
      sql.end();
    }
  }).catch(e => { console.error('Seed check falhou:', e.message); sql.end(); });
});
"

echo "🚀 A arrancar Next.js..."
exec node server.js
