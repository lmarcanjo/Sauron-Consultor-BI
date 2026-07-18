/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * NavigationRegistry — F20.3
 *
 * Single source of truth for all navigation routes in SAURON.
 * Static tabs are registered at boot; Business Area tabs are registered
 * from ProjectDNA at runtime and cleared when the active company changes.
 *
 * No component should check for tab prefixes (startsWith("custom_area_"))
 * or consult VALID_TABS directly — all routing decisions use this registry.
 */

import type { BusinessAreaConfig } from "../business-intelligence/ConsultingModelRepository";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NavigationItemType =
  | "STATIC"       // Built-in tabs (enterprise_center, resumo, …)
  | "BUSINESS_AREA" // Consultant-defined area (custom_area_*)
  | "SYSTEM"       // Infrastructure tabs (qa_console, sdl_studio)
  | "LAB";         // Experimental / hidden

export type NavigationItemSource =
  | "STATIC"   // Registered at app boot
  | "DNA"      // Registered from active ProjectDNA
  | "SYSTEM";  // Registered by platform internals

export interface NavigationItemDefinition {
  /** Unique route key used as activeTab value */
  id: string;
  type: NavigationItemType;
  source: NavigationItemSource;
  label: string;
  iconKey: string;
  /** Which sidebar group this item belongs to */
  group: string;
  /** Render order within the group */
  order: number;
  visible: boolean;
  // ── Capability flags (read by PageCapabilityModel) ──────────────────────────
  /** Can render a meaningful UI even without an active dataset */
  canRenderWithoutDataset: boolean;
  /** Blocked by empty-state gate when no dataset exists */
  requiresDataset: boolean;
  /** Blocked by homologation gate when dataset is not yet approved */
  requiresApproval: boolean;
  /** Requires at least one confirmed field mapping */
  requiresConfiguredFields: boolean;
  // ── Access control ──────────────────────────────────────────────────────────
  /** e.g. "VIEW_AREA:comercial" — checked against userPermissions */
  requiredPermission?: string;
  /** If true, visible only to SUPER_ADMIN */
  adminOnly?: boolean;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

class NavigationRegistrySingleton {
  private readonly items = new Map<string, NavigationItemDefinition>();

  /** Register static (built-in) navigation items. Safe to call multiple times. */
  registerStatic(defs: NavigationItemDefinition[]): void {
    defs.forEach(item => this.items.set(item.id, { ...item, source: "STATIC" }));
  }

  /**
   * Register business areas from the active ProjectDNA.
   * Clears all previously registered DNA items before re-registering.
   */
  registerFromDNA(areas: BusinessAreaConfig[]): void {
    this.clearDynamic();
    areas.forEach((area, index) => {
      const id = `custom_area_${area.id}`;
      this.items.set(id, {
        id,
        type: "BUSINESS_AREA",
        source: "DNA",
        label: area.name,
        iconKey: area.iconKey || "Layers",
        group: "diagnosticar_negocio",
        order: 100 + (area.order ?? index),
        visible: area.visible,
        // Custom areas bypass data gates — they display readiness state instead
        canRenderWithoutDataset: true,
        requiresDataset: false,
        requiresApproval: false,
        requiresConfiguredFields: false,
        requiredPermission: `VIEW_AREA:${area.id}`,
      });
    });
  }

  /** Remove all DNA-registered items (call when active company changes). */
  clearDynamic(): void {
    for (const [key, item] of this.items.entries()) {
      if (item.source === "DNA") this.items.delete(key);
    }
  }

  /** Resolve a routeKey to its definition, or null if not registered. */
  resolve(routeKey: string): NavigationItemDefinition | null {
    return this.items.get(routeKey) ?? null;
  }

  /** Returns true if a routeKey is registered (static or dynamic). */
  isRegistered(routeKey: string): boolean {
    return this.items.has(routeKey);
  }

  /** Return all registered items, optionally filtered. */
  getAll(filter?: {
    source?: NavigationItemSource;
    type?: NavigationItemType;
    group?: string;
    visibleOnly?: boolean;
  }): NavigationItemDefinition[] {
    let all = Array.from(this.items.values());
    if (!filter) return all;
    if (filter.source) all = all.filter(i => i.source === filter.source);
    if (filter.type) all = all.filter(i => i.type === filter.type);
    if (filter.group) all = all.filter(i => i.group === filter.group);
    if (filter.visibleOnly) all = all.filter(i => i.visible);
    return all;
  }

