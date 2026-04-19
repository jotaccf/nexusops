export const CURRENT_USER = {
  id: "user-1", name: "Ana Duarte", initials: "AD",
  role: "admin",  // "logistica" | "gestor" | "admin"
  email: "ana@empresa.pt"
};

export const USERS = [
  { id: "user-1", name: "Ana Duarte",     initials: "AD", role: "admin",    active: true  },
  { id: "user-2", name: "Carlos Mendes",  initials: "CM", role: "logistica", active: true  },
  { id: "user-3", name: "Rita Sousa",     initials: "RS", role: "logistica", active: true  },
  { id: "user-4", name: "Pedro Ferreira", initials: "PF", role: "gestor",   active: true  },
];

export const ORDERS = [
  { id: "ENC-2401", cliente: "Distribuidor Norte", estado: "Em picking", prioridade: "Alta", parceiro: "Parceiro LX" },
  { id: "ENC-2402", cliente: "Retail Hub", estado: "Pendente stock", prioridade: "Média", parceiro: "Parceiro PT Centro" },
  { id: "ENC-2403", cliente: "Canal Farma", estado: "Pronta a expedir", prioridade: "Alta", parceiro: "Parceiro Porto" },
  { id: "ENC-2404", cliente: "Market Sul", estado: "A validar", prioridade: "Baixa", parceiro: "Parceiro Algarve" },
  { id: "ENC-2405", cliente: "Pharma Direct", estado: "Em picking", prioridade: "Alta", parceiro: "Parceiro LX" },
];

export const LEADS = [
  { id: "lead-1", nome: "Lead Campanha Abril", origem: "Landing page", estado: "Qualificado", destino: "Parceiro Norte" },
  { id: "lead-2", nome: "Pedido Distribuição B2B", origem: "Email", estado: "Em análise", destino: "Por atribuir" },
  { id: "lead-3", nome: "Lead Promo Novo SKU", origem: "Meta Ads", estado: "Encaminhado", destino: "Parceiro Lisboa" },
  { id: "lead-4", nome: "Lead Orgânico SEO", origem: "Website", estado: "Novo", destino: "Por atribuir" },
];

export const ALERTS = [
  { text: "Divergência de receção no lote LT-8821", severity: "high" },
  { text: "Falha XML em 2 docs para validação fiscal", severity: "high" },
  { text: "Rutura prevista SKU AX-440 em 48h", severity: "medium" },
  { text: "3 encomendas acima do SLA de expedição", severity: "medium" },
  { text: "Parceiro Algarve sem resposta há 72h", severity: "low" },
];

export const PARTNERS = [
  { nome: "Parceiro LX", sla: 97, encomendas: 42 },
  { nome: "Parceiro Porto", sla: 93, encomendas: 28 },
  { nome: "Parceiro Centro", sla: 89, encomendas: 19 },
  { nome: "Parceiro Algarve", sla: 78, encomendas: 8 },
];

export const STOCK_CRITICO = [
  { sku: "AX-440", quantidade: 2, nivel: "danger" },
  { sku: "BK-112", quantidade: 8, nivel: "warning" },
  { sku: "CL-903", quantidade: 11, nivel: "warning" },
];

export const TASKS = [
  { id: "t1", title: "Conferir receção lote LT-8820", date: "2026-04-15", time: "09:00", type: "tarefa", assignee: "user-2", role: "logistica", priority: "normal", done: true },
  { id: "t2", title: "Validar SAF-T com erro", date: "2026-04-15", time: "10:00", type: "urgente", assignee: "user-1", role: "gestor", priority: "urgent", done: false },
  { id: "t3", title: "Rotulagem lote BK-112", date: "2026-04-15", time: "11:00", type: "tarefa", assignee: "user-3", role: "logistica", priority: "normal", done: false },
  { id: "t4", title: "Encaminhar lead campanha Abril", date: "2026-04-15", time: "14:00", type: "tarefa", assignee: "user-1", role: "gestor", priority: "normal", done: false },
  { id: "t5", title: "Preparar expedição Dist. Norte", date: "2026-04-15", time: "16:00", type: "expedição", assignee: "user-2", role: "logistica", priority: "normal", done: false },
];

export const CALENDAR_EVENTS = [
  { id: "ev1", title: "Reunião equipa", date: "2026-04-14", time: "09:00", type: "reunião" },
  { id: "ev2", title: "Receção lote", date: "2026-04-14", time: "14:00", type: "tarefa" },
  { id: "ev3", title: "Call parceiro LX", date: "2026-04-16", time: "10:00", type: "reunião" },
  { id: "ev4", title: "Contagem cíclica", date: "2026-04-17", time: "09:00", type: "tarefa" },
  { id: "ev5", title: "Review leads", date: "2026-04-17", time: "15:00", type: "reunião" },
  { id: "ev6", title: "Expedição Centro", date: "2026-04-18", time: "10:00", type: "expedição" },
];

export const DEMO_EMAILS = [
  { id: "demo-1", from: "Distribuidor Norte", fromEmail: "encomendas@distnorte.pt", subject: "RE: Confirmação encomenda ENC-2406 — urgente", date: new Date(Date.now() - 12 * 60000).toISOString() },
  { id: "demo-2", from: "Parceiro LX", fromEmail: "operacoes@parceirolx.pt", subject: "Atualização stock SKU AX-440 e AX-441", date: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: "demo-3", from: "Autoridade Tributária", fromEmail: "noreply@at.gov.pt", subject: "Notificação — ficheiro SAF-T processado", date: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "demo-4", from: "Canal Farma", fromEmail: "compras@canalfarma.pt", subject: "Pedido de cotação — lote primavera 2026", date: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: "demo-5", from: "Wisedat Suporte", fromEmail: "suporte@wisedat.pt", subject: "Manutenção programada — 21 Abril 02:00-04:00", date: new Date(Date.now() - 5 * 3600000).toISOString() },
];
