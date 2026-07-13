/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Role } from "./types";

export interface RoleInfo {
  name: Role;
  title: string;
  description: string;
  level: number; // For hierarchy comparison
}

export class RoleManager {
  private static instance: RoleManager;
  private roles: Record<Role, RoleInfo> = {
    "SUPER_ADMIN": {
      name: "SUPER_ADMIN",
      title: "Superadministrador",
      description: "Controle absoluto sobre o ecossistema Sauron OS, incluindo todas as organizações e infraestrutura.",
      level: 100
    },
    "CONSULTANT": {
      name: "CONSULTANT",
      title: "Consultor de Negócios",
      description: "Realiza análises, importa dados, edita apresentações, lidera rituais de conselho e gerencia planos de ação.",
      level: 80
    },
    "Super Admin": {
      name: "Super Admin",
      title: "Superadministrador",
      description: "Controle absoluto sobre o ecossistema Sauron OS, incluindo todas as organizações e infraestrutura.",
      level: 100
    },
    "Consultant Admin": {
      name: "Consultant Admin",
      title: "Consultor Administrador",
      description: "Gerencia a consultoria, cadastra clientes, define políticas de acesso globais para os projetos.",
      level: 90
    },
    "Consultant": {
      name: "Consultant",
      title: "Consultor de Negócios",
      description: "Realiza análises, importa dados, edita apresentações, lidera rituais de conselho.",
      level: 80
    },
    "Client Director": {
      name: "Client Director",
      title: "Diretor do Cliente",
      description: "Visão estratégica de todo o grupo empresarial. Aprova apresentações e monitora planos de ação.",
      level: 70
    },
    "Client Manager": {
      name: "Client Manager",
      title: "Gerente do Cliente",
      description: "Visão focada na unidade ou loja sob sua responsabilidade. Colabora em planos de ação.",
      level: 60
    },
    "Financial User": {
      name: "Financial User",
      title: "Usuário Financeiro",
      description: "Importa e valida planilhas financeiras, acompanha fluxo de caixa e centros de custo autorizados.",
      level: 50
    },
    "Controller": {
      name: "Controller",
      title: "Controlador Interno",
      description: "Audita lançamentos contábeis, valida balancetes e conciliação financeira do grupo.",
      level: 50
    },
    "Auditor": {
      name: "Auditor",
      title: "Auditor Externo",
      description: "Acesso de apenas leitura a todas as trilhas de auditoria, conciliações e logs do sistema.",
      level: 40
    },
    "Viewer": {
      name: "Viewer",
      title: "Visualizador",
      description: "Acesso apenas leitura a dashboards e apresentações estruturadas para monitoramento.",
      level: 30
    },
    "Guest": {
      name: "Guest",
      title: "Usuário Convidado",
      description: "Acesso altamente restrito, temporário e limitado a recursos especificamente compartilhados.",
      level: 10
    }
  };

  private constructor() {}

  public static getInstance(): RoleManager {
    if (!RoleManager.instance) {
      RoleManager.instance = new RoleManager();
    }
    return RoleManager.instance;
  }

  public getRoleInfo(role: Role): RoleInfo {
    return this.roles[role];
  }

  public getAllRoles(): RoleInfo[] {
    return Object.values(this.roles);
  }

  public compareRoles(roleA: Role, roleB: Role): number {
    return this.roles[roleA].level - this.roles[roleB].level;
  }
}

export const roleManager = RoleManager.getInstance();
