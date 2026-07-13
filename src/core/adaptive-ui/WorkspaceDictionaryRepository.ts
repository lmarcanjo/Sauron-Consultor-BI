/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceDictionary, AdaptiveDisplayLabel } from "./WorkspaceDictionary";

export class WorkspaceDictionaryRepository {
  private static STORAGE_KEY_PREFIX = "sauron_dict_ws_";
  private memoryDicts: Record<string, WorkspaceDictionary> = {};

  public getDictionary(workspaceId: string, domainId: string = "shared"): WorkspaceDictionary {
    const memoryDict = this.memoryDicts[workspaceId];

    if (typeof localStorage === "undefined") {
      if (memoryDict) {
        return this.migrateDictionary(memoryDict, workspaceId, domainId);
      }
      const defaultDict = this.createDefaultDictionary(workspaceId, domainId);
      this.memoryDicts[workspaceId] = defaultDict;
      return defaultDict;
    }

    try {
      const raw = localStorage.getItem(`${WorkspaceDictionaryRepository.STORAGE_KEY_PREFIX}${workspaceId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        const migrated = this.migrateDictionary(parsed, workspaceId, domainId);
        this.memoryDicts[workspaceId] = migrated;
        return migrated;
      }
    } catch (e) {
      console.error("[WorkspaceDictionaryRepository] Failed to read dictionary:", e);
    }

    // Default Fallback Preset
    const defaultDict = this.createDefaultDictionary(workspaceId, domainId);
    this.saveDictionary(defaultDict);
    return defaultDict;
  }

  public saveDictionary(dict: WorkspaceDictionary): void {
    this.memoryDicts[dict.workspaceId] = dict;

    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(
          `${WorkspaceDictionaryRepository.STORAGE_KEY_PREFIX}${dict.workspaceId}`,
          JSON.stringify({ ...dict, updatedAt: new Date().toISOString() })
        );
        // Dispatch global sync event
        window.dispatchEvent(new CustomEvent("sauron:dictionary-updated", { detail: dict }));
      } catch (e) {
        console.error("[WorkspaceDictionaryRepository] Failed to save dictionary:", e);
      }
    }
  }

  public createDefaultDictionary(workspaceId: string, domainId: string): WorkspaceDictionary {
    const now = new Date().toISOString();
    const cleanDomain = domainId.toLowerCase().trim();

    const terms: Record<string, AdaptiveDisplayLabel> = {};

    const buildLabel = (key: string, label: string, plural: string, iconKey: string, accentColor: string, abbreviation: string): AdaptiveDisplayLabel => ({
      canonicalKey: key,
      displayLabel: label,
      displayPlural: plural,
      iconKey,
      accentColor,
      abbreviation,
      workspaceId
    });

    if (cleanDomain === "agribusiness" || cleanDomain === "agribusiness/safra" || cleanDomain === "agro") {
      terms.people = buildLabel("people", "Produtor", "Produtores", "Users", "#10b981", "PROD");
      terms.customer = buildLabel("customer", "Comprador", "Compradores", "User", "#059669", "COMP");
      terms.seller = buildLabel("seller", "Representante", "Representantes", "Briefcase", "#d97706", "REP");
      terms.department = buildLabel("department", "Talhão", "Talhões", "Layers", "#84cc16", "TALH");
      terms.branch = buildLabel("branch", "Fazenda", "Fazendas", "Building", "#15803d", "FAZ");
      terms.company = buildLabel("company", "Cooperativa", "Cooperativas", "Building", "#047857", "COOP");
      terms.group = buildLabel("group", "Grupo Agrícola", "Grupos Agrícolas", "Layers", "#451a03", "GRUP");
      terms.commission = buildLabel("commission", "Prêmio de Safra", "Prêmios de Safra", "Award", "#a16207", "PREM");
      terms.dashboard = buildLabel("dashboard", "Painel da Safra", "Painéis da Safra", "BarChart3", "#15803d", "PAIN");
      terms.report = buildLabel("report", "Relatório de Colheita", "Relatórios de Colheita", "FileText", "#64748b", "REL");
      terms.meeting = buildLabel("meeting", "Assembleia", "Assembleias", "Users", "#047857", "ASS");
      terms.presentation = buildLabel("presentation", "Relatório de Safra", "Relatórios de Safra", "Presentation", "#15803d", "PRES");
    } else if (cleanDomain === "automotive" || cleanDomain === "auto") {
      terms.people = buildLabel("people", "Consultor", "Consultores", "Users", "#3b82f6", "CONS");
      terms.customer = buildLabel("customer", "Cliente", "Clientes", "User", "#10b981", "CLI");
      terms.seller = buildLabel("seller", "Vendedor", "Vendedores", "Briefcase", "#f59e0b", "VEND");
      terms.department = buildLabel("department", "Oficina", "Oficinas", "Settings", "#8b5cf6", "OFIC");
      terms.branch = buildLabel("branch", "Loja", "Lojas", "Building", "#ec4899", "LOJ");
      terms.company = buildLabel("company", "Concessionária", "Concessionárias", "Building", "#f43f5e", "CONC");
      terms.group = buildLabel("group", "Grupo", "Grupos", "Layers", "#06b6d4", "GRUP");
      terms.commission = buildLabel("commission", "Comissão", "Comissões", "Award", "#10b981", "COM");
      terms.dashboard = buildLabel("dashboard", "Painel de Bordo", "Painéis de Bordo", "BarChart3", "#3b82f6", "PAIN");
      terms.report = buildLabel("report", "Diagnóstico", "Diagnósticos", "FileText", "#64748b", "DIAG");
      terms.meeting = buildLabel("meeting", "Comitê", "Comitês", "Users", "#10b981", "COM");
      terms.presentation = buildLabel("presentation", "Deck Executivo", "Decks Executivos", "Presentation", "#8b5cf6", "DECK");
    } else if (cleanDomain === "services" || cleanDomain === "serviços") {
      terms.people = buildLabel("people", "Recurso", "Recursos", "Users", "#6366f1", "REC");
      terms.customer = buildLabel("customer", "Cliente", "Clientes", "User", "#3b82f6", "CLI");
      terms.seller = buildLabel("seller", "Consultor Associado", "Consultores Associados", "Briefcase", "#f59e0b", "CONS");
      terms.department = buildLabel("department", "Prática", "Práticas", "Layers", "#8b5cf6", "PRAT");
      terms.branch = buildLabel("branch", "Escritório", "Escritórios", "Building", "#ec4899", "ESCR");
      terms.company = buildLabel("company", "Firma", "Firmas", "Building", "#f43f5e", "FIRM");
      terms.group = buildLabel("group", "Aliança", "Alianças", "Layers", "#06b6d4", "ALIN");
      terms.commission = buildLabel("commission", "Bônus por Projeto", "Bônus por Projetos", "Award", "#10b981", "BONUS");
      terms.dashboard = buildLabel("dashboard", "Painel de Projetos", "Painéis de Projetos", "BarChart3", "#6366f1", "PAIN");
      terms.report = buildLabel("report", "Dossiê de Horas", "Dossiês de Horas", "FileText", "#64748b", "REL");
      terms.meeting = buildLabel("meeting", "Ritual de Alinhamento", "Rituais de Alinhamento", "Users", "#10b981", "RIT");
      terms.presentation = buildLabel("presentation", "Status Report", "Status Reports", "Presentation", "#8b5cf6", "PRES");
    } else {
      // Shared / General default Presets
      terms.people = buildLabel("people", "Pessoas", "Pessoas", "Users", "#475569", "PES");
      terms.customer = buildLabel("customer", "Cliente", "Clientes", "User", "#3b82f6", "CLI");
      terms.seller = buildLabel("seller", "Vendedor", "Vendedores", "Briefcase", "#f59e0b", "VEND");
      terms.department = buildLabel("department", "Departamento", "Departamentos", "Layers", "#8b5cf6", "DEP");
      terms.branch = buildLabel("branch", "Filial", "Filiais", "Building", "#ec4899", "FIL");
      terms.company = buildLabel("company", "Empresa", "Empresas", "Building", "#f43f5e", "EMP");
      terms.group = buildLabel("group", "Grupo", "Grupos", "Layers", "#06b6d4", "GRUP");
      terms.commission = buildLabel("commission", "Comissão", "Comissões", "Award", "#10b981", "COM");
      terms.dashboard = buildLabel("dashboard", "Dashboard", "Dashboards", "BarChart3", "#3b82f6", "DASH");
      terms.report = buildLabel("report", "Relatório", "Relatórios", "FileText", "#64748b", "REL");
      terms.meeting = buildLabel("meeting", "Reunião", "Reuniões", "Users", "#10b981", "REU");
      terms.presentation = buildLabel("presentation", "Apresentação", "Apresentações", "Presentation", "#8b5cf6", "APRES");
    }

    return {
      workspaceId,
      terms,
      updatedAt: now
    };
  }

  private migrateDictionary(dict: any, workspaceId: string, domainId: string): WorkspaceDictionary {
    if (!dict) return this.createDefaultDictionary(workspaceId, domainId);
    
    const migratedTerms: Record<string, AdaptiveDisplayLabel> = {};
    const rawTerms = dict.terms || {};

    for (const [key, term] of Object.entries(rawTerms)) {
      if (!term) continue;
      const rawTerm = term as any;

      const canonicalKey = rawTerm.canonicalKey || key;
      const displayLabel = rawTerm.displayLabel || rawTerm.label || canonicalKey.charAt(0).toUpperCase() + canonicalKey.slice(1);
      const displayPlural = rawTerm.displayPlural || rawTerm.plural || displayLabel + "s";
      const iconKey = rawTerm.iconKey || rawTerm.icon || "HelpCircle";
      const accentColor = rawTerm.accentColor || rawTerm.color || "#64748b";
      const abbreviation = rawTerm.abbreviation || canonicalKey.slice(0, 3).toUpperCase();

      migratedTerms[key] = {
        canonicalKey,
        displayLabel,
        displayPlural,
        iconKey,
        accentColor,
        abbreviation,
        workspaceId: rawTerm.workspaceId || dict.workspaceId || workspaceId
      };
    }

    // Ensure all default required keys exist
    const defaultDict = this.createDefaultDictionary(workspaceId, domainId);
    for (const key of Object.keys(defaultDict.terms)) {
      if (!migratedTerms[key]) {
        migratedTerms[key] = defaultDict.terms[key];
      }
    }

    return {
      workspaceId: dict.workspaceId || workspaceId,
      terms: migratedTerms,
      updatedAt: dict.updatedAt || new Date().toISOString()
    };
  }
}

export const workspaceDictionaryRepository = new WorkspaceDictionaryRepository();
export default workspaceDictionaryRepository;
