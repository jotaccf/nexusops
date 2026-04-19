import { getTasks } from "../../../../lib/db/tasks";
import { getCalendarEvents } from "../../../../lib/db/events";

export const dynamic = "force-dynamic";

function padTwo(n) {
  return String(n).padStart(2, "0");
}

function toIcalDate(dateStr, timeStr) {
  const [y, m, d] = dateStr.split("-");
  const [hh, mm] = (timeStr || "09:00").split(":");
  return `${y}${padTwo(m)}${padTwo(d)}T${padTwo(hh)}${padTwo(mm)}00`;
}

function toIcalDateEnd(dateStr, timeStr) {
  const [y, m, d] = dateStr.split("-");
  const [hh, mm] = (timeStr || "09:00").split(":");
  const endHour = parseInt(hh, 10) + 1;
  return `${y}${padTwo(m)}${padTwo(d)}T${padTwo(endHour)}${padTwo(mm)}00`;
}

function escapeIcal(str) {
  return (str || "").replace(/[\\;,]/g, "\\$&").replace(/\n/g, "\\n");
}

const TYPE_CATEGORY = {
  "tarefa":    "TAREFA",
  "urgente":   "URGENTE",
  "reunião":   "REUNIÃO",
  "expedição": "EXPEDIÇÃO",
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  let tasks = [], calEvents = [];
  try {
    [tasks, calEvents] = await Promise.all([getTasks(), getCalendarEvents()]);
  } catch {
    return new Response("Base de dados indisponível", { status: 503 });
  }

  const events = [
    ...tasks.map(t => ({
      id:          t.id,
      title:       t.title,
      date:        t.date,
      time:        t.time,
      type:        t.type,
      description: t.assignee ? `Operador: ${t.assignee}` : "",
    })),
    ...calEvents.map(e => ({
      id:          e.id,
      title:       e.title,
      date:        e.date,
      time:        e.time,
      type:        e.type,
      description: "",
    })),
  ];

  const veventBlocks = events.map(ev => {
    const dtstart = toIcalDate(ev.date, ev.time);
    const dtend   = toIcalDateEnd(ev.date, ev.time);
    const cat     = TYPE_CATEGORY[ev.type] || "TAREFA";
    return [
      "BEGIN:VEVENT",
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${escapeIcal(ev.title)}`,
      ev.description ? `DESCRIPTION:${escapeIcal(ev.description)}` : "",
      `CATEGORIES:${cat}`,
      `UID:${ev.id}@nexusops`,
      "END:VEVENT",
    ].filter(Boolean).join("\r\n");
  });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NexusOps//Hub Operacional//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:NexusOps",
    ...veventBlocks,
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type":        "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="nexusops-calendario.ics"',
    },
  });
}
