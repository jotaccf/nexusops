import getDb from "../db.js";

function toFormat(row) {
  return {
    id:    String(row.id),
    title: row.title,
    date:  row.date instanceof Date ? row.date.toISOString().split("T")[0] : row.date,
    time:  row.time,
    type:  row.type,
  };
}

export async function getCalendarEvents() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM calendar_events ORDER BY date, time`;
  return rows.map(toFormat);
}

export async function getCalendarEventsByRange(from, to) {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM calendar_events
    WHERE date >= ${from} AND date <= ${to}
    ORDER BY date, time
  `;
  return rows.map(toFormat);
}
