// Demo credentials — substitua por base de dados real em produção
// Todos os utilizadores demo partilham a password: nexus2026

export const MOCK_USERS_AUTH = [
  { id: "user-1", name: "Ana Duarte",      initials: "AD", role: "admin",     email: "ana@empresa.pt",    active: true },
  { id: "user-2", name: "Carlos Mendes",   initials: "CM", role: "logistica", email: "carlos@empresa.pt", active: true },
  { id: "user-3", name: "Rita Sousa",      initials: "RS", role: "logistica", email: "rita@empresa.pt",   active: true },
  { id: "user-4", name: "Pedro Ferreira",  initials: "PF", role: "gestor",    email: "pedro@empresa.pt",  active: true  },
];

const PASSWORDS = {
  "ana@empresa.pt":    "nexus2026",
  "carlos@empresa.pt": "nexus2026",
  "rita@empresa.pt":   "nexus2026",
  "pedro@empresa.pt":  "nexus2026",
};

/**
 * Valida credenciais e devolve o utilizador (sem password) ou null.
 */
export function validateCredentials(email, password) {
  const expected = PASSWORDS[email];
  if (!expected || expected !== password) return null;

  const user = MOCK_USERS_AUTH.find(u => u.email === email);
  if (!user || !user.active) return null;

  return {
    id:       user.id,
    name:     user.name,
    initials: user.initials,
    role:     user.role,
    email:    user.email,
  };
}
