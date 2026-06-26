/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Permission, Role } from "./types";

export interface PermissionInfo {
  permission: Permission;
  title: string;
  description: string;
}

export class PermissionManager {
  private static instance: PermissionManager;

  private permissions: Record<Permission, PermissionInfo> = {
    "workspace.view": {
      permission: "workspace.view",
      title: "Visualizar Workspace",
      description: "Permite acessar e visualizar o dashboard principal do workspace."
    },
    "workspace.manage": {
      permission: "workspace.manage",
      title: "Gerenciar Workspace",
      description: "Permite alterar configurações, convidar usuários e editar estrutura do workspace."
    },
    "data.view": {
      permission: "data.view",
      title: "Visualizar Dados",
      description: "Permite ler dados importados, conciliações e catálogo de dados."
    },
    "data.import": {
      permission: "data.import",
      title: "Importar Dados",
      description: "Permite fazer upload de planilhas Excel/CSV ou conectar bancos ERP."
    },
    "data.sync": {
      permission: "data.sync",
      title: "Sincronizar Dados",
      description: "Permite rodar rotinas de consolidação e ingestão automática do banco."
    },
    "data.approve": {
      permission: "data.approve",
      title: "Aprovar Lançamentos",
      description: "Permite homologar conciliações manuais e aprovar balancetes."
    },
    "analytics.view": {
      permission: "analytics.view",
      title: "Visualizar Análises",
      description: "Permite ver DRE, EBITDA e insights estatísticos do negócio."
    },
    "analytics.manage": {
      permission: "analytics.manage",
      title: "Gerenciar Regras Analíticas",
      description: "Permite configurar alertas de faturamento e margens mínimas."
    },
    "presentation.view": {
      permission: "presentation.view",
      title: "Ver Apresentações",
      description: "Permite assistir ou navegar nos slides gerados de reuniões."
    },
    "presentation.create": {
      permission: "presentation.create",
      title: "Criar Apresentações",
      description: "Permite gerar novos pacotes de decks para rituais de conselho."
    },
    "presentation.edit": {
      permission: "presentation.edit",
      title: "Editar Apresentações",
      description: "Permite reorganizar slides, alterar títulos e anotações."
    },
    "presentation.approve": {
      permission: "presentation.approve",
      title: "Homologar Decks",
      description: "Permite assinar o deck aprovado pelo conselho consultivo."
    },
    "meeting.view": {
      permission: "meeting.view",
      title: "Acompanhar Reuniões",
      description: "Permite visualizar as pautas e atas de rituais estratégicos."
    },
    "meeting.host": {
      permission: "meeting.host",
      title: "Conduzir Reuniões",
      description: "Permite iniciar o Modo Reunião, projetar gráficos e fechar pautas."
    },
    "meeting.comment": {
      permission: "meeting.comment",
      title: "Comentar Reunião",
      description: "Permite enviar anotações e observações na ata da reunião."
    },
    "action.view": {
      permission: "action.view",
      title: "Ver Planos de Ação",
      description: "Permite acompanhar metas, prazos e prioridades do projeto."
    },
    "action.create": {
      permission: "action.create",
      title: "Criar Metas",
      description: "Permite criar novas ações mitigadoras de caixa."
    },
    "action.assign": {
      permission: "action.assign",
      title: "Atribuir Metas",
      description: "Permite vincular uma ação de caixa a um responsável do cliente."
    },
    "action.complete": {
      permission: "action.complete",
      title: "Concluir Metas",
      description: "Permite marcar ações mitigadoras como resolvidas."
    },
    "users.invite": {
      permission: "users.invite",
      title: "Convidar Usuários",
      description: "Permite cadastrar e enviar e-mail de convite para colaboradores."
    },
    "users.manage": {
      permission: "users.manage",
      title: "Gerenciar Usuários",
      description: "Permite alterar papéis, redefinir escopos e remover acessos."
    },
    "settings.manage": {
      permission: "settings.manage",
      title: "Gerenciar Configurações",
      description: "Permite alterar nome, cores da marca e integrações do sistema."
    },
    "audit.view": {
      permission: "audit.view",
      title: "Ver Auditoria",
      description: "Permite inspecionar logs de alteração e histórico contábil."
    }
  };

  private roleDefaultPermissions: Record<Role, Permission[]> = {
    "Super Admin": [
      "workspace.view", "workspace.manage",
      "data.view", "data.import", "data.sync", "data.approve",
      "analytics.view", "analytics.manage",
      "presentation.view", "presentation.create", "presentation.edit", "presentation.approve",
      "meeting.view", "meeting.host", "meeting.comment",
      "action.view", "action.create", "action.assign", "action.complete",
      "users.invite", "users.manage", "settings.manage", "audit.view"
    ],
    "Consultant Admin": [
      "workspace.view", "workspace.manage",
      "data.view", "data.import", "data.sync", "data.approve",
      "analytics.view", "analytics.manage",
      "presentation.view", "presentation.create", "presentation.edit", "presentation.approve",
      "meeting.view", "meeting.host", "meeting.comment",
      "action.view", "action.create", "action.assign", "action.complete",
      "users.invite", "users.manage", "settings.manage", "audit.view"
    ],
    "Consultant": [
      "workspace.view",
      "data.view", "data.import", "data.sync", "data.approve",
      "analytics.view", "analytics.manage",
      "presentation.view", "presentation.create", "presentation.edit",
      "meeting.view", "meeting.host", "meeting.comment",
      "action.view", "action.create", "action.assign", "action.complete",
      "users.invite", "audit.view"
    ],
    "Client Director": [
      "workspace.view",
      "data.view", "data.approve",
      "analytics.view",
      "presentation.view", "presentation.approve",
      "meeting.view", "meeting.comment",
      "action.view", "action.create", "action.assign", "action.complete",
      "audit.view"
    ],
    "Client Manager": [
      "workspace.view",
      "data.view",
      "analytics.view",
      "presentation.view",
      "meeting.view", "meeting.comment",
      "action.view", "action.complete"
    ],
    "Financial User": [
      "workspace.view",
      "data.view", "data.import", "data.sync",
      "analytics.view",
      "presentation.view",
      "meeting.view",
      "action.view", "action.complete"
    ],
    "Controller": [
      "workspace.view",
      "data.view", "data.approve",
      "analytics.view",
      "presentation.view",
      "meeting.view",
      "action.view",
      "audit.view"
    ],
    "Auditor": [
      "workspace.view",
      "data.view",
      "analytics.view",
      "presentation.view",
      "meeting.view",
      "action.view",
      "audit.view"
    ],
    "Viewer": [
      "workspace.view",
      "data.view",
      "analytics.view",
      "presentation.view",
      "meeting.view",
      "action.view"
    ],
    "Guest": [
      "presentation.view",
      "meeting.view"
    ]
  };

  private constructor() {}

  public static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  public getPermissionInfo(perm: Permission): PermissionInfo {
    return this.permissions[perm];
  }

  public getAllPermissions(): PermissionInfo[] {
    return Object.values(this.permissions);
  }

  public getRolePermissions(role: Role): Permission[] {
    return this.roleDefaultPermissions[role] || [];
  }

  public roleHasDefaultPermission(role: Role, permission: Permission): boolean {
    return this.getRolePermissions(role).includes(permission);
  }
}

export const permissionManager = PermissionManager.getInstance();
