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
    const now = new Date().toISOString();

    const stores: StoreTwin[] = [
      {
        id: "store_nissan_feira",
        name: "Loja Nissan Feira",
        cnpj: "12.345.678/0001-99",
        brand: "Nissan",
        city: "Feira de Santana",
        state: "BA",
        managerUserId: "user_client_manager",
        activeHeadcount: 42,
        departments: [
          {
            id: "dept_nissan_sales",
            name: "Vendas Novos",
            costCenters: ["Veículos Novos", "Administração"]
          },
          {
            id: "dept_nissan_workshop",
            name: "Oficina e Peças",
            costCenters: ["Oficina", "Peças", "Acessórios"]
          },
          {
            id: "dept_nissan_fi",
            name: "F&I / Financiamentos",
            costCenters: ["F&I/FNA"]
          }
        ]
      },
      {
        id: "store_fiat_centro",
        name: "Loja Fiat Centro",
        cnpj: "12.345.678/0002-88",
        brand: "Fiat",
        city: "Salvador",
        state: "BA",
        managerUserId: "user_client_director",
        activeHeadcount: 55,
        departments: [
          {
            id: "dept_fiat_sales",
            name: "Showroom Novos e Seminovos",
            costCenters: ["Veículos Novos", "Administração"]
          },
          {
            id: "dept_fiat_parts",
            name: "Peças e Serviços",
            costCenters: ["Oficina", "Peças"]
          }
        ]
      }
    ];

    const company: CompanyTwin = {
      id: "comp_topazio_autos",
      name: "Topázio Veículos Ltda",
      legalName: "Topázio Distribuidora de Veículos e Motores Ltda",
      taxId: "12.345.678/0001-99",
      brands: [
        {
          id: "brand_nissan",
          name: "Nissan",
          segment: "automotivo",
          stores: ["store_nissan_feira"]
        },
        {
          id: "brand_fiat",
          name: "Fiat",
          segment: "automotivo",
          stores: ["store_fiat_centro"]
        }
      ],
      stores: stores,
      costCenters: ["Veículos Novos", "Peças", "Oficina", "F&I/FNA", "Acessórios", "Administração"]
    };

    this.activeGroupTwin = {
      id: "group_topazio",
      name: "Grupo Topázio S/A",
      ownerUserId: "user_client_director",
      companies: [company],
      headquartersAddress: "Av. Luís Viana Filho, 1200, Salvador - BA",
      createdAt: now
    };

    this.saveToStorage();
  }

  public getGroupTwin(): BusinessGroupTwin {
    if (!this.activeGroupTwin) {
      this.seedDefaultDigitalTwin();
    }
    return this.activeGroupTwin!;
  }

  public getStructure(): OrganizationStructure {
    const org = organizationManager.getOrganization("org_client_topazio") || organizationManager.getOrganizations()[0];
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
