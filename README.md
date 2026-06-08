# NexusOps — Hub Operacional

Hub operacional para empresa de distribuição (master importer), com geração de e-DA para a Autoridade Tributária portuguesa.

**Stack:** Next.js 16 (App Router) · JavaScript · PostgreSQL 17 · Docker · imapflow

---

## Instalação

### 🟢 Para iniciantes (passo-a-passo com explicações detalhadas)

👉 **[docs/INSTALL.md](docs/INSTALL.md)** — guia completo desde a instalação do Docker até ao primeiro login.

### ⚡ Para utilizadores avançados

```bash
git clone https://github.com/jotaccf/nexusops.git
cd nexusops
cp .env.example .env       # editar POSTGRES_PASSWORD e JWT_SECRET
docker compose up -d --build
```

Acessível em **http://localhost:3030**. Ver [docs/DEPLOY.md](docs/DEPLOY.md) para opções de produção.

---

## Funcionalidades

- **Dashboards por role** — Logística, Administração, Calendário, Configuração
- **Autenticação JWT** com 3 roles (admin / gestor / logística)
- **Gestão de utilizadores** com IMAP pessoal opcional
- **Calendário** com tarefas e atribuição por operador
- **Email IMAP** integrado (global + pessoal)
- **Exportação iCal** (RFC 5545)
- **Gestão de produtos IEC** com códigos CTAB por região (CON/RAM/RAA)
- **Geração de e-DA** (Documento Administrativo Eletrónico) — XML para portal da AT

---

## Contas pré-criadas (seed)

Password: `nexus2026`

| Email | Role |
|---|---|
| ana@empresa.pt | admin |
| pedro@empresa.pt | gestor |
| carlos@empresa.pt | logística |
| rita@empresa.pt | logística |

---

## Estrutura do projecto

```
nexusops/
├── app/
│   ├── api/                  — Routes (auth, users, tasks, products, eda, mail, ical, ...)
│   ├── dashboard/            — Páginas por role (logistica, admin, calendario, config, artigos)
│   └── login/                — Página de login
├── components/               — AppShell, MailWidget, shared (Card/Badge/KPICard/...)
├── lib/
│   ├── auth.js               — JWT
│   ├── db.js + db/           — Cliente postgres + módulos por entidade
│   ├── roles.js              — RBAC
│   └── dateUtils.js          — Timezone Europe/Lisbon
├── db/
│   ├── schema.sql            — Schema PostgreSQL (idempotente)
│   └── seed.js               — Dados iniciais (utilizadores, 26 produtos IEC, etc.)
├── docs/
│   ├── INSTALL.md            — Guia de instalação passo-a-passo
│   └── DEPLOY.md             — Deploy técnico e produção
├── docker-compose.yml        — Stack PostgreSQL + Next.js
├── Dockerfile                — Multi-stage build (deps → builder → runner)
└── entrypoint.sh             — Schema + seed automático no arranque
```

---

## Links

- **Repo:** https://github.com/jotaccf/nexusops
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)
- **Roadmap:** [ROADMAP.md](ROADMAP.md)
- **Versão actual:** ver [package.json](package.json)
