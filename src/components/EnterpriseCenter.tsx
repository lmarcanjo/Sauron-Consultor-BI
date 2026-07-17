/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  Building, 
  Folder, 
  FileSpreadsheet, 
  Database, 
  Layers, 
  BookOpen, 
  ChevronRight, 
  TrendingUp, 
  Coins, 
  Activity,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  AlertTriangle,
  Play,
  Settings,
  HelpCircle,
  Plus,
  Globe,
  Trash2
} from "lucide-react";
import { enterpriseRepository, Enterprise, Company, Unit } from "../core/persistence/EnterpriseRepository";
import { enterpriseConsolidationService } from "../core/enterprise-consolidation";
import { getEnterpriseContext, setEnterpriseContext } from "../core/enterprise-consolidation";
import { workbookRepository } from "../core/workbook-library";
import { spreadsheetStorageAdapter } from "../core/storage/IndexedSpreadsheetStorageAdapter";
import { showToast } from "./Toast";
import { workspaceIntelligenceEngine } from "../core/workspace-intelligence";
import { activeDatasetStore } from "../core/data/ActiveDatasetStore";
import { executivePresentationEngine, ExecutivePresentation } from "../core/business-intelligence/ExecutivePresentationEngine";
import { calculatePresentationMetricValues } from "../core/business-intelligence/BusinessIntelligenceEngine";
import { PresentationMetricValues } from "../core/business-intelligence/PresentationMetricContext";
import { getDefaultProjectId, listModuleMappings } from "../core/data/moduleMapping";
import { useDataSourceManager } from "../hooks/useDataSourceManager";
import { MarketIntelligencePanel } from "./MarketIntelligencePanel";
import { Workspace } from "../core/workspace-intelligence/WorkspaceIntelligenceTypes";
import { marketIntelligenceEngine } from "../core/market-intelligence/MarketIntelligenceEngine";
import { ConsultingPipelineWidget } from "./ConsultingPipelineWidget";
import { EnterpriseTimeline } from "./EnterpriseTimeline";
import { PendingActionsCenter } from "./PendingActionsCenter";
import { HealthScoreWidget } from "./HealthScoreWidget";
import { MeetingChecklistWidget } from "./MeetingChecklistWidget";
import { getDomainDisplayOptions } from "../core/business-domains";

interface EnterpriseCenterProps {
  onSelectTab: (tab: string) => void;
}

type RegisterModalType = "Grupo" | "Empresa" | "Unidade";

