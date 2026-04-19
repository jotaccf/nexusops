import getDb from "../db.js";

function toFormat(row) {
  return {
    id:       String(row.id),
    title:    row.title,
    date:     row.date instanceof Date ? row.date.toISOString().split("T")[0] : row.date,
    time:     row.time,
    type:     row.type,
    assignee: row.assignee_id ? `user-${row.assignee_id}` : null,
    role:     row.role,
    priority: row.priority,
    done:     row.done,
  };
}

export async function getTasks({ role } = {}) {
  const sql = getDb();
  const rows = role && role !== "admin"
    ? await sql`SELECT * FROM tasks WHERE role = ${role} ORDER BY date, time`
    : await sql`SELECT * FROM tasks ORDER BY date, time`;
  return rows.map(toFormat);
}

export async function getTasksByDate(date) {
  const sql = getDb();
  const rows = await sql`SELECT * FROM tasks WHERE date = ${date} ORDER BY time`;
  return rows.map(toFormat);
}

export async function toggleTask(id, done) {
  const sql = getDb();
  const [row] = await sql`
    UPDATE tasks SET done = ${done} WHERE id = ${id} RETURNING *
  `;
  return toFormat(row);
}

export async function updateTask(id, fields) {
  const sql = getDb();
  const allowed = ["title", "date", "time", "type", "priority", "done", "role"];
  const sets = [];
  const values = [id];
  for (const f of allowed) {
    if (f in fields) {
      sets.push(`${f} = $${values.length + 1}`);
      values.push(fields[f]);
    }
  }
  if ("assigneeId" in fields) {
    sets.push(`assignee_id = $${values.length + 1}`);
    values.push(fields.assigneeId || null);
  }
  if (!sets.length) throw new Error("Nenhum campo para actualizar");
  const [row] = await sql.unsafe(
    `UPDATE tasks SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
    values
  );
  return toFormat(row);
}

export async function deleteTask(id) {
  const sql = getDb();
  await sql`DELETE FROM tasks WHERE id = ${id}`;
}

export async function createTask({ title, date, time, type, assigneeId, role, priority }) {
  const sql = getDb();
  const [row] = await sql`
    INSERT INTO tasks (title, date, time, type, assignee_id, role, priority)
    VALUES (${title}, ${date}, ${time}, ${type}, ${assigneeId || null}, ${role}, ${priority || "normal"})
    RETURNING *
  `;
  return toFormat(row);
}
