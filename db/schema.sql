-- NexusOps — Schema PostgreSQL
-- Executar: psql -U postgres -d nexusops -f db/schema.sql

-- --------------------------------------------------------
-- Utilizadores
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  initials      VARCHAR(5)    NOT NULL,
  email         VARCHAR(255)  UNIQUE NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  role          VARCHAR(20)   NOT NULL CHECK (role IN ('admin', 'gestor', 'logistica')),
  active        BOOLEAN       DEFAULT true,
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- --------------------------------------------------------
-- Encomendas
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id          SERIAL PRIMARY KEY,
  reference   VARCHAR(50)   UNIQUE NOT NULL,
  cliente     VARCHAR(100)  NOT NULL,
  estado      VARCHAR(50)   NOT NULL,
  prioridade  VARCHAR(20)   NOT NULL,
  parceiro    VARCHAR(100),
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- --------------------------------------------------------
-- Leads
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(200)  NOT NULL,
  origem      VARCHAR(100),
  estado      VARCHAR(50)   NOT NULL,
  destino     VARCHAR(100),
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- --------------------------------------------------------
-- Alertas
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
  id          SERIAL PRIMARY KEY,
  text        TEXT          NOT NULL,
  severity    VARCHAR(10)   NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  resolved    BOOLEAN       DEFAULT false,
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- --------------------------------------------------------
-- Parceiros
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS partners (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(100)  NOT NULL,
  sla         INTEGER       NOT NULL DEFAULT 100,
  encomendas  INTEGER       NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- --------------------------------------------------------
-- Stock crítico
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_critico (
  id          SERIAL PRIMARY KEY,
  sku         VARCHAR(50)   UNIQUE NOT NULL,
  quantidade  INTEGER       NOT NULL DEFAULT 0,
  nivel       VARCHAR(10)   NOT NULL CHECK (nivel IN ('danger', 'warning')),
  updated_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- --------------------------------------------------------
-- Tarefas
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200)  NOT NULL,
  date        DATE          NOT NULL,
  time        VARCHAR(10),
  type        VARCHAR(20)   NOT NULL,
  assignee_id INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  role        VARCHAR(20)   NOT NULL,
  priority    VARCHAR(20)   NOT NULL DEFAULT 'normal',
  done        BOOLEAN       DEFAULT false,
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- --------------------------------------------------------
-- Eventos de calendário
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_events (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200)  NOT NULL,
  date        DATE          NOT NULL,
  time        VARCHAR(10),
  type        VARCHAR(20)   NOT NULL,
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- --------------------------------------------------------
-- Configurações do sistema (credenciais IMAP, Wisedat, etc.)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_config (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT         NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ  DEFAULT NOW()
);

-- --------------------------------------------------------
-- Migração: IMAP pessoal por utilizador (colunas opcionais)
-- --------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS imap_host     VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS imap_port     VARCHAR(10) DEFAULT '993';
ALTER TABLE users ADD COLUMN IF NOT EXISTS imap_user     VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS imap_password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS imap_tls      BOOLEAN DEFAULT true;

-- Índices
CREATE INDEX IF NOT EXISTS idx_tasks_date     ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_role     ON tasks(role);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_cal_date       ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_orders_estado  ON orders(estado);
CREATE INDEX IF NOT EXISTS idx_leads_estado   ON leads(estado);
