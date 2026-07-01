# Roadmap — NexusOps

Hub operacional para empresa de distribuição (master importer). Portugal, PT-PT.

---

## [x] Fase 1 — Fundações (concluída — 2026-04-20)

- [x] Setup Next.js 14/16 App Router, JavaScript, CSS-in-JS
- [x] Design system: COLORS, tipografia JetBrains Mono, componentes base
- [x] Autenticação JWT (jose), cookie httpOnly, middleware de protecção de rotas
- [x] Roles RBAC: admin / gestor / logistica
- [x] Schema PostgreSQL completo (users, orders, leads, alerts, partners, stock_critico, tasks, calendar_events, system_config)
- [x] Seed de operação com dados realistas e contas por role
- [x] Dockerização: multi-stage build, docker-compose, entrypoint idempotente
- [x] Fuso horário PT automático (Europe/Lisbon, DST via IANA)

## [x] Fase 2 — Dashboards operacionais (concluída — 2026-04-20)

- [x] Dashboard logística: KPIs, encomendas, leads, alertas, parceiros, stock crítico
- [x] Dashboard administração: visão geral operacional
- [x] Dashboard calendário: semana, tarefas do dia, criação e atribuição de tarefas
- [x] Dashboard configuração: gestão de utilizadores, integrações, iCal
- [x] Layout grid alinhado (4 colunas mestras)

## [x] Fase 3 — Integrações (concluída — 2026-04-20)

- [x] IMAP real (imapflow): global via system_config + pessoal por utilizador
- [x] Widget de email: últimos 5 recebidos, tabs Global/Pessoal, badge não lidos
- [x] Exportação iCal (RFC 5545)
- [x] Estrutura para integração Wisedat (API config guardada)

## [x] Fase 3.5 — IEC / e-DA (concluída — 2026-04-20)

- [x] Tabela de produtos com massas unitárias (bruta, líquida, tributável)
- [x] Códigos CTAB por região (CON/RAM/RAA) com upsert
- [x] Gerador XML e-DA validado no portal da AT
- [x] Modal 2 passos: artigos + dados documento/transporte
- [x] Seed 26 produtos (ELFBAR 600, LOST MARY BM600, ELFBAR CR600)

## [x] Fase 3.6 — Gestão dedicada de artigos (concluída — 2026-06-08)

- [x] Página `/dashboard/artigos` com layout master-detail
- [x] Filtros, semáforo de prontidão, KPIs
- [x] Auto-save on blur, eliminação com confirmação dupla
- [x] RBAC: gestor read-only, admin com edição completa
- [x] Correcção bug PT01 no NIF expedidor do e-DA
- [x] Limpeza de config/page.js (1159 → 977 linhas)

## [x] Fase 3.7 — Import/Export XLSX (concluída — 2026-06-08)

- [x] Exportação de todos os artigos para XLSX
- [x] Template XLSX descarregável
- [x] Importação com fluxo de 2 passos (validar → confirmar)
- [x] Preview do que vai ser criado/actualizado antes de executar
- [x] Detecção e reporte de erros por linha

## [x] Fase 3.8 — Melhorias UX (concluída — 2026-07-01)

- [x] Drawer de artigos com draft + Guardar/Descartar (evita gravar erros)
- [x] Aviso ao sair com alterações pendentes
- [x] Edição completa de utilizadores (nome, email, password, role, IMAP)
- [x] Fix Safari: cookie secure detectado dinamicamente
- [x] Fix toggle mostrar password (re-mount + autoComplete)

## [ ] Fase 4 — Funcionalidades avançadas

- [ ] Edição inline de encomendas e leads
- [ ] Notificações em tempo real (WebSocket ou polling)
- [ ] Filtros e pesquisa em dashboards
- [ ] Upload e gestão de documentos SAF-T
- [ ] Relatórios exportáveis (PDF/Excel)
- [ ] MFA (autenticação multi-factor)
- [ ] Logs de auditoria por utilizador
- [ ] Integração Wisedat completa (sync encomendas/docs XML)

## [ ] Fase 5 — Produção

- [ ] CI/CD pipeline (GitHub Actions)
- [ ] docker-compose.prod.yml com nginx reverse proxy
- [ ] Backups automáticos PostgreSQL
- [ ] Monitorização e alertas de sistema
- [ ] Documentação de operações (runbook)
