/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BusinessGroupTwin, CompanyTwin, StoreTwin } from "./CompanyTwin";
import { OrganizationStructure } from "./OrganizationStructure";
import { organizationManager } from "../OrganizationManager";
import { userManager } from "../UserManager";
import { auditEngine } from "../../audit/AuditEngine";

export class DigitalTwinEngine {
  private static instance: DigitalTwinEngine;
  private activeGroupTwin: BusinessGroupTwin | null = null;

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): DigitalTwinEngine {
    if (!DigitalTwinEngine.instance) {
      DigitalTwinEngine.instance = new DigitalTwinEngine();
    }
    return DigitalTwinEngine.instance;
  }

  private loadFromStorage() {
    if (typeof localStorage !== "undefined") {
      try {
        const saved = localStorage.getItem("sauron_digital_twin_group");
        if (saved) {
          this.activeGroupTwin = JSON.parse(saved);
          return;
        }
      } catch (e) {
        console.error("[DigitalTwinEngine] Error loading digital twin:", e);
      }
    }
    this.seedDefaultDigitalTwin();
  }

  private saveToStorage() {
    if (typeof localStorage !== "undefined" && this.activeGroupTwin) {
      try {
        localStorage.setItem("sauron_digital_twin_group", JSON.stringify(this.activeGroupTwin));
      } catch (e) {
        console.error("[DigitalTwinEngine] Error saving digital twin:", e);
      }
    }
  }

  private seedDefaultDigitalTwin() {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
      const now = new Date().toISOString();

      const stores: StoreTwin[] = [
        {
          id: "store_unidade_a",
          name: "Unidade A",
          cnpj: "12.345.678/0001-99",
          brand: "Marca A",
          city: "Feira de Santana",
          state: "BA",
          managerUserId: "user_client_manager",
          activeHeadcount: 42,
          departments: [
            {
              id: "dept_a_sales",
              name: "Vendas",
              costCenters: ["Linha Comercial", "Administração"]
            },
            {
              id: "dept_a_operations",
              name: "Operações e Itens",
              costCenters: ["Operações", "Itens", "Categorias"]
            },
            {
              id: "dept_a_finance",
              name: "Financiamentos",
              costCenters: ["Financeiro"]
            }
          ]
        },
        {
          id: "store_unidade_b",
          name: "Unidade B",
          cnpj: "12.345.678/0002-88",
          brand: "Marca B",
          city: "Salvador",
          state: "BA",
          managerUserId: "user_client_director",
          activeHeadcount: 55,
          departments: [
            {
              id: "dept_b_sales",
              name: "Comercial",
              costCenters: ["Linha Comercial", "Administração"]
            },
            {
              id: "dept_b_services",
              name: "Itens e Serviços",
              costCenters: ["Operações", "Itens"]
            }
          ]
        }
      ];

      const company: CompanyTwin = {
        id: "comp_cliente_real",
        name: "Empresa Real Ltda",
        legalName: "Empresa Real Operações Ltda",
        taxId: "12.345.678/0001-99",
        brands: [
          {
            id: "brand_a",
            name: "Marca A",
            segment: "geral",
            stores: ["store_unidade_a"]
          },
          {
            id: "brand_b",
            name: "Marca B",
            segment: "geral",
            stores: ["store_unidade_b"]
          }
        ],
        stores: stores,
        costCenters: ["Linha Comercial", "Itens", "Operações", "Financeiro", "Categorias", "Administração"]
      };

      this.activeGroupTwin = {
        id: "group_cliente_real",
        name: "Cliente Real S/A",
        ownerUserId: "user_client_director",
        companies: [company],
        headquartersAddress: "Av. Luís Viana Filho, 1200, Salvador - BA",
        createdAt: now
      };
      this.saveToStorage();
    } else {
      this.activeGroupTwin = null;
    }
  }

  public getGroupTwin(): BusinessGroupTwin {
    if (!this.activeGroupTwin) {
      return {
        id: "group_empty",
        name: "Sem Grupo Cadastrado",
        ownerUserId: "guest_anonymous",
        companies: [],
        headquartersAddress: "",
        createdAt: new Date().toISOString()
      };
    }
    return this.activeGroupTwin;
  }

  public getStructure(): OrganizationStructure {
    const orgs = organizationManager.getOrganizations();
    const org = orgs.length > 0 ? orgs[0] : {
      id: "org_empty",
      name: "Nenhuma Organização",
      workspaces: [],
      members: [],
      teams: [],
      createdAt: new Date().toISOString()
    };
    const workspaces = organizationManager.getWorkspaces().filter(w => w.organizationId === org.id);
    const users = userManager.getUsers().filter(u => u.organizationId === org.id);
    const teams = organizationManager.getTeams().filter(t => t.organizationId === org.id);

    // Sum details from workspaces
    const dataSources = Array.from(new Set(workspaces.flatMap(w => w.dataSources)));
    const presentations = Array.from(new Set(workspaces.flatMap(w => w.presentations)));
    const meetings = Array.from(new Set(workspaces.flatMap(w => w.meetings)));
    const actionPlans = Array.from(new Set(workspaces.flatMap(w => w.actionPlans)));

    const auditLogs = auditEngine.getLogs();
    const lastAudit = auditLogs.length > 0 ? auditLogs[auditLogs.length - 1].timestamp : new Date().toISOString();

    return {
      organizationId: org.id,
      name: org.name,
      totalWorkspaces: workspaces.length,
      totalUsers: users.length,
      totalTeams: teams.length,
      dataSources,
      presentations,
      meetings,
      actionPlans,
      lastAuditActivity: lastAudit
    };
  }

  public updateStoreTwin(storeId: string, updates: Partial<Omit<StoreTwin, "id" | "cnpj">>): StoreTwin {
    const group = this.getGroupTwin();
    let foundStore: StoreTwin | null = null;

    for (const comp of group.companies) {
      const idx = comp.stores.findIndex(s => s.id === storeId);
      if (idx !== -1) {
        const current = comp.stores[idx];
        foundStore = {
          ...current,
          ...updates,
          departments: updates.departments || current.departments
        };
        comp.stores[idx] = foundStore;
        break;
      }
    }

    if (!foundStore) {
      throw new Error(`Store with ID ${storeId} not found in the Digital Twin.`);
    }

    this.saveToStorage();

    auditEngine.logEvent("DIGITAL_TWIN_UPDATED", `Twin da Loja '${foundStore.name}' atualizado no Digital Twin. Headcount: ${foundStore.activeHeadcount}`, "INFO", {
      user: "System"
    });

    return foundStore;
  }
}

export const digitalTwinEngine = DigitalTwinEngine.getInstance();
export default digitalTwinEngine;
