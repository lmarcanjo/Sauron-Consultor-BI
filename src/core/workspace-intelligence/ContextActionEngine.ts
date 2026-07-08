/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceContext, ContextAction } from "./types";
import { accessControlEngine } from "../identity/AccessControlEngine";

export class ContextActionEngine {
  private static instance: ContextActionEngine;

  private constructor() {}

  public static getInstance(): ContextActionEngine {
    if (!ContextActionEngine.instance) {
      ContextActionEngine.instance = new ContextActionEngine();
    }
    return ContextActionEngine.instance;
  }

  /**
   * Returns lists of context actions based on permissions and active entity focus.
   */
  public getActionsForContext(context: WorkspaceContext): ContextAction[] {
    const user = context.currentUser;
    const entity = context.entidadeSelecionada;

    const allActions: ContextAction[] = [
      // Global and organization setup
      {
        id: "act_create_case",
        label: "Novo Caso de Consultoria",
        icon: "Briefcase",
        actionType: "create_case",
        requiredPermissions: ["workspace.manage"],
        variant: "default"
      },
      {
        id: "act_invite_user",
        label: "Convidar Colaborador",
        icon: "UserPlus",
        actionType: "invite_user",
        requiredPermissions: ["users.invite"],
        variant: "outline"
      },
      {
        id: "act_import_data",
        label: "Importar Nova Planilha",
        icon: "Upload",
        actionType: "import_data",
        requiredPermissions: ["data.import"],
        variant: "outline"
      },
      // Cases and meetings
      {
        id: "act_create_meeting",
        label: "Nova Reunião Estratégica",
        icon: "Calendar",
        actionType: "create_meeting",
        requiredPermissions: ["meeting.host"],
        variant: "default"
      },
      {
        id: "act_create_narrative",
        label: "Nova Narrativa AI",
        icon: "Sparkles",
        actionType: "create_narrative",
        requiredPermissions: ["presentation.create"],
        variant: "default"
      },
      {
        id: "act_create_action_plan",
        label: "Nova Ação Estratégica",
        icon: "CheckSquare",
        actionType: "create_action_plan",
        requiredPermissions: ["action.create"],
        variant: "default"
      },
      // Vendedores/Sellers specific actions
      {
        id: "act_create_vendedor_goal",
        label: "Atribuir Nova Meta",
        icon: "TrendingUp",
        actionType: "vendedor_goal",
        requiredPermissions: ["action.create"],
        variant: "default"
      },
      {
        id: "act_create_vendedor_obs",
        label: "Inserir Feedback / Nota",
        icon: "MessageSquare",
        actionType: "vendedor_feedback",
        requiredPermissions: ["meeting.comment"],
        variant: "outline"
      }
    ];

    // Filter by Access Control Engine checks
    const permittedActions = allActions.filter(action => {
      // If action requires multiple permissions, check all
      return action.requiredPermissions.every(p => accessControlEngine.can(user, p));
    });

    // Scoping filtering to only show actions that make sense in this context
    if (entity) {
      if (entity.type === "vendedor") {
        return permittedActions.filter(act => 
          ["vendedor_goal", "vendedor_feedback", "create_action_plan"].includes(act.actionType)
        );
      }
      if (entity.type === "company" || entity.type === "store" || entity.type === "case") {
        return permittedActions.filter(act => 
          ["create_meeting", "create_narrative", "create_action_plan", "import_data"].includes(act.actionType)
        );
      }
      if (entity.type === "presentation") {
        return permittedActions.filter(act => 
          ["create_narrative", "create_action_plan"].includes(act.actionType)
        );
      }
    }

    // Default macro-context actions
    return permittedActions.filter(act => 
      ["create_case", "invite_user", "import_data", "create_meeting"].includes(act.actionType)
    );
  }
}

export const contextActionEngine = ContextActionEngine.getInstance();
