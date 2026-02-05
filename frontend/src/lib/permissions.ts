/**
 * Sistema de Permissões NexaCore
 * 
 * Define o que cada role pode fazer no sistema
 */

export type Permission = 
  // Dashboard
  | "dashboard:view"
  | "dashboard:analytics"
  
  // Inbox
  | "inbox:view"
  | "inbox:view_all"      // Ver todas as conversas
  | "inbox:view_own"      // Ver só as próprias
  | "inbox:reply"
  | "inbox:assign"
  | "inbox:ai_toggle"
  
  // Appointments
  | "appointments:view"
  | "appointments:view_all"
  | "appointments:view_own"
  | "appointments:create"
  | "appointments:edit"
  | "appointments:cancel"
  
  // Clients
  | "clients:view"
  | "clients:create"
  | "clients:edit"
  | "clients:delete"
  
  // Services
  | "services:view"
  | "services:create"
  | "services:edit"
  | "services:delete"
  
  // Professionals
  | "professionals:view"
  | "professionals:create"
  | "professionals:edit"
  | "professionals:delete"
  
  // Products/Stock
  | "products:view"
  | "products:view_all"
  | "products:view_own"
  | "products:create"
  | "products:edit"
  | "products:manage_stock"
  
  // Team
  | "team:view"
  | "team:invite"
  | "team:edit_roles"
  | "team:remove"
  
  // Settings
  | "settings:view"
  | "settings:edit"
  | "settings:whatsapp"
  | "settings:ai"
  | "settings:billing"
  
  // Payments
  | "payments:view"
  | "payments:create"
  | "payments:manage"
  
  // Reports
  | "reports:view"
  | "reports:export";

// Permissões por role
const rolePermissions: Record<string, Permission[]> = {
  OWNER: [
    // Tudo
    "dashboard:view",
    "dashboard:analytics",
    "inbox:view",
    "inbox:view_all",
    "inbox:reply",
    "inbox:assign",
    "inbox:ai_toggle",
    "appointments:view",
    "appointments:view_all",
    "appointments:create",
    "appointments:edit",
    "appointments:cancel",
    "clients:view",
    "clients:create",
    "clients:edit",
    "clients:delete",
    "services:view",
    "services:create",
    "services:edit",
    "services:delete",
    "professionals:view",
    "professionals:create",
    "professionals:edit",
    "professionals:delete",
    "products:view",
    "products:view_all",
    "products:create",
    "products:edit",
    "products:manage_stock",
    "team:view",
    "team:invite",
    "team:edit_roles",
    "team:remove",
    "settings:view",
    "settings:edit",
    "settings:whatsapp",
    "settings:ai",
    "settings:billing",
    "payments:view",
    "payments:create",
    "payments:manage",
    "reports:view",
    "reports:export",
  ],
  
  ADMIN: [
    // Quase tudo, exceto billing
    "dashboard:view",
    "dashboard:analytics",
    "inbox:view",
    "inbox:view_all",
    "inbox:reply",
    "inbox:assign",
    "inbox:ai_toggle",
    "appointments:view",
    "appointments:view_all",
    "appointments:create",
    "appointments:edit",
    "appointments:cancel",
    "clients:view",
    "clients:create",
    "clients:edit",
    "clients:delete",
    "services:view",
    "services:create",
    "services:edit",
    "services:delete",
    "professionals:view",
    "professionals:create",
    "professionals:edit",
    "products:view",
    "products:view_all",
    "products:create",
    "products:edit",
    "products:manage_stock",
    "team:view",
    "team:invite",
    "settings:view",
    "settings:edit",
    "settings:whatsapp",
    "settings:ai",
    "payments:view",
    "payments:create",
    "reports:view",
    "reports:export",
  ],
  
  RECEPTIONIST: [
    // Inbox, calendários, clientes
    "dashboard:view",
    "inbox:view",
    "inbox:view_all",
    "inbox:reply",
    "inbox:assign",
    "appointments:view",
    "appointments:view_all",
    "appointments:create",
    "appointments:edit",
    "appointments:cancel",
    "clients:view",
    "clients:create",
    "clients:edit",
    "services:view",
    "professionals:view",
    "products:view",
    "products:view_all",
    "payments:view",
    "payments:create",
  ],
  
  PROFESSIONAL: [
    // Só própria agenda e inbox relacionado
    "dashboard:view",
    "inbox:view",
    "inbox:view_own",
    "inbox:reply",
    "appointments:view",
    "appointments:view_own",
    "appointments:edit",
    "clients:view",
    "services:view",
    "professionals:view",
    "products:view",
    "products:view_own",
    "products:create",
    "products:edit",
    "products:manage_stock",
  ],
};

/**
 * Verifica se um role tem uma permissão específica
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = rolePermissions[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Retorna todas as permissões de um role
 */
export function getPermissions(role: string): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Verifica se role pode ver tudo ou só o próprio
 */
export function canViewAll(role: string, resource: "inbox" | "appointments" | "products"): boolean {
  const viewAllPermission = `${resource}:view_all` as Permission;
  return hasPermission(role, viewAllPermission);
}

/**
 * Menu items disponíveis por role
 */
export function getMenuItems(role: string): string[] {
  const menuByRole: Record<string, string[]> = {
    OWNER: [
      "dashboard",
      "inbox",
      "appointments",
      "clients",
      "services",
      "professionals",
      "products",
      "payments",
      "team",
      "settings",
      "ai-assistant",
    ],
    ADMIN: [
      "dashboard",
      "inbox",
      "appointments",
      "clients",
      "services",
      "professionals",
      "products",
      "payments",
      "team",
      "settings",
      "ai-assistant",
    ],
    RECEPTIONIST: [
      "dashboard",
      "inbox",
      "appointments",
      "clients",
      "products",
      "payments",
    ],
    PROFESSIONAL: [
      "dashboard",
      "inbox",
      "appointments",
      "clients",
      "products",
    ],
  };
  
  return menuByRole[role] || [];
}

/**
 * Labels amigáveis para roles
 */
export const roleLabels: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  RECEPTIONIST: "Recepcionista",
  PROFESSIONAL: "Profissional",
};

/**
 * Descrições dos roles
 */
export const roleDescriptions: Record<string, string> = {
  OWNER: "Acesso total ao sistema, incluindo configurações e cobrança",
  ADMIN: "Acesso total exceto configurações de cobrança",
  RECEPTIONIST: "Gerencia inbox, agendamentos e clientes",
  PROFESSIONAL: "Acesso apenas à própria agenda, inbox e produtos",
};
