/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlatformUser, Organization, Workspace, Permission } from "../identity/types";

export interface ContextEntity {
  id: string;
  type: 'organization' | 'case' | 'group' | 'company' | 'store' | 'vendedor' | 'presentation' | 'reunion' | 'other';
  name: string;
  metadata?: Record<string, any>;
}

export type ContextScope = 'global' | 'organization' | 'workspace' | 'store' | 'vendedor' | 'custom';

export interface ContextPeriod {
  id: string;
  name: string; // e.g., "Junho/2026"
  startDate?: string;
  endDate?: string;
}

export interface ContextSelection {
  entityId: string | null;
  entityType: ContextEntity['type'] | null;
}

export interface ContextTab {
  id: string;
  label: string;
  icon?: string; // lucide icon name
  badge?: string | number;
  disabled?: boolean;
}

export interface ContextAction {
  id: string;
  label: string;
  icon: string; // lucide icon name
  actionType: string; // e.g. "create_case", "create_narrative", "new_seller", etc.
  requiredPermissions: Permission[];
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
}

export interface ContextActivity {
  id: string;
  title: string;
  description: string;
  category: 'data_imported' | 'db_synced' | 'diagnostic_generated' | 'decision_created' | 'decision_approved' | 'session_realized' | 'narrative_created' | 'plan_created' | 'action_completed' | 'dossier_generated' | 'commission_approved' | 'pdf_exported' | 'system';
  timestamp: string;
  user: {
    name: string;
    avatarUrl?: string;
  };
  contextTags: {
    orgId?: string;
    caseId?: string;
    companyId?: string;
    vendedorId?: string;
  };
}

export interface ContextRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  type: 'alert' | 'action' | 'insight';
  actionLabel?: string;
  actionId?: string;
}

export interface ContextBreadcrumb {
  id: string;
  label: string;
  type: ContextEntity['type'];
  entityId: string;
}

export interface ContextPanelState {
  isOpen: boolean;
  activeSection: string;
}

export interface WorkspaceContext {
  currentUser: PlatformUser;
  currentOrganization: Organization;
  currentCase: { id: string; name: string } | null;
  currentWorkspace: Workspace | null;
  currentPeriod: ContextPeriod | null;
  segmento: string | null;
  grupo: string | null;
  empresa: string | null;
  CNPJ: string | null;
  marca: string | null;
  loja: string | null;
  departamento: string | null;
  centroDeCusto: string | null;
  vendedor: { id: string; name: string; role?: string } | null;
  permissions: Permission[];
  filtrosAtivos: Record<string, string[] | undefined>;
  fonteDeDadosAtiva: string;
  dataMode: 'real';
  escopoDeAcesso: ContextScope;
  entidadeSelecionada: ContextEntity | null;
}