export const EnterpriseCenter: React.FC<EnterpriseCenterProps> = ({ onSelectTab }) => {
  const { activeDataset, activeRecords, activeFiles } = useDataSourceManager();

  // State lists
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  
  // Consolidation scope selection
  const [consolidationScope, setConsolidationScope] = useState<"grupo" | "empresa" | "unidade">("grupo");
  const [selectedScopeEntity, setSelectedScopeEntity] = useState<string>("");

  // Modals Toggles
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerModalType, setRegisterModalType] = useState<RegisterModalType>("Grupo");
  const [registerParentId, setRegisterParentId] = useState<string | undefined>();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [marketApiKey, setMarketApiKey] = useState(marketIntelligenceEngine.getApiKey() || "");
  const [marketConfigured, setMarketConfigured] = useState(marketIntelligenceEngine.isConfigured());
  const [marketConfigError, setMarketConfigError] = useState("");

  // Storytelling Presentation State
  const [presentation, setPresentation] = useState<ExecutivePresentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [consolidatedMetrics, setConsolidatedMetrics] = useState<PresentationMetricValues | null>(null);

  // Form validation state (replaces alert() calls)
  const [formError, setFormError] = useState<string>("");
  // Onboarding inline banner state (replaces alert() for locked actions)
  const [onboardingBanner, setOnboardingBanner] = useState<string | null>(null);

  // Read hasActionPlan from localStorage (set by useExecutiveSessionState when syncing)
  const [hasActionPlan, setHasActionPlan] = useState(() => {
    try { return !!localStorage.getItem("sauron_plan_created"); } catch { return false; }
  });

  const [displayHistory, setDisplayHistory] = useState(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("sauron_display_activity_history") === "true";
    }
    return false;
  });

  useEffect(() => {
    const handlePref = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.displayActivityHistory === "boolean") {
        setDisplayHistory(detail.displayActivityHistory);
      }
    };
    window.addEventListener("sauron:preference-updated", handlePref);
    return () => {
      window.removeEventListener("sauron:preference-updated", handlePref);
    };
  }, []);

  // Safe Deletion Modals State
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<Enterprise | null>(null);
  const [groupDeleteCascadeConfirmText, setGroupDeleteCascadeConfirmText] = useState("");

  const [showDeleteCompanyModal, setShowDeleteCompanyModal] = useState(false);
  const [deleteCompanyTarget, setDeleteCompanyTarget] = useState<Enterprise | null>(null);
  const [deleteCompanyOption, setDeleteCompanyOption] = useState<"only_registry" | "registry_and_sources" | "move_sources">("only_registry");
  const [deleteCompanyMoveTargetId, setDeleteCompanyMoveTargetId] = useState("");

  const handleConfirmDeleteGroup = async () => {
    if (!deleteGroupTarget) return;
    await enterpriseRepository.archiveEnterprise(deleteGroupTarget.id);
    showToast("success", `Grupo ${deleteGroupTarget.name} arquivado com sucesso.`);
    setShowDeleteGroupModal(false);
    setDeleteGroupTarget(null);
    await loadEnterprises();
  };

  const handleConfirmDeleteCompany = async () => {
    if (!deleteCompanyTarget) return;

    const childUnits = enterprises.filter(u => (u as Unit).parentId === deleteCompanyTarget.id);
    for (const unit of childUnits) {
      if (deleteCompanyOption === "registry_and_sources") {
        await enterpriseRepository.delete(unit.id);
      } else {
        await enterpriseRepository.save({ ...unit, parentId: undefined } as any);
      }
    }

    const bindings = await enterpriseRepository.listSourceBindings();
    const unitIds = new Set(childUnits.map(unit => unit.id));
    const companyBindings = bindings.filter(binding => binding.companyId === deleteCompanyTarget.id || (binding.unitId && unitIds.has(binding.unitId)));
    const wbs = companyBindings.map(binding => binding.workbookId);

    if (deleteCompanyOption === "registry_and_sources") {
      for (const wbId of wbs) {
        const wb = workbookRepository.getWorkbook(wbId);
        const version = wb ? workbookRepository.getCurrentVersion(wb.id) : null;
        const storageId = version?.activeDataset?.datasetId || wbId;
        await spreadsheetStorageAdapter.deleteMetadata(storageId);
        await spreadsheetStorageAdapter.deleteRows(storageId);
        await enterpriseRepository.removeSourceBinding(wbId);
        if (wb) workbookRepository.deleteWorkbook(wb.id);
      }
    } else if (deleteCompanyOption === "move_sources" && deleteCompanyMoveTargetId) {
      const destCompany = enterprises.find(e => e.id === deleteCompanyMoveTargetId);
      if (destCompany) {
        for (const binding of companyBindings) {
          await enterpriseRepository.bindSource({
            sourceId: binding.sourceId,
            workbookId: binding.workbookId,
            datasetId: binding.datasetId,
            tenantId: binding.tenantId,
            workspaceId: binding.workspaceId,
            groupId: (destCompany as Company).parentId,
            companyId: destCompany.id,
          });
        }
      }
    }

    await enterpriseRepository.archiveEnterprise(deleteCompanyTarget.id);
    showToast("success", `Empresa ${deleteCompanyTarget.name} excluída com sucesso.`);

    const context = getEnterpriseContext();
    if (context.companyId === deleteCompanyTarget.id) {
      setEnterpriseContext({
        scope: "COMPANY",
        groupId: undefined,
        companyId: undefined,
        unitId: undefined,
        workbookIds: [],
        datasetIds: []
      });
    }

    setShowDeleteCompanyModal(false);
    setDeleteCompanyTarget(null);
    await loadEnterprises();
    await enterpriseConsolidationService.refreshActiveDatasetForContext(getEnterpriseContext());
  };

  // Load persistence structures
  const loadEnterprises = async () => {
    const all = await enterpriseRepository.getAll();
    const ents = all.filter(e => !(e as any).archived);
    setEnterprises(ents);
    const wss = workspaceIntelligenceEngine.listIntelligentWorkspaces();
    setWorkspaces(wss);
    if (ents.length > 0) {
      // Find selected or set default
      if (!selectedEnterpriseId || !ents.some(e => e.id === selectedEnterpriseId)) {
        setSelectedEnterpriseId(ents[0].id);
        setSelectedScopeEntity(ents[0].name);
      }
    }
  };

  useEffect(() => {
    loadEnterprises();
  }, [activeDataset]);

  // Extract selected enterprise details
  const activeEnterprise = enterprises.find(e => e.id === selectedEnterpriseId) || enterprises[0];
  const activeSegment = activeEnterprise?.segment || "neutral";

  // Available periods list
  const availablePeriods = Array.from(
    new Set(activeRecords.map(r => r.Mês || r["mês"] || r["Mes"] || "").filter(Boolean))
  );

  const scopedRecords = useMemo(() => {
    let filtered = [...activeRecords];
    if (selectedPeriod) {
      filtered = filtered.filter(r => (r.Mês || r["mês"] || r["Mes"]) === selectedPeriod);
    }
    if (!selectedScopeEntity) return filtered;

    const entityName = selectedScopeEntity.toLowerCase();
    return filtered.filter(r => {
      const groupVal = String(r.Grupo || r["grupo"] || "").toLowerCase();
      const compVal = String(r.Empresa || r["empresa"] || "").toLowerCase();
      const unitVal = String(r.Unidade || r["unidade"] || "").toLowerCase();
      if (consolidationScope === "grupo") return groupVal.includes(entityName) || compVal.includes(entityName);
      if (consolidationScope === "empresa") return compVal.includes(entityName);
      if (consolidationScope === "unidade") return unitVal.includes(entityName);
      return true;
    });
  }, [activeRecords, selectedPeriod, selectedScopeEntity, consolidationScope]);

  useEffect(() => {
    let mounted = true;
    if (!activeDataset) {
      setConsolidatedMetrics(null);
      return () => { mounted = false; };
    }

    const projectId = getDefaultProjectId(activeDataset);
    const moduleMappings = listModuleMappings(activeDataset.datasetId, projectId);
    calculatePresentationMetricValues({
      activeDataset,
      rows: scopedRecords,
      moduleMappings,
    }).then(result => {
      if (mounted) setConsolidatedMetrics(result.values);
    });

    return () => { mounted = false; };
  }, [activeDataset?.datasetId, activeDataset?.importedAt, scopedRecords]);

  // Load Executive Presentation dynamically
  useEffect(() => {
    if (!selectedEnterpriseId) return;
    const ws = workspaceIntelligenceEngine.getCurrentIntelligentWorkspace();
    executivePresentationEngine.generatePresentation({
      enterpriseId: selectedEnterpriseId || undefined,
      workspace: ws,
      activeDataset,
      allRows: activeRecords,
      moduleMappings: activeDataset ? listModuleMappings(activeDataset.datasetId, getDefaultProjectId(activeDataset)) : [],
    }).then(res => {
      setPresentation(res);
      setCurrentSlideIndex(0);
    });
  }, [selectedEnterpriseId, activeDataset, activeRecords]);

  // Grouped real data sources listing
  const getGroupedSources = () => {
    // Group files by type
    const sources = {
      Excel: [] as string[],
      CSV: [] as string[],
      Banco: [] as string[],
      API: [] as string[],
      ERP: [] as string[]
    };

    if (activeDataset) {
      if (activeDataset.sourceName.endsWith(".xlsx") || activeDataset.sourceName.endsWith(".xls")) {
        sources.Excel.push(activeDataset.sourceName);
      } else if (activeDataset.sourceName.endsWith(".csv")) {
        sources.CSV.push(activeDataset.sourceName);
      } else {
        sources.API.push(activeDataset.sourceName);
      }
    }

    // Include other configured workspace sources
    const activeWs = workspaceIntelligenceEngine.getCurrentIntelligentWorkspace();
    if (activeWs) {
      activeWs.workbookIds.forEach(wbId => {
        if (!activeDataset || activeDataset.sourceName !== wbId) {
          sources.Excel.push(`Workbook: ${wbId}`);
        }
      });
    }

    return sources;
  };

  const groupedSources = getGroupedSources();

  // Configuration warning helper
  const getConfigurationWarnings = () => {
    const warnings: string[] = [];
    if (!activeDataset) {
      warnings.push("Nenhuma planilha de vendas importada no workspace ativo.");
    } else if (activeDataset.columnProfiles.length === 0) {
      warnings.push("Planilha importada necessita de mapeamento de colunas financeiras.");
    }
    return warnings;
  };

  const configWarnings = getConfigurationWarnings();

  const getDefaultParentId = (type: RegisterModalType): string | undefined => {
    if (type === "Grupo") return undefined;

    const selected = enterprises.find(e => e.id === selectedEnterpriseId);
    if (type === "Empresa") {
      if (selected?.type === "Grupo") return selected.id;
      return enterprises.find(e => e.type === "Grupo")?.id;
    }

    if (selected?.type === "Empresa") return selected.id;
    if (selected?.type === "Unidade") return selected.parentId;
    return enterprises.find(e => e.type === "Empresa")?.id;
  };

  const openRegisterModal = (type: RegisterModalType) => {
    setRegisterModalType(type);
    setRegisterParentId(getDefaultParentId(type));
    setFormError("");
    setShowRegisterModal(true);
  };

  // Modal handlers
  const handleSaveEnterprise = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const type = formData.get("type") as RegisterModalType;
    const segment = formData.get("segment") as string;
    const cnpj = formData.get("cnpj") as string;
    const notes = formData.get("notes") as string;

    if (!name.trim()) {
      setFormError("Nome é obrigatório");
      return;
    }

    const parentId = registerParentId || getDefaultParentId(type);
    if (type === "Unidade" && !parentId) {
      setFormError("Cadastre uma empresa antes de cadastrar uma unidade.");
      return;
    }

    const id = `ent_${Date.now()}`;
    const newEnt: Enterprise = type === "Grupo"
      ? {
          id,
          name,
          type: "Grupo",
          segment: segment || undefined,
          cnpj: cnpj || undefined,
          notes: notes || undefined,
          companyIds: [],
          workbookIds: []
        }
      : type === "Empresa"
        ? {
            id,
            name,
            type: "Empresa",
            segment: segment || undefined,
            cnpj: cnpj || undefined,
            notes: notes || undefined,
            parentId,
            unitIds: [],
            workbookIds: [],
            contacts: []
          }
        : {
            id,
            name,
            type: "Unidade",
            segment: segment || undefined,
            cnpj: cnpj || undefined,
            notes: notes || undefined,
            parentId,
            workbookIds: [],
            contacts: []
          };

    await enterpriseRepository.save(newEnt);

    if (parentId) {
      const parent = await enterpriseRepository.getById(parentId);
      if (parent) {
        if (type === "Empresa" && parent.type === "Grupo") {
          await enterpriseRepository.save({
            ...parent,
            companyIds: Array.from(new Set([...(parent.companyIds || []), newEnt.id]))
          });
        }
        if (type === "Unidade" && parent.type === "Empresa") {
          await enterpriseRepository.save({
            ...parent,
            unitIds: Array.from(new Set([...(parent.unitIds || []), newEnt.id]))
          });
        }
      }
    }

    if (type === "Grupo") {
      setEnterpriseContext({ scope: "GROUP", groupId: newEnt.id, workbookIds: [], datasetIds: [] });
    } else if (type === "Empresa") {
      const parentEnterprise = parentId ? enterprises.find(e => e.id === parentId) : undefined;
      const groupId = parentEnterprise?.type === "Grupo" ? parentId : undefined;
      setEnterpriseContext({ scope: "COMPANY", groupId, companyId: newEnt.id, workbookIds: [], datasetIds: [] });
    } else {
      const company = parentId ? enterprises.find(e => e.id === parentId && e.type === "Empresa") as Company | undefined : undefined;
      setEnterpriseContext({ scope: "UNIT", groupId: company?.parentId, companyId: parentId, unitId: newEnt.id, workbookIds: [], datasetIds: [] });
    }

    setSelectedEnterpriseId(newEnt.id);
    await loadEnterprises();
    setShowRegisterModal(false);
  };

  const handleSaveMarketConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!marketApiKey.trim()) {
      setMarketConfigError("Informe uma chave válida para ativar a integração.");
      return;
    }
    marketIntelligenceEngine.setApiKey(marketApiKey.trim());
    setMarketConfigError("");
    setMarketConfigured(true);
    setShowConfigModal(false);
  };


  /**
   * Abre o modal correto de exclusão segura conforme o tipo da entidade.
   * Grupos abrem o modal de exclusão de grupo.
   * Empresas/Unidades abrem o modal de exclusão de empresa.
   */
  const handleInitiateDelete = (entity: Enterprise) => {
    if (entity.type === "Grupo") {
      setDeleteGroupTarget(entity);
      setShowDeleteGroupModal(true);
    } else {
      setDeleteCompanyTarget(entity);
      setShowDeleteCompanyModal(true);
    }
  };

  const handleDeconfigureMarket = () => {

    marketIntelligenceEngine.setApiKey("");
    marketIntelligenceEngine.setConfigured(false);
    setMarketConfigured(false);
    setMarketConfigError("");
    setShowConfigModal(false);
  };

  // State A: Onboarding State
  if (enterprises.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 font-sans max-w-2xl mx-auto my-12 animate-fade-in">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl w-full space-y-6">
          <div className="space-y-2">
            <h1 className="text-xl font-black uppercase text-white tracking-wider">Bem-vindo ao Sauron</h1>
            <p className="text-xs font-semibold text-slate-400">
              Cadastre um grupo ou empresa para iniciar a análise dos dados do projeto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                openRegisterModal("Grupo");
              }}
              className="flex flex-col items-center p-5 bg-slate-950 border border-slate-850 rounded-2xl hover:border-emerald-600 transition-all text-center space-y-3 cursor-pointer group"
            >
              <Building className="text-emerald-500 group-hover:scale-110 transition-transform" size={24} />
              <div>
                <h4 className="text-xs font-black uppercase text-white">Grupo Empresarial</h4>
                <p className="text-[10px] text-slate-400 mt-1">Várias filiais ou empresas unificadas.</p>
              </div>
            </button>

            <button
              onClick={() => {
                openRegisterModal("Empresa");
              }}
              className="flex flex-col items-center p-5 bg-slate-950 border border-slate-850 rounded-2xl hover:border-blue-600 transition-all text-center space-y-3 cursor-pointer group"
            >
              <Building className="text-blue-500 group-hover:scale-110 transition-transform" size={24} />
              <div>
                <h4 className="text-xs font-black uppercase text-white">Empresa Individual</h4>
                <p className="text-[10px] text-slate-400 mt-1">Apenas um CNPJ ou unidade produtiva.</p>
              </div>
            </button>

            <button
              onClick={() => {
                setOnboardingBanner("Cadastre um grupo ou empresa antes de importar planilhas. Clique em \"Grupo Empresarial\" ou \"Empresa Individual\" acima.");
              }}
              className="flex flex-col items-center p-5 bg-slate-950 border border-slate-850 rounded-2xl hover:border-slate-700 transition-all text-center space-y-3 cursor-pointer group opacity-75"
            >
              <FileSpreadsheet className="text-slate-500" size={24} />
              <div>
                <h4 className="text-xs font-black uppercase text-white">Importar Planilhas</h4>
                <p className="text-[10px] text-slate-400 mt-1">Carregar dados financeiros brutos.</p>
              </div>
            </button>

            <button
              onClick={() => {
                setOnboardingBanner("Cadastre um grupo ou empresa antes de conectar um banco de dados. Clique em \"Grupo Empresarial\" ou \"Empresa Individual\" acima.");
              }}
              className="flex flex-col items-center p-5 bg-slate-950 border border-slate-850 rounded-2xl hover:border-slate-700 transition-all text-center space-y-3 cursor-pointer group opacity-75"
            >
              <Database className="text-slate-500" size={24} />
              <div>
                <h4 className="text-xs font-black uppercase text-white">Conectar Banco</h4>
                <p className="text-[10px] text-slate-400 mt-1">Configurar banco de dados local.</p>
              </div>
            </button>
          </div>

          {/* Onboarding banner — replaces alert() */}
          {onboardingBanner && (
            <div className="flex items-start gap-3 p-4 bg-amber-950/30 border border-amber-800/50 rounded-xl text-left">
              <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-200">{onboardingBanner}</p>
              </div>
              <button
                onClick={() => setOnboardingBanner(null)}
                className="text-amber-500 hover:text-amber-300 text-[10px] font-bold uppercase cursor-pointer shrink-0"
              >
                Fechar
              </button>
            </div>
          )}
        </div>

        {/* Enterprise Registration Wizard Modal */}
        {showRegisterModal && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full text-slate-100 space-y-4 text-left shadow-2xl">
              <h3 className="text-sm font-black uppercase text-white tracking-wider border-b border-slate-850 pb-2">
                Cadastrar {registerModalType === "Grupo" ? "Grupo" : registerModalType === "Empresa" ? "Empresa" : "Unidade"}
              </h3>
              <form onSubmit={handleSaveEnterprise} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-450 block mb-1">Nome Comercial</label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Ex: Grupo Apolo, Unidade Bela Vista"
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-450 block mb-1">Segmento Operacional</label>
                  <select
                    name="segment"
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                  >
                    {getDomainDisplayOptions().map(option => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-450 block mb-1">Tipo</label>
                  <select
                    name="type"
                    value={registerModalType}
                    onChange={(e) => {
                      const nextType = e.target.value as RegisterModalType;
                      setRegisterModalType(nextType);
                      setRegisterParentId(getDefaultParentId(nextType));
                    }}
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                  >
                    <option value="Grupo">Grupo</option>
                    <option value="Empresa">Empresa</option>
                    <option value="Unidade">Unidade</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-450 block mb-1">CNPJ (Opcional)</label>
                  <input
                    name="cnpj"
                    type="text"
                    placeholder="00.000.000/0001-00"
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-450 block mb-1">Observações (Opcional)</label>
                  <textarea
                    name="notes"
                    rows={2}
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                {/* Form error inline banner — replaces alert() */}
                {formError && (
                  <div className="flex items-center gap-2 p-3 bg-rose-950/30 border border-rose-800/50 rounded-lg">
                    <AlertTriangle size={13} className="text-rose-400 shrink-0" />
                    <p className="text-[11px] font-bold text-rose-300">{formError}</p>
                  </div>
                )}
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // State B: Home Dashboard (when enterprises exist)
  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12 font-sans">
      
      {/* Top Profile Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600/25 text-emerald-500 p-2.5 rounded-xl">
            <Building size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase text-white tracking-wider">Empresas e Grupos</h1>
            <p className="text-xs font-bold text-slate-400 uppercase">Estrutura do cliente</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Contexto ativo:</label>
          <select
            value={selectedEnterpriseId}
            onChange={(e) => {
              setSelectedEnterpriseId(e.target.value);
              const ent = enterprises.find(item => item.id === e.target.value);
              if (ent) setSelectedScopeEntity(ent.name);
            }}
            className="text-xs font-bold p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
          >
            {enterprises.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.type})</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <button onClick={() => openRegisterModal("Grupo")} className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg cursor-pointer text-[10px] font-black uppercase" title="Cadastrar grupo">
              Novo grupo
            </button>
            <button onClick={() => openRegisterModal("Empresa")} className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer text-[10px] font-black uppercase" title="Cadastrar empresa">
              Nova empresa
            </button>
            <button onClick={() => openRegisterModal("Unidade")} className="px-2.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer text-[10px] font-black uppercase" title="Cadastrar unidade">
              Nova unidade
            </button>
          </div>
        </div>
      </div>

      {/* Próxima ação: mantém a Home orientada ao trabalho do consultor. */}
      <section className="bg-blue-950/30 border border-blue-900/60 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">Próximo passo</p>
            <h2 className="text-lg font-black text-white mt-1">
              {!activeDataset
                ? "Adicione os dados para começar a análise."
                : configWarnings.length > 0
                  ? "Confirme as informações encontradas para liberar a análise."
                  : "Sua análise está pronta. O que você deseja fazer agora?"}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {!activeDataset
                ? "Escolha uma planilha da empresa selecionada. O arquivo original permanece preservado."
                : configWarnings.length > 0
                  ? "Revise apenas os campos que ainda precisam de confirmação."
                  : "Escolha uma ação e continue do ponto em que parou."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {!activeDataset ? (
              <button
                type="button"
                onClick={() => onSelectTab("importacao")}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase transition-colors cursor-pointer"
              >
                Adicionar dados
              </button>
            ) : configWarnings.length > 0 ? (
              <button
                type="button"
                onClick={() => onSelectTab("perfis")}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase transition-colors cursor-pointer"
              >
                Confirmar informações
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onSelectTab("resumo")}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase transition-colors cursor-pointer"
                >
                  Ver análise
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab("preparacao_reuniao")}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase transition-colors cursor-pointer"
                >
                  Preparar reunião
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Jornada consultiva em etapas claras */}
      <ConsultingPipelineWidget
        enterprises={enterprises}
        activeDataset={activeDataset}
        activeFiles={activeFiles}
        presentation={presentation}
        onSelectTab={onSelectTab}
      />

      {/* Meeting Checklist — Prontidão para Reunião Executiva */}
      <MeetingChecklistWidget
        enterprises={enterprises}
        activeDataset={activeDataset}
        activeFiles={activeFiles}
        presentation={presentation}
        isMarketConfigured={marketConfigured}
        hasActionPlan={hasActionPlan}
        onSelectTab={onSelectTab}
      />

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Empresas / Unidades */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Building size={18} className="text-emerald-500" />
            <h3 className="text-xs font-black uppercase tracking-wider">Empresas & Unidades</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{activeEnterprise?.name}</span>
              <span className="text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-450 px-2 py-0.5 rounded">
                {activeEnterprise?.type}
              </span>
            </div>
            {activeEnterprise?.cnpj && (
              <p className="text-[10px] font-bold text-slate-500 font-mono pl-1">CNPJ: {activeEnterprise.cnpj}</p>
            )}
            {activeEnterprise?.notes && (
              <p className="text-[10px] text-slate-400 pl-1 leading-relaxed">{activeEnterprise.notes}</p>
            )}
            {activeEnterprise && (
              <button
                id="btn-delete-active-enterprise"
                onClick={() => handleInitiateDelete(activeEnterprise)}
                className="w-full mt-2 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 size={12} />
                Excluir {activeEnterprise.type === "Grupo" ? "Grupo" : "Empresa"}
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Workbooks & Fontes de Dados */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <FileSpreadsheet size={18} className="text-blue-500" />
            <h3 className="text-xs font-black uppercase tracking-wider">Fontes de Dados</h3>
          </div>
          <div className="space-y-2">
            {activeDataset ? (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2" title={activeDataset.sourceName}>
                  {activeDataset.sourceName}
                </span>
                <span className="text-[9px] font-black uppercase bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-450 px-2 py-0.5 rounded shrink-0">
                  {activeDataset.rowCount} linhas
                </span>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-xl text-center text-xs font-bold text-slate-500 italic border border-dashed border-slate-200 dark:border-slate-800">
                Nenhuma fonte ativa.
              </div>
            )}
            <button
              onClick={() => onSelectTab("importacao")}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-850 rounded-lg text-[10px] font-black uppercase text-slate-700 dark:text-slate-350 transition-all cursor-pointer text-center block"
            >
              Importar Nova Planilha
            </button>
          </div>
        </div>

        {/* Card 3: Dashboard & Configurações */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Activity size={18} className="text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-wider">Status & Acesso</h3>
          </div>
          <div className="space-y-3">
            {/* Warnings list */}
            {configWarnings.length > 0 ? (
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-3">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-450 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase">Configuração pendente</p>
                  {configWarnings.map((w, idx) => (
                    <p key={idx} className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 leading-snug">{w}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-450 uppercase">Dashboard Disponível</span>
              </div>
            )}

            <button
              onClick={() => onSelectTab("dre_inteligente")}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer text-center"
            >
              Abrir Painel DRE
            </button>
          </div>
        </div>

      </div>

      {/* Health Score + Centro de Pendências */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HealthScoreWidget
          enterprises={enterprises}
          activeDataset={activeDataset}
          activeFiles={activeFiles}
          isMarketConfigured={marketConfigured}
        />
        <PendingActionsCenter
          enterprises={enterprises}
          activeDataset={activeDataset}
          activeFiles={activeFiles}
          isMarketConfigured={marketConfigured}
          onSelectTab={onSelectTab}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Executive Storytelling & Consolidação */}
        <div className="lg:col-span-2 space-y-6">

          {/* Consolidação Financeira */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-emerald-500" />
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-white">Consolidação de Resultados</h3>
              </div>
              
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg gap-1">
                {(["grupo", "empresa", "unidade"] as const).map(scope => (
                  <button
                    key={scope}
                    onClick={() => setConsolidationScope(scope)}
                    className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all cursor-pointer ${
                      consolidationScope === scope 
                        ? "bg-emerald-600 text-white shadow-sm" 
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] uppercase font-black text-slate-400 block mb-1">Entidade</label>
                <input
                  type="text"
                  value={selectedScopeEntity}
                  onChange={(e) => setSelectedScopeEntity(e.target.value)}
                  placeholder="Filtrar por nome comercial"
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-black text-slate-400 block mb-1">Período</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="">Consolidado total</option>
                  {availablePeriods.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Metrics list */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-150 dark:border-slate-850 p-4 rounded-xl">
                <p className="text-[9px] uppercase font-bold text-slate-450">Receita Bruta</p>
                <p className="text-base font-black text-slate-800 dark:text-white mt-1 font-mono">
                  {consolidatedMetrics?.totalRevenue === null || !consolidatedMetrics ? "Configuração pendente" : `R$ ${consolidatedMetrics.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-150 dark:border-slate-850 p-4 rounded-xl">
                <p className="text-[9px] uppercase font-bold text-slate-450">Custos</p>
                <p className="text-base font-black text-slate-800 dark:text-white mt-1 font-mono">
                  {consolidatedMetrics?.totalCost === null || !consolidatedMetrics ? "Configuração pendente" : `R$ ${consolidatedMetrics.totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-150 dark:border-slate-850 p-4 rounded-xl">
                <p className="text-[9px] uppercase font-bold text-slate-450 font-sans">Resultado Líquido</p>
                <p className={`text-base font-black mt-1 font-mono ${consolidatedMetrics?.netResult !== null && consolidatedMetrics?.netResult !== undefined && consolidatedMetrics.netResult >= 0 ? "text-emerald-650 dark:text-emerald-500" : "text-rose-600"}`}>
                  {consolidatedMetrics?.netResult === null || !consolidatedMetrics ? "Configuração pendente" : `R$ ${consolidatedMetrics.netResult.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-150 dark:border-slate-850 p-4 rounded-xl">
                <p className="text-[9px] uppercase font-bold text-slate-455">Margem Operacional</p>
                <p className="text-base font-black text-slate-800 dark:text-white mt-1 font-mono">
                  {consolidatedMetrics?.grossMargin === null || !consolidatedMetrics ? "Configuração pendente" : `${consolidatedMetrics.grossMargin.toFixed(2)}%`}
                </p>
              </div>
            </div>
          </div>

          {/* Executive Presentation Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-blue-500" />
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-white">Apresentação Executiva</h3>
              </div>
            </div>

            {presentation && presentation.status === "ready" ? (
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-850 space-y-4 min-h-[180px] flex flex-col justify-between">
                {(() => {
                  const currentSlide = presentation.slides[currentSlideIndex];
                  if (!currentSlide) return null;
                  
                  return (
                    <div className="space-y-2 text-slate-100 text-left">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <span className="text-[10px] font-black uppercase text-blue-500">{currentSlide.id}</span>
                        <span className="text-[10px] font-bold text-slate-500">Slide {currentSlideIndex + 1} de {presentation.slides.length}</span>
                      </div>
                      <h4 className="text-sm font-black text-white uppercase">{currentSlide.title}</h4>
                      <p className="text-[10px] font-bold text-slate-400">{currentSlide.subtitle}</p>
                      
                      <div className="text-xs space-y-1.5 pt-2">
                        {currentSlide.content.summary && (
                          <p className="leading-relaxed text-slate-300 font-semibold">{currentSlide.content.summary}</p>
                        )}
                        {currentSlide.content.metrics && currentSlide.content.metrics.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            {currentSlide.content.metrics.map((kpi: any, idx: number) => (
                              <div key={idx} className="bg-slate-900/50 border border-slate-850 p-2 rounded">
                                <p className="text-[9px] font-bold text-slate-550 uppercase">{kpi.label}</p>
                                <p className="text-xs font-black text-slate-100 font-mono mt-0.5">{kpi.value}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {currentSlide.content.points && currentSlide.content.points.length > 0 && (
                          <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400 font-medium">
                            {currentSlide.content.points.map((p: string, idx: number) => (
                              <li key={idx}>{p}</li>
                            ))}
                          </ul>
                        )}
                        {currentSlide.content.lineage && (
                          <p className="text-[10px] font-mono text-slate-500 leading-relaxed bg-slate-900/40 p-2 rounded border border-slate-900">{currentSlide.content.lineage}</p>
                        )}
                        {currentSlide.content.checklist && currentSlide.content.checklist.length > 0 && (
                          <div className="space-y-1 pt-1">
                            {currentSlide.content.checklist.map((item: string, idx: number) => (
                              <p key={idx} className="flex items-center gap-2 text-[11px] text-slate-300 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                {item}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex justify-between items-center border-t border-slate-900 pt-3">
                  <button
                    onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentSlideIndex === 0}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded text-[9px] font-bold uppercase text-white transition-all cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentSlideIndex(prev => Math.min(presentation.slides.length - 1, prev + 1))}
                    disabled={currentSlideIndex === presentation.slides.length - 1}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded text-[9px] font-black uppercase text-white transition-all cursor-pointer"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 rounded-xl p-6 border border-slate-850 text-center text-xs font-bold text-slate-500 leading-relaxed py-12">
                Apresentação pendente: importe dados ou configure campos.
              </div>
            )}
          </div>

        </div>

        {/* Right Column: grouped data sources & market intelligence */}
        <div className="space-y-6">

          {/* Enterprise Timeline */}
          {displayHistory && (
            <EnterpriseTimeline
              enterprises={enterprises}
              activeDataset={activeDataset}
              activeFiles={activeFiles}
              presentation={presentation}
            />
          )}

          {/* Grouped Data Source Manager */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4 text-left">
            <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-800 pb-3">
              <Database size={18} className="text-blue-500" />
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-white">Canais de Dados</h3>
            </div>
            
            <div className="space-y-4">
              {Object.entries(groupedSources).map(([type, files]) => (
                <div key={type} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400">{type}</span>
                    <span className="text-[9px] font-black text-slate-500 bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded">
                      {files.length} ativos
                    </span>
                  </div>
                  {files.length > 0 ? (
                    <div className="space-y-1">
                      {files.map((file, idx) => (
                        <div key={idx} className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/30 p-2 rounded-lg border border-slate-150 dark:border-slate-850 truncate">
                          {file}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-450 italic pl-1">Nenhum canal conectado.</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Market Intelligence Compact / Panel */}
          {marketConfigured ? (
            <MarketIntelligencePanel domainId={activeSegment} />
          ) : (
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 shadow-lg space-y-3 text-left">
              <div className="flex items-center gap-2 text-slate-300 border-b border-slate-800 pb-2">
                <Globe className="text-slate-500 animate-pulse" size={16} />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Inteligência de Mercado</h3>
              </div>
              <p className="text-[11px] font-semibold text-slate-450">
                Inteligência de mercado não configurada. Vincule chaves externas para ver taxas e cotações reais.
              </p>
              <button
                onClick={() => setShowConfigModal(true)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer text-center"
              >
                Configurar fontes externas
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Enterprise Registration Wizard Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full text-slate-100 space-y-4 text-left shadow-2xl">
            <h3 className="text-sm font-black uppercase text-white tracking-wider border-b border-slate-850 pb-2">
              Cadastrar {registerModalType === "Grupo" ? "Grupo" : registerModalType === "Empresa" ? "Empresa" : "Unidade"}
            </h3>
            <form onSubmit={handleSaveEnterprise} className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-450 block mb-1">Nome Comercial</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Ex: Grupo Apolo, Unidade Bela Vista"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-450 block mb-1">Segmento Operacional</label>
                <select
                  name="segment"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                >
                  {getDomainDisplayOptions().map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-450 block mb-1">Tipo</label>
                <select
                  name="type"
                    value={registerModalType}
                    onChange={(e) => {
                      const nextType = e.target.value as RegisterModalType;
                      setRegisterModalType(nextType);
                      setRegisterParentId(getDefaultParentId(nextType));
                    }}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                >
                  <option value="Grupo">Grupo</option>
                  <option value="Empresa">Empresa</option>
                  <option value="Unidade">Unidade</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-450 block mb-1">CNPJ (Opcional)</label>
                <input
                  name="cnpj"
                  type="text"
                  placeholder="00.000.000/0001-00"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-450 block mb-1">Observações (Opcional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Market API Key Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full text-slate-100 space-y-4 text-left shadow-2xl">
            <h3 className="text-sm font-black uppercase text-white tracking-wider border-b border-slate-850 pb-2">
              Configurar Conexões Externas
            </h3>
            <form onSubmit={handleSaveMarketConfig} className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-450 block mb-1">Chave de Acesso do Hub</label>
                <input
                  type="password"
                  value={marketApiKey}
                  onChange={(e) => setMarketApiKey(e.target.value)}
                  placeholder="Vincular chave de API"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                />
                {marketConfigError && (
                  <p className="text-[10px] text-rose-400 mt-1 font-semibold">{marketConfigError}</p>
                )}
                <p className="text-[10px] text-slate-500 mt-1">
                  Informe uma chave válida fornecida pelo serviço externo.
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                {marketConfigured && (
                  <button
                    type="button"
                    onClick={handleDeconfigureMarket}
                    className="px-3 py-2 bg-rose-955 text-rose-500 hover:bg-rose-900 hover:text-white rounded-lg text-xs font-bold mr-auto cursor-pointer"
                  >
                    Desativar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Group */}
      {showDeleteGroupModal && deleteGroupTarget && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full text-slate-100 space-y-4 text-left shadow-2xl">
            <h3 className="text-sm font-black uppercase text-white tracking-wider border-b border-slate-850 pb-2 flex items-center gap-2">
              <AlertTriangle className="text-rose-500" size={16} />
              Confirmar Exclusão do Grupo
            </h3>
            
            {(() => {
              const childCompanies = enterprises.filter(c => (c as Company).parentId === deleteGroupTarget.id);
              if (childCompanies.length > 0) {
                return (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-rose-955/20 border border-rose-900 rounded-xl space-y-2">
                      <p className="text-[11px] font-black uppercase text-rose-450">Exclusão em Cascata Detectada</p>
                      <p className="text-[11px] font-semibold text-rose-350 leading-relaxed">
                        Este grupo possui as seguintes empresas vinculadas:
                      </p>
                      <ul className="list-disc pl-4 text-[10px] text-slate-350 font-bold space-y-1">
                        {childCompanies.map(c => (
                          <li key={c.id}>{c.name} ({c.type})</li>
                        ))}
                      </ul>
                      <p className="text-[11px] text-rose-350 leading-relaxed font-semibold">
                        A exclusão do grupo irá excluir permanentemente todas as empresas e unidades filhas. Para confirmar esta ação, digite o nome do grupo comercial <strong className="text-white">"{deleteGroupTarget.name}"</strong> abaixo:
                      </p>
                    </div>

                    <input
                      type="text"
                      id="input-delete-group-cascade-confirm"
                      value={groupDeleteCascadeConfirmText}
                      onChange={(e) => setGroupDeleteCascadeConfirmText(e.target.value)}
                      placeholder="Digitar nome do grupo para autorizar"
                      className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                    />
                  </div>
                );
              }

              return (
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Deseja realmente excluir o grupo comercial <strong>{deleteGroupTarget.name}</strong>? Esta ação não pode ser desfeita.
                </p>
              );
            })()}

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setShowDeleteGroupModal(false); setDeleteGroupTarget(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-group"
                onClick={handleConfirmDeleteGroup}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black uppercase tracking-wider"
              >
                Excluir Grupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Company */}
      {showDeleteCompanyModal && deleteCompanyTarget && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full text-slate-100 space-y-4 text-left shadow-2xl">
            <h3 className="text-sm font-black uppercase text-white tracking-wider border-b border-slate-850 pb-2 flex items-center gap-2">
              <AlertTriangle className="text-rose-500" size={16} />
              Confirmar Exclusão da Empresa
            </h3>
            
            <div className="space-y-3 text-xs">
              <p className="text-slate-400 font-semibold leading-relaxed">
                Você solicitou a exclusão da empresa <strong>{deleteCompanyTarget.name}</strong>.
              </p>

              {/* Linked resources info */}
              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Recursos Vinculados:</p>
                {(() => {
                  const childUnits = enterprises.filter(u => (u as Unit).parentId === deleteCompanyTarget.id);
                  const wbs = deleteCompanyTarget.workbookIds || [];
                  return (
                    <ul className="space-y-1 text-[10px] font-semibold text-slate-350">
                      <li>• Unidades/Filiais: <strong className="text-white">{childUnits.length}</strong></li>
                      <li>• Planilhas/Fontes ativas: <strong className="text-white">{wbs.length}</strong></li>
                    </ul>
                  );
                })()}
              </div>

              {/* Deletion choices */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-455">Escolha o comportamento de exclusão:</p>
                
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-2.5 bg-slate-950/30 hover:bg-slate-950/75 rounded-lg border border-slate-850 cursor-pointer">
                    <input
                      type="radio"
                      name="deleteCompanyOption"
                      id="radio-delete-only-registry"
                      checked={deleteCompanyOption === "only_registry"}
                      onChange={() => setDeleteCompanyOption("only_registry")}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-bold text-slate-200">Excluir apenas cadastro</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Mantém as planilhas e dados financeiros intactos na biblioteca do sistema.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 bg-slate-950/30 hover:bg-slate-950/75 rounded-lg border border-slate-850 cursor-pointer">
                    <input
                      type="radio"
                      name="deleteCompanyOption"
                      id="radio-delete-registry-and-sources"
                      checked={deleteCompanyOption === "registry_and_sources"}
                      onChange={() => setDeleteCompanyOption("registry_and_sources")}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-bold text-slate-200">Excluir cadastro e todas as fontes</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 text-rose-450/80">Apaga definitivamente todas as planilhas importadas vinculadas a esta empresa.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 bg-slate-950/30 hover:bg-slate-950/75 rounded-lg border border-slate-850 cursor-pointer">
                    <input
                      type="radio"
                      name="deleteCompanyOption"
                      id="radio-delete-move-sources"
                      checked={deleteCompanyOption === "move_sources"}
                      onChange={() => setDeleteCompanyOption("move_sources")}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-slate-200">Mover fontes para outra empresa</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 mb-1.5">Redireciona as planilhas ativas antes de excluir.</p>
                      {deleteCompanyOption === "move_sources" && (
                        <select
                          id="select-delete-company-move-target"
                          value={deleteCompanyMoveTargetId}
                          onChange={(e) => setDeleteCompanyMoveTargetId(e.target.value)}
                          className="w-full text-[10px] p-2 bg-slate-900 border border-slate-800 rounded font-bold text-white"
                        >
                          <option value="">Selecionar empresa destinatária</option>
                          {enterprises
                            .filter(e => e.type === "Empresa" && e.id !== deleteCompanyTarget.id)
                            .map(e => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setShowDeleteCompanyModal(false); setDeleteCompanyTarget(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-company"
                onClick={handleConfirmDeleteCompany}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black uppercase tracking-wider"
              >
                Excluir Empresa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
