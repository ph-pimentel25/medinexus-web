import { getRoleDashboardPath, getRoleProfilePath, getRoleRequestsPath, type UserRole } from "./auth";

export function getNavigation(role: UserRole) {
  if (role === "public") return [
    { label: "Início", href: "/" }, { label: "Sobre", href: "/sobre" },
    { label: "Especialidades", href: "/especialidades" }, { label: "Clínicas", href: "/clinicas" },
    { label: "Profissionais", href: "/profissionais" }, { label: "Pacotes", href: "/pacotes" },
  ];
  const items = [
    { label: "Início", href: getRoleDashboardPath(role) },
    { label: "Consultas", href: getRoleRequestsPath(role) },
  ];
  if (role === "doctor") items.push({ label: "Agenda", href: "/medico/disponibilidade" });
  else if (role === "clinic") items.push({ label: "Médicos", href: "/clinica/medicos" });
  else items.push({ label: "Documentos", href: "/documentos" });
  items.push({ label: "Avaliações", href: "/avaliacoes" });
  items.push({ label: role === "clinic" ? "Clínica" : "Perfil", href: getRoleProfilePath(role) });
  return items;
}

export const roleLabels: Record<UserRole, string> = { public: "Visitante", patient: "Paciente", doctor: "Médico", clinic: "Clínica" };
export function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
}

// The compact bottom navigation stays at five items; the full menu exposes all areas.
export function getSidebarNavigation(role: UserRole) {
  if (role === "public") return getNavigation(role);
  const primary = getNavigation(role);
  const extra = role === "patient" ? [
    { label: "Buscar por disponibilidade", href: "/busca" },
    { label: "Rede cadastrada", href: "/profissionais" },
    { label: "Contatos na região", href: "/descobrir" },
    { label: "Histórico clínico", href: "/historico-clinico" },
  ] : role === "doctor" ? [
    { label: "Documentos emitidos", href: "/documentos-medicos" },
  ] : [
    { label: "Página da clínica", href: "/clinica/publico" },
    { label: "Convênios", href: "/clinica/planos" },
  ];
  return [...primary.slice(0, -1), ...extra, { label: "Notificações", href: "/notificacoes" }, primary[primary.length - 1]];
}
export function isWorkspacePath(path: string) {
  return !["/", "/sobre", "/especialidades", "/clinicas", "/profissionais", "/pacotes", "/login"].includes(path)
    && !path.includes("/cadastro") && !path.startsWith("/clinicas/") && !path.startsWith("/validar-documentos/");
}
