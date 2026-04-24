# Changelog — NexusOps

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [0.3.0] — 2026-04-20

### Added
- Gestão de produtos IEC com códigos CTAB por região (CON/RAM/RAA)
- Tabelas BD: `products` (sku, nome, massas unitárias) e `product_ctab` (código CTAB, taxa, unidade IEC)
- API completa: `/api/products` (CRUD), `/api/products/[id]/ctab` (upsert/delete por região)
- Gerador de e-DA (Documento Administrativo Eletrónico) para o portal da AT
- API `/api/eda` — gera XML eDAA com encoding ISO-8859-1, download automático
- Modal e-DA em 2 passos: selecção de artigos + dados de documento/transporte
- Campos automáticos: data expedição (hoje+1), finalidade (1 CON / 2 ilhas), NIF prefixo (01/02)
- 26 produtos seed com CTAB para 3 regiões (ELFBAR 600, LOST MARY BM600, ELFBAR CR600)
- Secção de gestão de produtos no dashboard de configuração com edição inline CTAB

### Fixed
- Nomenclatura "ELFBAR600" corrigida para "ELFBAR 600" (com espaço)

---

## [0.2.0] — 2026-04-20

### Added
- Autenticação JWT com cookie httpOnly (`nexusops_token`), roles RBAC (admin / gestor / logística)
- Dashboard de logística com KPIs, encomendas, leads, alertas, parceiros e stock crítico
- Dashboard de administração com visão geral operacional
- Dashboard de configuração: gestão de utilizadores, integrações IMAP/Wisedat, iCal
- Dashboard de calendário: visão semanal, tarefas do dia, atribuição de tarefas por operador
- Criação e edição de tarefas com modal inline; popup de tarefas por utilizador
- Integração IMAP real (imapflow) — global via `system_config` + pessoal por utilizador
- Widget de email: últimos 5 recebidos, tabs Global/Pessoal, badge de não lidos
- Exportação iCal (RFC 5545) via `/api/cal/ical`
- API completa: `/api/tasks`, `/api/events`, `/api/users`, `/api/mail`, `/api/orders`, `/api/leads`, `/api/alerts`, `/api/config/imap`, `/api/config/wisedat`
- Schema PostgreSQL com tabelas: `users`, `orders`, `leads`, `alerts`, `partners`, `stock_critico`, `tasks`, `calendar_events`, `system_config`
- IMAP por utilizador: colunas opcionais `imap_host/port/user/password/tls` na tabela `users`
- Seed de operação com 4 contas genéricas por role (password: `nexus2026`)
- Dockerização completa: multi-stage build, `docker-compose.yml`, `entrypoint.sh` idempotente
- Fuso horário PT automático (`Europe/Lisbon`, DST via IANA) em cliente e servidor
- Design system: cores, tipografia JetBrains Mono, componentes partilhados (`Card`, `Badge`, `KPICard`, etc.)

### Changed
- Removidos todos os mocks do backend — APIs servem exclusivamente dados reais da BD
- Layout do calendário: grid mestre de 4 colunas alinhado com KPIs (3fr calendário + 1fr tarefas)
- KPIs do calendário dinâmicos (tarefas hoje, por atribuir, em atraso, concluídas esta semana)
- MailWidget: datas relativas com fallback para `dd/mm` em emails antigos

### Fixed
- `toYMD` com timezone explícito (`Intl` + `Europe/Lisbon`) — "hoje" correcto independente do fuso do sistema
- Chaves React duplicadas em `allItems` (tarefas + eventos com IDs numéricos iguais)
- Grid CSS `minmax(0, 1fr)` para impedir overflow do calendário semanal de 7 colunas
