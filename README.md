# NexusOps — Hub Operacional

Hub operacional para empresa de distribuição (master importer). Construído em Next.js 14 com App Router.

---

## Requisitos

- Node >= 18
- npm >= 9

---

## Instalação

```bash
npm install
npm run dev
```

A aplicação arranca em [http://localhost:3000](http://localhost:3000).

---

## Configuração IMAP (opcional)

Para ligar a uma caixa de email real, cria um ficheiro `.env.local` na raiz do projecto:

```env
IMAP_HOST=mail.exemplo.pt
IMAP_PORT=993
IMAP_USER=operacoes@exemplo.pt
IMAP_PASSWORD=password
IMAP_TLS=true
IMAP_POLL_INTERVAL=60
```

Sem este ficheiro, o widget de email funciona em **modo demo** com dados de exemplo.

---

## Estrutura do projecto

```
nexusops/
├── app/
│   ├── layout.js                    — Root layout (fonts, favicon)
│   ├── globals.css                  — Reset, animações, scrollbar
│   ├── page.js                      — Redireciona para dashboard do role atual
│   ├── dashboard/
│   │   ├── logistica/page.js        — Dashboard Logística
│   │   ├── admin/page.js            — Dashboard Administração
│   │   ├── config/page.js           — Dashboard Configuração
│   │   └── calendario/page.js       — Calendário + Tarefas
│   └── api/
│       ├── mail/route.js            — API IMAP (emails não lidos)
│       └── cal/ical/route.js        — API geração .ics
├── components/
│   ├── shared.js                    — Design system (Badge, Card, KPICard, …)
│   ├── AppShell.jsx                 — Header + nav por role
│   ├── Logo.jsx                     — LogoIcon, LogoFull, LogoHeader
│   ├── MailWidget.jsx               — Widget email IMAP com auto-refresh
│   └── TasksWidget.jsx              — Widget compacto de tarefas
├── lib/
│   ├── colors.js                    — COLORS, font, mono
│   ├── roles.js                     — Roles e permissões
│   └── mockData.js                  — Dados mock centralizados
├── public/
│   └── favicon.svg                  — Favicon Hex Hub
└── docs/                            — Especificação completa
```

---

## Como alterar o role para testar

Abrir `lib/mockData.js` e alterar o valor de `CURRENT_USER.role`:

```js
export const CURRENT_USER = {
  id: "user-1", name: "Ana Duarte", initials: "AD",
  role: "config",  // "logistica" | "admin" | "config"
  email: "ana@empresa.pt"
};
```

| Role | Dashboard | Acesso |
|------|-----------|--------|
| `logistica` | `/dashboard/logistica` | Armazém, picking, stock, expedição |
| `admin` | `/dashboard/admin` | Leads, docs fiscais, parceiros, encomendas |
| `config` | `/dashboard/config` | Todos os dashboards + utilizadores + integrações |

---

## APIs

| Rota | Descrição |
|------|-----------|
| `GET /api/mail` | Emails não lidos via IMAP. Modo demo se não configurado. |
| `GET /api/cal/ical?token=TOKEN` | Exporta calendário em formato .ics (RFC 5545) |
