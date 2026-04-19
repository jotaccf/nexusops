import getDb from "../db.js";

export async function getAllUsers() {
  const sql = getDb();
  const rows = await sql`SELECT id, name, initials, email, role, active FROM users ORDER BY id`;
  return rows;
}

export async function getUserByEmail(email) {
  const sql = getDb();
  const [user] = await sql`
    SELECT id, name, initials, email, password_hash, role, active
    FROM users WHERE email = ${email} LIMIT 1
  `;
  return user || null;
}

export async function createUser({ name, initials, email, passwordHash, role }) {
  const sql = getDb();
  const [user] = await sql`
    INSERT INTO users (name, initials, email, password_hash, role)
    VALUES (${name}, ${initials}, ${email}, ${passwordHash}, ${role})
    RETURNING id, name, initials, email, role, active
  `;
  return user;
}
