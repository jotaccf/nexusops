/**
 * Seed de operação — NexusOps
 * Executar após criar o schema:  node db/seed.js
 *
 * Contas criadas (password: nexus2026):
 *   admin     → ana@empresa.pt
 *   gestor    → pedro@empresa.pt
 *   logistica → carlos@empresa.pt
 *   logistica → rita@empresa.pt
 */

import postgres from "postgres";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL não definida.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

// Datas relativas a hoje
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
const D0 = daysFromNow(0);   // hoje
const D1 = daysFromNow(1);   // amanhã
const D2 = daysFromNow(2);
const D7 = daysFromNow(7);
const Dm1 = daysFromNow(-1); // ontem

async function seed() {
  console.log("A iniciar seed...");

  // ── Utilizadores ──────────────────────────────────────────────────────────
  const hash = await bcrypt.hash("nexus2026", 12);

  await sql`
    INSERT INTO users (name, initials, email, password_hash, role, active) VALUES
      ('Ana Duarte',     'AD', 'ana@empresa.pt',    ${hash}, 'admin',     true),
      ('Pedro Ferreira', 'PF', 'pedro@empresa.pt',  ${hash}, 'gestor',    true),
      ('Carlos Mendes',  'CM', 'carlos@empresa.pt', ${hash}, 'logistica', true),
      ('Rita Sousa',     'RS', 'rita@empresa.pt',   ${hash}, 'logistica', true)
    ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          initials = EXCLUDED.initials,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          active = EXCLUDED.active
  `;
  console.log("✓ Utilizadores (ana, pedro, carlos, rita) — password: nexus2026");

  // ── IDs para foreign keys ──────────────────────────────────────────────────
  const users = await sql`SELECT id, email FROM users ORDER BY id`;
  const uid = {};
  for (const u of users) uid[u.email] = u.id;

  // ── Encomendas ─────────────────────────────────────────────────────────────
  await sql`
    INSERT INTO orders (reference, cliente, estado, prioridade, parceiro) VALUES
      ('ENC-2401', 'Distribuidor Norte', 'Em picking',       'Alta',  'Parceiro LX'),
      ('ENC-2402', 'Retail Hub',         'Pendente stock',   'Média', 'Parceiro PT Centro'),
      ('ENC-2403', 'Canal Farma',        'Pronta a expedir', 'Alta',  'Parceiro Porto'),
      ('ENC-2404', 'Market Sul',         'A validar',        'Baixa', 'Parceiro Algarve'),
      ('ENC-2405', 'Pharma Direct',      'Em picking',       'Alta',  'Parceiro LX')
    ON CONFLICT (reference) DO NOTHING
  `;
  console.log("✓ Encomendas");

  // ── Leads ──────────────────────────────────────────────────────────────────
  await sql`
    INSERT INTO leads (nome, origem, estado, destino) VALUES
      ('Lead Campanha Abril',     'Landing page', 'Qualificado', 'Parceiro Norte'),
      ('Pedido Distribuição B2B', 'Email',        'Em análise',  'Por atribuir'),
      ('Lead Promo Novo SKU',     'Meta Ads',     'Encaminhado', 'Parceiro Lisboa'),
      ('Lead Orgânico SEO',       'Website',      'Novo',        'Por atribuir')
    ON CONFLICT DO NOTHING
  `;
  console.log("✓ Leads");

  // ── Alertas ────────────────────────────────────────────────────────────────
  await sql`
    INSERT INTO alerts (text, severity) VALUES
      ('Divergência de receção no lote LT-8821',    'high'),
      ('Falha XML em 2 docs para validação fiscal',  'high'),
      ('Rutura prevista SKU AX-440 em 48h',          'medium'),
      ('3 encomendas acima do SLA de expedição',     'medium'),
      ('Parceiro Algarve sem resposta há 72h',       'low')
    ON CONFLICT DO NOTHING
  `;
  console.log("✓ Alertas");

  // ── Parceiros ──────────────────────────────────────────────────────────────
  await sql`
    INSERT INTO partners (nome, sla, encomendas) VALUES
      ('Parceiro LX',      97, 42),
      ('Parceiro Porto',   93, 28),
      ('Parceiro Centro',  89, 19),
      ('Parceiro Algarve', 78,  8)
    ON CONFLICT DO NOTHING
  `;
  console.log("✓ Parceiros");

  // ── Stock crítico ──────────────────────────────────────────────────────────
  await sql`
    INSERT INTO stock_critico (sku, quantidade, nivel) VALUES
      ('AX-440',  2, 'danger'),
      ('BK-112',  8, 'warning'),
      ('CL-903', 11, 'warning')
    ON CONFLICT (sku) DO NOTHING
  `;
  console.log("✓ Stock crítico");

  // ── Tarefas (datas relativas a hoje) ──────────────────────────────────────
  await sql`
    INSERT INTO tasks (title, date, time, type, assignee_id, role, priority, done) VALUES
      ('Conferir receção lote LT-8820',  ${Dm1}, '09:00', 'tarefa',    ${uid['carlos@empresa.pt']}, 'logistica', 'normal', true),
      ('Validar SAF-T com erro',         ${D0},  '10:00', 'urgente',   ${uid['pedro@empresa.pt']},  'gestor',    'urgent', false),
      ('Rotulagem lote BK-112',          ${D0},  '11:00', 'tarefa',    ${uid['rita@empresa.pt']},   'logistica', 'normal', false),
      ('Encaminhar lead campanha',       ${D0},  '14:00', 'tarefa',    ${uid['pedro@empresa.pt']},  'gestor',    'normal', false),
      ('Preparar expedição Dist. Norte', ${D0},  '16:00', 'expedição', ${uid['carlos@empresa.pt']}, 'logistica', 'normal', false),
      ('Reunião revisão stock',          ${D1},  '09:00', 'reunião',   ${uid['ana@empresa.pt']},    'admin',     'normal', false),
      ('Auditoria lote BK-112',          ${D1},  '11:00', 'tarefa',    ${uid['rita@empresa.pt']},   'logistica', 'normal', false),
      ('Review pipeline leads',          ${D2},  '10:00', 'tarefa',    ${uid['pedro@empresa.pt']},  'gestor',    'normal', false),
      ('Expedição Canal Farma',          ${D2},  '14:00', 'expedição', ${uid['carlos@empresa.pt']}, 'logistica', 'urgent', false),
      ('Reunião parceiro LX',            ${D7},  '15:00', 'reunião',   ${uid['ana@empresa.pt']},    'admin',     'normal', false)
    ON CONFLICT DO NOTHING
  `;
  console.log("✓ Tarefas");

  // ── Eventos de calendário ──────────────────────────────────────────────────
  await sql`
    INSERT INTO calendar_events (title, date, time, type) VALUES
      ('Reunião equipa',    ${D0}, '09:00', 'reunião'),
      ('Receção lote',      ${D1}, '14:00', 'tarefa'),
      ('Call parceiro LX',  ${D2}, '10:00', 'reunião'),
      ('Contagem cíclica',  ${D2}, '09:00', 'tarefa'),
      ('Review leads',      ${D7}, '15:00', 'reunião'),
      ('Expedição Centro',  ${D7}, '10:00', 'expedição')
    ON CONFLICT DO NOTHING
  `;
  console.log("✓ Eventos de calendário");

  console.log("\n✅ Seed concluído.");
  console.log("   Contas disponíveis (password: nexus2026):");
  console.log("   admin     → ana@empresa.pt");
  console.log("   gestor    → pedro@empresa.pt");
  console.log("   logistica → carlos@empresa.pt");
  console.log("   logistica → rita@empresa.pt");

  await sql.end();
}

seed().catch(err => {
  console.error("Erro no seed:", err.message);
  process.exit(1);
});
