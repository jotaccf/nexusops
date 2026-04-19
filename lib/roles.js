export const ROLES = {
  logistica: {
    id: "logistica",
    label: "Logística",
    description: "Armazém, receção, picking, expedição, stock",
    accent: "#E4A853",
    dashboardPath: "/dashboard/logistica",
  },
  gestor: {
    id: "gestor",
    label: "Gestão",
    description: "Encomendas, leads, documentação fiscal, parceiros, marketing",
    accent: "#5B9FE4",
    dashboardPath: "/dashboard/admin",
  },
  admin: {
    id: "admin",
    label: "Administração",
    description: "Acesso total — utilizadores, permissões, integrações, sistema",
    accent: "#9B8FE4",
    dashboardPath: "/dashboard/config",
  },
};