  /** Total number of registered items (for diagnostics). */
  get size(): number {
    return this.items.size;
  }
}

export const navigationRegistry = new NavigationRegistrySingleton();

// ─── Static Registration ───────────────────────────────────────────────────────
// Defines capability flags for every built-in tab.
// Pattern: data-heavy tabs requiresDataset=true; infra/config tabs do not.

const STATIC_NAV_ITEMS: Omit<NavigationItemDefinition, "source">[] = [
  // ── Centro de Comando ─────────────────────────────────────────────────────
  { id: "enterprise_center",    type: "STATIC", label: "Empresas e Grupos",      iconKey: "Building",       group: "centro_comando",     order: 1,  visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "executive_workspace",  type: "STATIC", label: "Centro de Comando",      iconKey: "Briefcase",      group: "centro_comando",     order: 2,  visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  // ── Conhecer Cliente ─────────────────────────────────────────────────────
  { id: "digital_twin",         type: "STATIC", label: "Gêmeo Digital",          iconKey: "Network",        group: "conhecer_cliente",   order: 10, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "area_consultor",       type: "STATIC", label: "Projetos de Consultoria", iconKey: "FolderOpen",    group: "conhecer_cliente",   order: 11, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "modelo_consultivo",    type: "STATIC", label: "Modelo Consultivo",       iconKey: "Settings",      group: "conhecer_cliente",   order: 12, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  // ── Conectar Dados ───────────────────────────────────────────────────────
  { id: "importacao",           type: "STATIC", label: "Importar Planilhas",      iconKey: "FileText",      group: "conectar_dados",     order: 20, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "biblioteca_workbooks", type: "STATIC", label: "Biblioteca de Planilhas", iconKey: "FolderOpen",   group: "conectar_dados",     order: 21, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "banco_connector",      type: "STATIC", label: "Conectar Banco",          iconKey: "Server",        group: "conectar_dados",     order: 22, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "vpn_gateway",          type: "STATIC", label: "VPN Gateway",             iconKey: "Shield",        group: "conectar_dados",     order: 23, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "central_dados",        type: "STATIC", label: "Central de Dados",        iconKey: "Database",      group: "conectar_dados",     order: 24, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  // ── Diagnosticar Negócio (static) ────────────────────────────────────────
  { id: "resumo",               type: "STATIC", label: "Diagnóstico Executivo",   iconKey: "BarChart3",     group: "diagnosticar_negocio", order: 30, visible: true, canRenderWithoutDataset: false, requiresDataset: true,  requiresApproval: true,  requiresConfiguredFields: false },
  { id: "dre_inteligente",      type: "STATIC", label: "KPIs & DRE",              iconKey: "Target",        group: "diagnosticar_negocio", order: 31, visible: true, canRenderWithoutDataset: false, requiresDataset: true,  requiresApproval: true,  requiresConfiguredFields: false },
  { id: "financeiro",           type: "STATIC", label: "Financeiro",              iconKey: "Calculator",    group: "diagnosticar_negocio", order: 32, visible: true, canRenderWithoutDataset: false, requiresDataset: true,  requiresApproval: true,  requiresConfiguredFields: false },
  { id: "comercial",            type: "STATIC", label: "Comercial",               iconKey: "TrendingUp",    group: "diagnosticar_negocio", order: 33, visible: true, canRenderWithoutDataset: false, requiresDataset: true,  requiresApproval: true,  requiresConfiguredFields: false },
  { id: "obstaculos",           type: "STATIC", label: "Anomalias",               iconKey: "ShieldAlert",   group: "diagnosticar_negocio", order: 34, visible: true, canRenderWithoutDataset: false, requiresDataset: true,  requiresApproval: true,  requiresConfiguredFields: false },
  { id: "consultor_ia",         type: "STATIC", label: "Recomendações",           iconKey: "BrainCircuit",  group: "diagnosticar_negocio", order: 35, visible: true, canRenderWithoutDataset: false, requiresDataset: true,  requiresApproval: true,  requiresConfiguredFields: false },
  { id: "relatorios",           type: "STATIC", label: "Dossiês",                 iconKey: "FileText",      group: "diagnosticar_negocio", order: 36, visible: true, canRenderWithoutDataset: false, requiresDataset: true,  requiresApproval: true,  requiresConfiguredFields: false },
  { id: "vendedores",           type: "STATIC", label: "Vendedores",              iconKey: "Users",         group: "diagnosticar_negocio", order: 37, visible: true, canRenderWithoutDataset: false, requiresDataset: true,  requiresApproval: true,  requiresConfiguredFields: false },
  { id: "contabil",             type: "STATIC", label: "Contábil",                iconKey: "BookOpen",      group: "diagnosticar_negocio", order: 38, visible: true, canRenderWithoutDataset: false, requiresDataset: true,  requiresApproval: true,  requiresConfiguredFields: false },
  { id: "itens",                type: "STATIC", label: "Itens",                   iconKey: "Package",       group: "diagnosticar_negocio", order: 39, visible: true, canRenderWithoutDataset: false, requiresDataset: true,  requiresApproval: true,  requiresConfiguredFields: false },
  { id: "estoque",              type: "STATIC", label: "Estoque",                 iconKey: "Archive",       group: "diagnosticar_negocio", order: 40, visible: true, canRenderWithoutDataset: false, requiresDataset: true,  requiresApproval: true,  requiresConfiguredFields: false },
  { id: "comissoes",            type: "STATIC", label: "People Intelligence",     iconKey: "Users",         group: "diagnosticar_negocio", order: 41, visible: true, canRenderWithoutDataset: false, requiresDataset: true,  requiresApproval: true,  requiresConfiguredFields: false },
  { id: "operacoes_servicos",   type: "STATIC", label: "Operações & Serviços",    iconKey: "Settings",      group: "diagnosticar_negocio", order: 42, visible: true, canRenderWithoutDataset: false, requiresDataset: true,  requiresApproval: true,  requiresConfiguredFields: false },
  // ── Preparar Decisão ──────────────────────────────────────────────────────
  { id: "narrativa_executiva",  type: "STATIC", label: "Narrativa Executiva",     iconKey: "FileText",      group: "preparar_decisao",   order: 50, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "apresentacoes",        type: "STATIC", label: "Decks",                   iconKey: "Presentation",  group: "preparar_decisao",   order: 51, visible: true, canRenderWithoutDataset: false, requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "apresentacoes_templates", type: "STATIC", label: "Templates",            iconKey: "Layers",        group: "preparar_decisao",   order: 52, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "story_builder",        type: "STATIC", label: "Story Builder",           iconKey: "FileText",      group: "preparar_decisao",   order: 53, visible: true, canRenderWithoutDataset: false, requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  // ── Conduzir Sessão ───────────────────────────────────────────────────────
  { id: "preparacao_reuniao",   type: "STATIC", label: "Preparação da Reunião",   iconKey: "ClipboardList", group: "conduzir_sessao",    order: 60, visible: true, canRenderWithoutDataset: false, requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "modo_reuniao",         type: "STATIC", label: "Sessão Executiva",        iconKey: "MonitorPlay",   group: "conduzir_sessao",    order: 61, visible: true, canRenderWithoutDataset: false, requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "reuniao_ata",          type: "STATIC", label: "Ata & Decisões",          iconKey: "ClipboardList", group: "conduzir_sessao",    order: 62, visible: true, canRenderWithoutDataset: false, requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "reuniao_notes",        type: "STATIC", label: "Notas",                   iconKey: "FileText",      group: "conduzir_sessao",    order: 63, visible: true, canRenderWithoutDataset: false, requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "reuniao_decisoes",     type: "STATIC", label: "Decisões",                iconKey: "CheckSquare",   group: "conduzir_sessao",    order: 64, visible: true, canRenderWithoutDataset: false, requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "reuniao_perguntas",    type: "STATIC", label: "Perguntas",               iconKey: "HelpCircle",    group: "conduzir_sessao",    order: 65, visible: true, canRenderWithoutDataset: false, requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "reuniao_notas",        type: "STATIC", label: "Notas da Reunião",        iconKey: "FileText",      group: "conduzir_sessao",    order: 66, visible: true, canRenderWithoutDataset: false, requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  // ── Executar Plano ────────────────────────────────────────────────────────
  { id: "plano_executivo",      type: "STATIC", label: "Plano Executivo",         iconKey: "CheckSquare",   group: "executar_plano",     order: 70, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "plano_responsaveis",   type: "STATIC", label: "Responsáveis & Prazos",   iconKey: "Users",         group: "executar_plano",     order: 71, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "plano_prazos",         type: "STATIC", label: "Prazos",                  iconKey: "Calendar",      group: "executar_plano",     order: 72, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "plano_followup",       type: "STATIC", label: "Follow-up",               iconKey: "RefreshCw",     group: "executar_plano",     order: 73, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "plano_pendencias",     type: "STATIC", label: "Pendências",              iconKey: "AlertCircle",   group: "executar_plano",     order: 74, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  // ── Evoluir Resultado ─────────────────────────────────────────────────────
  { id: "historico_executivo",  type: "STATIC", label: "Histórico",               iconKey: "History",       group: "evoluir_resultado",  order: 80, visible: true, canRenderWithoutDataset: false, requiresDataset: true,  requiresApproval: true,  requiresConfiguredFields: false },
  { id: "comparativos_mensais", type: "STATIC", label: "Comparativos",            iconKey: "Layers",        group: "evoluir_resultado",  order: 81, visible: true, canRenderWithoutDataset: false, requiresDataset: true,  requiresApproval: true,  requiresConfiguredFields: false },
  { id: "fechamento_mensal",    type: "STATIC", label: "Evolução",                iconKey: "Calculator",    group: "evoluir_resultado",  order: 82, visible: true, canRenderWithoutDataset: false, requiresDataset: true,  requiresApproval: true,  requiresConfiguredFields: false },
  // ── Administração ─────────────────────────────────────────────────────────
  { id: "usuarios_twin",        type: "STATIC", label: "Usuários",                iconKey: "Users",         group: "administracao",      order: 90, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false, adminOnly: true },
  { id: "organizacao_twin",     type: "STATIC", label: "Organizações",            iconKey: "ShieldCheck",   group: "administracao",      order: 91, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false, adminOnly: true },
  { id: "permissoes_twin",      type: "STATIC", label: "Permissões",              iconKey: "Key",           group: "administracao",      order: 92, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false, adminOnly: true },
  { id: "perfis",               type: "STATIC", label: "Configurações",           iconKey: "Settings",      group: "administracao",      order: 93, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false, adminOnly: true },
  { id: "auditoria_logs",       type: "STATIC", label: "Auditoria",               iconKey: "History",       group: "administracao",      order: 94, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false, adminOnly: true },
  { id: "admin_security",       type: "STATIC", label: "Segurança",               iconKey: "Lock",          group: "administracao",      order: 95, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false, adminOnly: true },
  { id: "admin_invites",        type: "STATIC", label: "Convites",                iconKey: "UserPlus",      group: "administracao",      order: 96, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false, adminOnly: true },
  { id: "admin_shares",         type: "STATIC", label: "Compartilhamentos",       iconKey: "Share2",        group: "administracao",      order: 97, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false, adminOnly: true },
  // ── System / Lab ──────────────────────────────────────────────────────────
  { id: "sdl_studio",           type: "SYSTEM", label: "SDL Studio",              iconKey: "Code",          group: "system",             order: 200, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
  { id: "qa_console",           type: "LAB",    label: "QA Console",              iconKey: "Terminal",      group: "system",             order: 201, visible: true, canRenderWithoutDataset: true,  requiresDataset: false, requiresApproval: false, requiresConfiguredFields: false },
];

// Bootstrap: register all static items immediately
navigationRegistry.registerStatic(
  STATIC_NAV_ITEMS.map(item => ({ ...item, source: "STATIC" as const }))
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Check if a user has permission to access a navigation item.
 * Accepts permission strings like "VIEW_AREA:comercial" or "SUPER_ADMIN".
 */
export function checkNavigationPermission(
  item: NavigationItemDefinition,
  userRole: string,
  userPermissions: string[]
): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  if (item.adminOnly && userRole !== "SUPER_ADMIN") return false;
  if (!item.requiredPermission) return true;
  return (
    userPermissions.includes(item.requiredPermission) ||
    userPermissions.includes("VIEW_AREA:*") ||
    userPermissions.includes("SUPER_ADMIN")
  );
}

/**
 * Check dynamic area permission using granular action+areaId pattern.
 * e.g. checkAreaPermission("comercial", "VIEW", [...])
 */
export function checkAreaPermission(
  areaId: string,
  action: "VIEW" | "EDIT" | "CONFIGURE" | "EXPORT",
  userRole: string,
  userPermissions: string[]
): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  return (
    userPermissions.includes(`${action}_AREA:${areaId}`) ||
    userPermissions.includes(`${action}_AREA:*`)
  );
}
