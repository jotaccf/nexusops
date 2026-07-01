# Changelog — NexusOps

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [0.6.1] — 2026-07-01

### Fixed
- Drawer de artigos: comparador de dirty devolvia falso positivo em campos numéricos
  * BD guarda `NUMERIC` como string com trailing zeros (`"0.0350"`)
  * `<input type="number">` normaliza visualmente para `0.035` e dispara `onChange`
  * Comparação de strings dizia `dirty=true` sem o utilizador tocar em nada
  * Fix: comparação numérica com `parseFloat` + tolerância `< 1e-9`
- Aplicado em `computeDirty()` (badge "alterado" e aviso ao fechar) e em `saveDraft()` (que campos enviar no PATCH)
- Corrige aviso "Tens alterações não guardadas" ao abrir/fechar artigos sem editar

---

## [0.6.0] — 2026-07-01

### Added
- Drawer de artigos com **estado draft**: alterações acumuladas localmente antes de guardar
- Indicador visual "• alterado" no cabeçalho do drawer quando há alterações pendentes
- Botões **"Guardar alterações"** e **"Descartar"** sticky no fundo do drawer
- Aviso de confirmação ao mudar de artigo ou fechar drawer com alterações não guardadas
- Modal completo de **edição de utilizadores** no dashboard de configuração
- Editar nome, email, iniciais, perfil (role), password, estado activo
- Editar configuração IMAP pessoal do utilizador (colapsável)
- Botão "Editar" em cada linha da tabela de utilizadores

### Changed
- Drawer de artigos deixou de fazer auto-save on blur — todas as alterações precisam de confirmação explícita
- API `PATCH /api/users/[id]` estendida para aceitar `name`, `initials`, `email` e `password` (com bcrypt hash)

### Fixed
- **Safari cookie fix**: `secure: true` detectado dinamicamente (`x-forwarded-proto` ou protocolo do URL) em vez de estar hardcoded quando `NODE_ENV=production` — Safari rejeitava silenciosamente cookies secure em HTTP
- **Toggle mostrar password**: browsers com gestor de passwords bloqueavam a mudança de type — resolvido com `key` diferente para forçar re-mount + `autoComplete="new-password"`
- Password IMAP no formulário de criação com o mesmo padrão de re-mount

### Security
- Password de login usa `bcrypt.hash(12)` no servidor ao actualizar via PATCH
- Email duplicado devolve `409 Email já existe`
- Só admin pode editar/eliminar utilizadores

---

## [0.5.0] — 2026-06-08

### Added
- Importação de artigos via XLSX com fluxo seguro de 2 passos (validar → confirmar)
- Exportação de todos os artigos para XLSX (com massas e CTAB por região)
- Template XLSX descarregável com estrutura correcta e linha exemplo
- API `/api/products/export` (GET) — devolve XLSX
- API `/api/products/template` (GET) — devolve template vazio
- API `/api/products/import` (POST) — aceita FormData com `file` e `dryRun`
- Dependência `exceljs` para manipulação de ficheiros XLSX
- Modal de importação com preview: total, criar, actualizar, erros
- Validação rigorosa: SKU/Nome obrigatórios, números aceitam vírgula ou ponto
- Botões "↓ Exportar" e "↑ Importar" na toolbar da página /dashboard/artigos

### Security
- Importação restrita a `role === "admin"` (gestor não pode importar)
- CTABs vazios no XLSX não eliminam CTABs existentes na BD (preservativo)

---

## [0.4.0] — 2026-06-08

### Added
- Página dedicada `/dashboard/artigos` para gestão completa de produtos IEC
- Layout master-detail: tabela com semáforo de prontidão + drawer lateral de edição
- KPIs: total, activos, prontos para e-DA, sem CTAB completo
- Filtros: pesquisa livre, marca (ELFBAR/LOST MARY/ELFBAR CR), região sem CTAB, toggle inactivos
- Auto-save on blur com timestamp "✓ Guardado às HH:MM:SS"
- Eliminação com confirmação dupla (digitar SKU)
- Edição inline de todos os campos: SKU, nome, descrição, unidade, estado, massas, CTAB por região
- RBAC: gestor em modo read-only, admin com edição completa
- Entrada "Artigos" no menu lateral (admin + gestor)
- Seed.js inclui 26 produtos IEC com CTAB completo para CON/RAM/RAA

### Changed
- Secção de produtos removida de `/dashboard/config` (substituída por atalho "Gerir artigos →")
- `config/page.js` reduzido de 1159 para 977 linhas

### Fixed
- NIF do expedidor (Q02-01) no e-DA: sempre `PT01` independentemente do destino (era `PT02` para ilhas — bug que invalidava XML)

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
