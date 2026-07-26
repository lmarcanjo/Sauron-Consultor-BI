/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  Layers, ChevronRight, ChevronDown, Check, Plus, Trash, Folder, Grid, 
  MapPin, Tag, Sliders, Eye, Save, HelpCircle, AlertCircle, Edit, Database 
} from "lucide-react";
import { LancamentoFinanceiro } from "../types";
import { ActiveDataset } from "../types/dataSource";
import { getEnterpriseContext } from "../core/enterprise-consolidation";
import { 
  consultingModelRepository, 
  ConsultingModelConfiguration, 
  SelectedFieldConfig, 
  BusinessAreaConfig, 
  CustomMetricConfig 
} from "../core/business-intelligence/ConsultingModelRepository";
import { showToast } from "./Toast";
import { SauronArchitectPanel } from "./SauronArchitectPanel";
import { PREDEFINED_QUESTIONS } from "../core/business-intelligence/ProjectDNA";
import {
  archiveArea,
  restoreArea,
  moveAreaToTrash,
  permanentlyDeleteArea,
  getImpactReport,
  getArchivedAreas,
  getTrashedAreas,
} from "../core/business-intelligence/BusinessAreaLifecycleService";
import { TrashItem } from "../core/persistence/TrashRepository";
import { identityEngine } from "../core/identity/IdentityEngine";
import { userManager } from "../core/identity/UserManager";
import { accessControlEngine } from "../core/identity/AccessControlEngine";
import { areaPermissionRepository, AreaAction } from "../core/identity/AreaPermissionRepository";
import { AlertTriangle, RotateCcw, Archive as ArchiveIcon } from "lucide-react";

interface ModeloConsultivoTabProps {
  dataOrigem: LancamentoFinanceiro[];
  formatCurrency: (v: number) => string;
  activeDataset?: ActiveDataset | null;
}

export const ModeloConsultivoTab: React.FC<ModeloConsultivoTabProps> = ({
  dataOrigem,
  formatCurrency,
  activeDataset
}) => {
  const context = getEnterpriseContext();
  const workspaceId = context.workspaceId || "workspace_default";
  const companyId = context.companyId;
  const groupId = context.groupId || "group_default";

  const [config, setConfig] = useState<ConsultingModelConfiguration | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"wizard" | "colunas" | "areas" | "indicadores" | "preview">("wizard");

  // Custom Area Form State
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaDesc, setNewAreaDesc] = useState("");
  const [newAreaFields, setNewAreaFields] = useState<string[]>([]);

  // Custom Indicator Form State
  const [newMetricName, setNewMetricName] = useState("");
  const [newMetricField, setNewMetricField] = useState("");
  const [newMetricOp, setNewMetricOp] = useState<CustomMetricConfig["operation"]>("sum");
  const [newMetricFormat, setNewMetricFormat] = useState<CustomMetricConfig["format"]>("currency");

  // Edit fields label state
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState("");

  // Business Area lifecycle state (F20.3 Final Closure)
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [archivedAreas, setArchivedAreas] = useState<TrashItem[]>([]);
  const [trashedAreas, setTrashedAreas] = useState<TrashItem[]>([]);
  const [permissionUserId, setPermissionUserId] = useState("");
  const [permissionActions, setPermissionActions] = useState<AreaAction[]>(["VIEW"]);

  const identityUser = identityEngine.getCurrentUser();
  const permissionUsers = Array.from(new Map([
    ...userManager.getUsers(),
    ...(identityUser ? [identityUser] : []),
  ].map(user => [user.id, user])).values());
  const performedBy = identityUser?.profile.fullName || "Operador";

  const refreshLixeira = async () => {
    const [arch, trash] = await Promise.all([
      getArchivedAreas(workspaceId, companyId),
      getTrashedAreas(workspaceId, companyId),
    ]);
    setArchivedAreas(arch);
    setTrashedAreas(trash);
  };

  useEffect(() => {
    refreshLixeira();
  }, [workspaceId, companyId]);

  useEffect(() => {
    setActiveSubTab("wizard");
    setNewAreaFields([]);
    setNewMetricField("");
  }, [workspaceId, companyId]);

  // Load configuration
  useEffect(() => {
    const loadConfig = async () => {
      let current = await consultingModelRepository.getConfiguration(workspaceId, companyId);
      if (!current) {
        current = consultingModelRepository.createDefaultConfiguration(workspaceId, groupId, companyId);
        
        // Auto-detect columns from active dataset if present
        if (activeDataset?.columnProfiles) {
          activeDataset.columnProfiles.forEach(col => {
            const lower = col.name.toLowerCase();
            let interpretation = "Atributo Geral";
            let use: SelectedFieldConfig["use"] = "show_tables";
            let confidence = 0.5;

            if (lower.includes("valor") || lower.includes("total") || lower.includes("receita") || lower.includes("faturamento")) {
              interpretation = "Valor monetário / Receita";
              use = "show_indicator";
              confidence = 0.9;
            } else if (lower.includes("data") || lower.includes("competencia") || lower.includes("vencimento")) {
              interpretation = "Data do registro";
              use = "filter_analyses";
              confidence = 0.95;
            } else if (lower.includes("vendedor") || lower.includes("prestador") || lower.includes("consultor")) {
              interpretation = "Pessoa / Responsável";
              use = "group_results";
              confidence = 0.85;
            } else if (lower.includes("cnpj") || lower.includes("empresa") || lower.includes("filial")) {
              interpretation = "Identificador organizacional";
              use = "group_results";
              confidence = 0.9;
            }

            current!.selectedFields[col.name] = {
              fieldId: col.name,
              physicalName: col.name,
              sheetName: activeDataset.sourceName || "Principal",
              detectedType: col.type || "string",
              interpretation,
              confidence,
              use,
              displayLabel: col.name,
              visible: true
            };
          });
        }
        await consultingModelRepository.saveConfiguration(current);
      }
      setConfig(current);
    };
    loadConfig();
  }, [workspaceId, companyId, activeDataset]);

  const saveConfig = async (updatedConfig: ConsultingModelConfiguration) => {
    setConfig({ ...updatedConfig });
    await consultingModelRepository.saveConfiguration(updatedConfig);
    showToast("success", "Configurações de análise salvas com sucesso!");
  };

  // 1. Toggle Module
  const handleToggleModule = (moduleId: string) => {
    if (!config) return;
    const enabledModules = config.enabledModules.includes(moduleId)
      ? config.enabledModules.filter(m => m !== moduleId)
      : [...config.enabledModules, moduleId];
    
    // Toggle People label preset when toggled
    const displayDictionary = { ...config.displayDictionary };
    if (moduleId === "pessoas" && !enabledModules.includes("pessoas")) {
      delete displayDictionary["people"];
    } else if (moduleId === "pessoas" && !displayDictionary["people"]) {
      displayDictionary["people"] = "Pessoas";
    }

    saveConfig({
      ...config,
      enabledModules,
      displayDictionary
    });
  };

  // 2. Custom People Area Naming
  const handleSetPeopleLabel = (label: string) => {
    if (!config) return;
    saveConfig({
      ...config,
      displayDictionary: {
        ...config.displayDictionary,
        people: label
      }
    });
  };

  // 3. Edit field display/consultant label
  const startEditingField = (fieldId: string, currentLabel: string) => {
    setEditingFieldId(fieldId);
    setTempLabel(currentLabel);
  };

  const saveFieldLabel = (fieldId: string) => {
    if (!config) return;
    const field = config.selectedFields[fieldId];
    if (field) {
      const updatedFields = {
        ...config.selectedFields,
        [fieldId]: {
          ...field,
          consultantLabel: tempLabel.trim() || undefined
        }
      };
      saveConfig({
        ...config,
        selectedFields: updatedFields
      });
    }
    setEditingFieldId(null);
  };

  // 4. Update Field Usage
  const handleUpdateFieldUsage = (fieldId: string, use: SelectedFieldConfig["use"]) => {
    if (!config) return;
    const field = config.selectedFields[fieldId];
    if (field) {
      const updatedFields = {
        ...config.selectedFields,
        [fieldId]: {
          ...field,
          use
        }
      };
      saveConfig({
        ...config,
        selectedFields: updatedFields
      });
    }
  };

  // 5. Add custom area
  const handleAddArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !newAreaName.trim()) return;

    const newArea: BusinessAreaConfig = {
      id: "custom_" + Date.now(),
      name: newAreaName,
      description: newAreaDesc || "Área customizada de análise.",
      iconKey: "Layers",
      relatedFields: newAreaFields,
      relatedMetrics: [],
      order: config.businessAreas.length + 1,
      visible: true
    };

    saveConfig({
      ...config,
      businessAreas: [...config.businessAreas, newArea]
    });

    setNewAreaName("");
    setNewAreaDesc("");
    setNewAreaFields([]);
    showToast("success", `Área "${newAreaName}" criada!`);
  };

  const handleRemoveArea = async (areaId: string) => {
    if (!config) return;
    if (!accessControlEngine.canArchiveArea(identityUser, areaId, { groupId: config.groupId, companyId: config.companyId })) {
      showToast("error", "Você não pode arquivar esta área.");
      setArchiveTarget(null);
      return;
    }
    try {
      const nextConfig = await archiveArea(config, areaId, performedBy);
      setConfig(nextConfig);
      await refreshLixeira();
      showToast("info", "Esta área deixará de aparecer nas novas análises. As configurações e o histórico serão preservados.");
    } catch (e) {
      showToast("error", (e as Error).message);
    } finally {
      setArchiveTarget(null);
    }
  };

  const handleRestoreArea = async (areaId: string) => {
    if (!config) return;
    if (!accessControlEngine.canConfigureArea(identityUser, areaId, { groupId: config.groupId, companyId: config.companyId })) {
      showToast("error", "Você não pode restaurar esta área.");
      return;
    }
    try {
      const nextConfig = await restoreArea(config, areaId, performedBy);
      setConfig(nextConfig);
      await refreshLixeira();
      showToast("success", "Área restaurada com a configuração e o nome originais.");
    } catch (e) {
      showToast("error", (e as Error).message);
    }
  };

  const handleMoveAreaToTrash = async (areaId: string) => {
    if (!config) return;
    if (!accessControlEngine.canArchiveArea(identityUser, areaId, { groupId: config.groupId, companyId: config.companyId })) {
      showToast("error", "Você não pode mover esta área para a Lixeira.");
      return;
    }
    try {
      await moveAreaToTrash(config, areaId, performedBy);
      await refreshLixeira();
      showToast("info", "Área enviada para a Lixeira.");
    } catch (e) {
      showToast("error", (e as Error).message);
    }
  };

  const handlePermanentlyDeleteArea = async (areaId: string) => {
    if (!config) return;
    if (!accessControlEngine.canDeleteArea(identityUser, areaId, { groupId: config.groupId, companyId: config.companyId })) {
      showToast("error", "Você não pode excluir esta área.");
      setDeleteTarget(null);
      return;
    }
    try {
      await permanentlyDeleteArea(config, areaId, deleteConfirmText, performedBy);
      await refreshLixeira();
      showToast("success", "Área excluída definitivamente. Apresentações e reuniões históricas com snapshot continuam preservadas.");
    } catch (e) {
      showToast("error", (e as Error).message);
    } finally {
      setDeleteTarget(null);
      setDeleteConfirmText("");
    }
  };

  const handleGrantAreaPermission = (areaId: string) => {
    if (!config || !permissionUserId) {
      showToast("warning", "Escolha uma pessoa antes de salvar o acesso.");
      return;
    }
    if (!accessControlEngine.canConfigureArea(identityUser, areaId, { groupId: config.groupId, companyId: config.companyId })) {
      showToast("error", "Você não pode configurar o acesso desta área.");
      return;
    }
    areaPermissionRepository.set(permissionUserId, areaId, permissionActions, {
      groupId: config.groupId,
      companyId: config.companyId,
    });
    showToast("success", "Acesso da área atualizado.");
  };

  // 6. Add Custom Metric / Indicator
  const handleAddMetric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !newMetricName.trim() || !newMetricField) return;

    const newMetric: CustomMetricConfig = {
      id: "metric_" + Date.now(),
      name: newMetricName,
      fieldId: newMetricField,
      operation: newMetricOp,
      format: newMetricFormat,
      visibleIn: ["dashboard", "presentation"]
    };

    saveConfig({
      ...config,
      customMetrics: [...config.customMetrics, newMetric]
    });

    setNewMetricName("");
    setNewMetricField("");
    showToast("success", `Indicador "${newMetricName}" criado!`);
  };

  const handleRemoveMetric = (metricId: string) => {
    if (!config) return;
    saveConfig({
      ...config,
      customMetrics: config.customMetrics.filter(m => m.id !== metricId)
    });
    showToast("info", "Indicador removido.");
  };

  const handleSelectQuestion = (q: any) => {
    if (!config) return;
    let fieldId = q.expectedFieldRole;
    const found = Object.values(config.selectedFields || {}).find((f: any) => f.use === "group_results" || f.detectedType === "numeric");
    if (found) {
      fieldId = (found as any).physicalName;
    }

    const newMetric: CustomMetricConfig = {
      id: `metric_${q.id}`,
      name: q.text,
      fieldId,
      operation: q.targetOperation,
      format: q.format,
      visibleIn: ["dashboard", "presentation", "meeting"]
    };

    if (config.customMetrics.some(m => m.id === newMetric.id)) {
      showToast("warning", "Esta pergunta já foi adicionada como indicador!");
      return;
    }

    saveConfig({
      ...config,
      customMetrics: [...config.customMetrics, newMetric]
    });
    showToast("success", `Pergunta selecionada! Indicador "${q.text}" gerado.`);
  };

  // Calculations for Column stats/Confidence summary
  const columnStats = useMemo(() => {
    if (!config) return { recognized: [], needsConfirmation: [], available: [] };
    const fields = Object.values(config.selectedFields);
    
    const recognized = fields.filter(f => f.confidence && f.confidence >= 0.8);
    const needsConfirmation = fields.filter(f => f.confidence && f.confidence < 0.8 && f.confidence >= 0.4);
    const available = fields.filter(f => !f.confidence || f.confidence < 0.4);

    return { recognized, needsConfirmation, available };
  }, [config]);

  const availableFieldNames = useMemo(() => {
    const configuredNames = Object.keys(config?.selectedFields || {});
    const datasetNames = (activeDataset?.columnProfiles || [])
      .map(profile => profile.originalName || profile.name)
      .filter(Boolean);
    const previewNames = dataOrigem.flatMap(row => Object.keys(row as Record<string, unknown>));
    return Array.from(new Set([...configuredNames, ...datasetNames, ...previewNames]));
  }, [config, activeDataset, dataOrigem]);

  const overallConfidenceText = useMemo(() => {
    if (!config || Object.keys(config.selectedFields).length === 0) return "Sem dados";
    const vals = Object.values(config.selectedFields).map(f => f.confidence || 0);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    
    if (avg >= 0.85) return "Confiança Alta";
    if (avg >= 0.6) return "Confiança Média";
    return "Confiança Baixa";
  }, [config]);

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-500">
        <HelpCircle size={36} className="animate-spin mb-4 text-blue-500" />
        <p className="text-xs font-semibold">Carregando construtor do modelo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-150 animate-fade-in" id="modelo-consultivo-tab">
      
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-sauron-navy to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Sliders size={22} className="text-emerald-400" />
            <span>Configure a análise deste cliente</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
            Sauron traz inteligência e consistência sugerindo caminhos, mas é você quem decide a estrutura e nomenclatura adequadas para a consultoria.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-xl text-left shrink-0">
          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Mapeamento Cognitivo</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-2 h-2 rounded-full ${overallConfidenceText.includes("Alta") ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className="text-xs font-bold text-white uppercase tracking-tight">{overallConfidenceText}</span>
          </div>
          <p className="text-[9px] text-slate-300 mt-1">
            Reconhecemos campos principais. Ajuste abaixo para refinar.
          </p>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        {[
          { id: "wizard", label: "Construindo seu Projeto (DNA)" },
          { id: "colunas", label: "Como deseja utilizar estas informações?" },
          { id: "areas", label: "Áreas de Análise" },
          { id: "indicadores", label: "Qual pergunta deseja responder?" },
          { id: "preview", label: "Visualização da Experiência" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2 text-xs uppercase font-black tracking-wider border-b-2 transition cursor-pointer ${
              activeSubTab === tab.id
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        
        {/* TAB 1: WIZARD */}
        {activeSubTab === "wizard" && (
          <div className="space-y-6">
            {/* SAURON Architect Assistant */}
            <div className="mb-6">
              <SauronArchitectPanel 
                workspaceId={workspaceId}
                companyId={companyId}
                onApplied={() => {
                  showToast("success", "DNA do projeto atualizado com sucesso!");
                  // Reload active config from repository
                  consultingModelRepository.getConfiguration(workspaceId, companyId).then(updated => {
                    if (updated) setConfig(updated);
                  });
                }}
              />
            </div>

            <div className="border-t border-slate-250 dark:border-slate-800 pt-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white mb-1">Escolha o que deseja utilizar</h3>
              <p className="text-xs text-slate-500">Marque as análises e recursos que fazem sentido para o plano de trabalho deste cliente.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: "dre", title: "DRE Gerencial", desc: "Estrutura clássica de receitas, custos e despesas operacionais." },
                { id: "financeiro", title: "Resultado Financeiro", desc: "Análise de fluxo financeiro, centro de custo e contas operacionais." },
                { id: "comercial", title: "Comercial", desc: "Dashboard de vendas, clientes e produtos." },
                { id: "pessoas", title: "Equipe / Pessoas", desc: "Performance de consultores, técnicos ou representantes." },
                { id: "comissao", title: "Comissão", desc: "Gestão e controle de comissões por venda ou produtor." },
                { id: "diagnostico", title: "Diagnóstico Executivo", desc: "Alinhamento e radar de prontidão estratégico." },
                { id: "apresentacao", title: "Decks e Lâminas", desc: "Geração de slides e relatórios executivos sob demanda." },
                { id: "reuniao", title: "Preparação de Reunião", desc: "Checklist de ata, decisões e alinhamento tático." },
              ].map(mod => {
                const isEnabled = config.enabledModules.includes(mod.id);
                return (
                  <div 
                    key={mod.id}
                    onClick={() => handleToggleModule(mod.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer select-none flex flex-col justify-between ${
                      isEnabled 
                        ? "bg-blue-50/20 border-blue-500 dark:bg-blue-950/20 dark:border-blue-400" 
                        : "bg-slate-50/50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-extrabold text-xs uppercase tracking-tight">{mod.title}</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isEnabled ? "bg-blue-600 border-blue-600 dark:bg-blue-400 dark:border-blue-400 text-white" : "border-slate-350"
                        }`}>
                          {isEnabled && <Check size={10} />}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">{mod.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Configurar nomenclatura de Pessoas se ativo */}
            {config.enabledModules.includes("pessoas") && (
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Nomenclatura do módulo de Pessoas</span>
                <p className="text-xs text-slate-500">Substitua o nome padrão por uma denominação que corresponda exatamente à realidade do cliente.</p>
                
                <div className="flex flex-wrap gap-2">
                  {["Pessoas", "Equipe", "Colaboradores", "Responsáveis", "Representantes", "Técnicos", "Consultores", "Vendedores"].map(opt => {
                    const isSelected = config.displayDictionary["people"] === opt || (!config.displayDictionary["people"] && opt === "Pessoas");
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSetPeopleLabel(opt)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition cursor-pointer ${
                          isSelected 
                            ? "bg-blue-600 text-white" 
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COLUMNS ESTRUTURA */}
        {activeSubTab === "colunas" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white mb-1">Mapeamento e Utilização das Colunas</h3>
              <p className="text-xs text-slate-500">Selecione como cada coluna identificada na planilha original deve ser classificada ou usada.</p>
            </div>

            {/* Recognized / Needs Confirmation lists */}
            <div className="space-y-6">
              {[
                { title: "Colunas Reconhecidas", list: columnStats.recognized, badge: "Alta Confiança", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
                { title: "Outras Colunas Encontradas", list: [...columnStats.needsConfirmation, ...columnStats.available], badge: "Disponível para uso", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" }
              ].map(group => {
                if (group.list.length === 0) return null;
                return (
                  <div key={group.title} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-755">{group.title}</h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${group.color}`}>{group.badge}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.list.map(field => {
                        const isEditing = editingFieldId === field.fieldId;
                        return (
                          <div key={field.fieldId} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <Database size={13} className="text-slate-400" />
                                  <span className="font-extrabold text-xs font-mono">{field.physicalName}</span>
                                </div>
                                <span className="text-[10px] text-slate-455 block">Aba: {field.sheetName} • Tipo: {field.detectedType}</span>
                              </div>
                              
                              {/* Edit Name Button */}
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <input
                                    type="text"
                                    value={tempLabel}
                                    onChange={(e) => setTempLabel(e.target.value)}
                                    className="bg-white dark:bg-slate-800 border px-2 py-0.5 rounded text-[10px] w-28 focus:outline-none"
                                  />
                                  <button onClick={() => saveFieldLabel(field.fieldId)} className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded"><Check size={11} /></button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => startEditingField(field.fieldId, field.consultantLabel || field.displayLabel)}
                                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit size={10} />
                                  <span>{field.consultantLabel ? field.consultantLabel : "Editar Nome"}</span>
                                </button>
                              )}
                            </div>

                            {/* Classification / Use */}
                            <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-150 dark:border-slate-800 pt-3">
                              <div>
                                <span className="text-slate-400 block mb-0.5">Uso Sugerido:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-350">{field.interpretation || "Mapeamento genérico"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Destinação:</span>
                                <select
                                  value={field.use}
                                  onChange={(e) => handleUpdateFieldUsage(field.fieldId, e.target.value as any)}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-[10px] font-medium"
                                >
                                  <option value="show_indicator">Indicador Principal</option>
                                  <option value="group_results">Agrupador / Filtro</option>
                                  <option value="show_tables">Visualização Tabela</option>
                                  <option value="do_not_use">Não Utilizar</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: AREAS CONSTRUTOR */}
        {activeSubTab === "areas" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white mb-1">Construtor de Áreas de Análise</h3>
              <p className="text-xs text-slate-500">Crie novas áreas específicas ou reorganize presets para personalizar o Dashboard e Apresentação.</p>
            </div>

            {/* Custom Area Form */}
            <form onSubmit={handleAddArea} className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl">
              <span className="text-[10px] font-black uppercase text-slate-455 tracking-wider block">Criar Nova Área de Análise</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Nome da Área</label>
                  <input
                    type="text"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    placeholder="Ex: Resultado por Centro de Custo"
                    className="w-full bg-white dark:bg-slate-800 border px-3 py-1.5 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Descrição</label>
                  <input
                    type="text"
                    value={newAreaDesc}
                    onChange={(e) => setNewAreaDesc(e.target.value)}
                    placeholder="Ex: Análise baseada em departamentos..."
                    className="w-full bg-white dark:bg-slate-800 border px-3 py-1.5 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-2">Colunas Associadas</label>
                <div className="flex flex-wrap gap-2">
                  {availableFieldNames.map(fName => {
                    const isSelected = newAreaFields.includes(fName);
                    return (
                      <button
                        type="button"
                        key={fName}
                        onClick={() => setNewAreaFields(prev => isSelected ? prev.filter(f => f !== fName) : [...prev, fName])}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono border transition ${
                          isSelected 
                            ? "bg-blue-600 border-blue-600 text-white" 
                            : "bg-white border-slate-200 text-slate-655 hover:bg-slate-50"
                        }`}
                      >
                        {fName}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase rounded-xl tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Plus size={12} />
                <span>Salvar Nova Área</span>
              </button>
            </form>

            {/* Custom Areas List */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-455 tracking-wider block">Áreas Ativas</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.businessAreas.map(area => (
                  <div key={area.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-start shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Folder className="text-blue-500" size={16} />
                        <span className="font-extrabold text-xs uppercase tracking-tight">{area.name}</span>
                        {!["financeiro", "comercial", "pessoas"].includes(area.id) && (
                          <span className="bg-slate-100 text-slate-500 text-[8px] font-bold px-1.5 py-0.5 rounded">Custom</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal max-w-sm">{area.description}</p>
                      {area.relatedFields.length > 0 && (
                        <div className="text-[9px] text-slate-455">
                          <strong>Colunas:</strong> <span className="font-mono">{area.relatedFields.join(", ")}</span>
                        </div>
                      )}
                      {accessControlEngine.canConfigureArea(identityUser, area.id, { groupId: config.groupId, companyId: config.companyId }) && permissionUsers.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Acesso desta área</span>
                          <select
                            aria-label={`Pessoa com acesso a ${area.name}`}
                            value={permissionUserId}
                            onChange={event => setPermissionUserId(event.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border px-2 py-1 rounded text-[10px]"
                          >
                            <option value="">Escolha uma pessoa</option>
                            {permissionUsers.map(user => (
                              <option key={user.id} value={user.id}>{user.profile.fullName}</option>
                            ))}
                          </select>
                          <div className="flex flex-wrap gap-2">
                            {(["VIEW", "EDIT", "CONFIGURE", "ARCHIVE", "DELETE", "EXPORT"] as AreaAction[]).map(action => (
                              <label key={action} className="inline-flex items-center gap-1 text-[9px] text-slate-500">
                                <input
                                  type="checkbox"
                                  checked={permissionActions.includes(action)}
                                  onChange={() => setPermissionActions(current => current.includes(action)
                                    ? current.filter(item => item !== action)
                                    : [...current, action])}
                                />
                                {action === "VIEW" ? "Ver" : action === "EDIT" ? "Editar" : action === "CONFIGURE" ? "Configurar" : action === "ARCHIVE" ? "Arquivar" : action === "DELETE" ? "Excluir" : "Exportar"}
                              </label>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleGrantAreaPermission(area.id)}
                            className="px-2.5 py-1 rounded bg-slate-800 text-white text-[9px] font-black uppercase cursor-pointer"
                          >
                            Salvar acesso
                          </button>
                        </div>
                      )}
                    </div>
                    {!["financeiro", "comercial", "pessoas"].includes(area.id) && (
                      <button
                        onClick={() => setArchiveTarget(area.id)}
                        className="text-slate-400 hover:text-red-500 transition cursor-pointer p-1"
                        aria-label={`Arquivar área ${area.name}`}
                      >
                        <ArchiveIcon size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Impact preview + confirmation modal for archiving (Bloco 2) */}
            {archiveTarget && config && (() => {
              const impact = getImpactReport(config, archiveTarget);
              if (!impact) return null;
              return (
                <div role="dialog" aria-modal="true" aria-labelledby="archive-modal-title" className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <ArchiveIcon size={18} className="text-amber-500" />
                      <h4 id="archive-modal-title" className="text-sm font-black uppercase text-slate-800 dark:text-white">Arquivar "{impact.areaName}"?</h4>
                    </div>
                    <p className="text-xs text-slate-500">Esta área deixará de aparecer nas novas análises. As configurações e o histórico serão preservados.</p>
                    {impact.linkedMetricNames.length > 0 && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-950/40 rounded-lg p-2">
                        <strong>Indicadores vinculados:</strong> {impact.linkedMetricNames.join(", ")}
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setArchiveTarget(null)} className="px-3 py-1.5 text-[11px] font-black uppercase text-slate-500 hover:text-slate-700 cursor-pointer">Cancelar</button>
                      <button onClick={() => handleRemoveArea(archiveTarget)} className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black uppercase cursor-pointer">Arquivar</button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Delete confirmation modal (Bloco 2 — only reachable from the Lixeira) */}
            {deleteTarget && (
              <div role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-500" />
                    <h4 id="delete-modal-title" className="text-sm font-black uppercase text-slate-800 dark:text-white">Excluir permanentemente?</h4>
                  </div>
                  <p className="text-xs text-slate-500">Esta ação removerá a configuração desta área. Apresentações e reuniões históricas continuarão preservadas quando possuírem snapshot.</p>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Digite o nome da área para confirmar</label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border px-3 py-1.5 rounded-lg text-xs"
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setDeleteTarget(null); setDeleteConfirmText(""); }} className="px-3 py-1.5 text-[11px] font-black uppercase text-slate-500 hover:text-slate-700 cursor-pointer">Cancelar</button>
                    <button onClick={() => handlePermanentlyDeleteArea(deleteTarget)} className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-black uppercase cursor-pointer">Excluir definitivamente</button>
                  </div>
                </div>
              </div>
            )}

            {/* Lixeira de Áreas (Bloco 1/3/4) */}
            {(archivedAreas.length > 0 || trashedAreas.length > 0) && (
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800" id="lixeira-areas">
                <span className="text-[10px] font-black uppercase text-slate-455 tracking-wider block">Lixeira de Áreas</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {archivedAreas.map(item => (
                    <div key={item.id} className="p-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/10 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-extrabold uppercase">{item.entityName}</span>
                        <span className="block text-[9px] text-amber-700 dark:text-amber-400 uppercase font-bold">Arquivada</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRestoreArea(item.entityId.split("::").pop()!)} className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer">
                          <RotateCcw size={12} /> Restaurar
                        </button>
                        <button onClick={() => handleMoveAreaToTrash(item.entityId.split("::").pop()!)} className="text-[10px] font-black uppercase text-slate-500 hover:text-red-500 cursor-pointer">
                          Enviar à Lixeira
                        </button>
                      </div>
                    </div>
                  ))}
                  {trashedAreas.map(item => (
                    <div key={item.id} className="p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-extrabold uppercase">{item.entityName}</span>
                        <span className="block text-[9px] text-red-700 dark:text-red-400 uppercase font-bold">Na Lixeira</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRestoreArea(item.entityId.split("::").pop()!)} className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer">
                          <RotateCcw size={12} /> Restaurar
                        </button>
                        <button onClick={() => setDeleteTarget(item.entityId.split("::").pop()!)} className="text-[10px] font-black uppercase text-red-600 hover:text-red-700 cursor-pointer">
                          Excluir definitivamente
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INDICADORES */}
        {activeSubTab === "indicadores" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white mb-1">Qual pergunta deseja responder?</h3>
              <p className="text-xs text-slate-500">Selecione perguntas chave da consultoria para gerar indicadores de forma automática, ou crie fórmulas customizadas abaixo.</p>
            </div>

            {/* Predefined Questions Grid */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Responder Perguntas de Negócio (Recomendado)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {PREDEFINED_QUESTIONS.map(q => {
                  const hasMetric = config.customMetrics.some(m => m.id === `metric_${q.id}`);
                  return (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuestion(q)}
                      disabled={hasMetric}
                      className={`flex flex-col justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                        hasMetric
                          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 opacity-80 cursor-default"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pergunta</span>
                          {hasMetric && (
                            <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-0.5">
                              <Check size={10} strokeWidth={3} /> Ativo
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold leading-normal mb-1">{q.text}</p>
                        <p className="text-[9px] text-slate-500">{q.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white mb-1">Fórmula de Indicador Especializado</h3>
              <p className="text-xs text-slate-500">Defina métricas operacionais ou financeiras personalizadas a partir das colunas da planilha.</p>
            </div>

            {/* Custom Metric Form */}
            <form onSubmit={handleAddMetric} className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl">
              <span className="text-[10px] font-black uppercase text-slate-455 tracking-wider block">Criar Novo Indicador</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Nome do Indicador</label>
                  <input
                    type="text"
                    value={newMetricName}
                    onChange={(e) => setNewMetricName(e.target.value)}
                    placeholder="Ex: Faturamento Consolidado"
                    className="w-full bg-white dark:bg-slate-800 border px-3 py-1.5 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Coluna Utilizada</label>
                  <select
                    value={newMetricField}
                    onChange={(e) => setNewMetricField(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border px-3 py-1.5 rounded-lg text-xs"
                    required
                  >
                    <option value="">Selecione...</option>
                    {availableFieldNames.map(fName => (
                      <option key={fName} value={fName}>{fName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Operação</label>
                  <select
                    value={newMetricOp}
                    onChange={(e) => setNewMetricOp(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-800 border px-3 py-1.5 rounded-lg text-xs"
                  >
                    <option value="sum">Soma (Total)</option>
                    <option value="average">Média</option>
                    <option value="count">Contagem (Registros)</option>
                    <option value="distinct_count">Contagem Distinta</option>
                    <option value="min">Mínimo</option>
                    <option value="max">Máximo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Formato</label>
                  <select
                    value={newMetricFormat}
                    onChange={(e) => setNewMetricFormat(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-800 border px-3 py-1.5 rounded-lg text-xs"
                  >
                    <option value="currency">Moeda (R$)</option>
                    <option value="number">Número Decimal</option>
                    <option value="percentage">Percentual (%)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase rounded-xl tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Plus size={12} />
                <span>Salvar Indicador</span>
              </button>
            </form>

            {/* Custom Indicators List */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-455 tracking-wider block">Indicadores Confirmados</span>
              {config.customMetrics.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">Nenhum indicador customizado criado. Use o formulário acima para adicionar.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {config.customMetrics.map(metric => (
                    <div key={metric.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shadow-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Tag size={13} className="text-emerald-500" />
                          <span className="font-extrabold text-xs uppercase tracking-tight">{metric.name}</span>
                        </div>
                        <p className="text-[9px] text-slate-455 font-mono mt-1">
                          Operação: {metric.operation.toUpperCase()} ({metric.fieldId}) • Formato: {metric.format}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveMetric(metric.id)}
                        className="text-slate-400 hover:text-red-500 cursor-pointer p-1"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: PREVIEW */}
        {activeSubTab === "preview" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white mb-1">É assim que seu cliente verá</h3>
              <p className="text-xs text-slate-500">Confirme o layout, sesections do menu e slides gerados sob esta metodologia.</p>
            </div>

            <div className="border border-slate-250 dark:border-slate-800 rounded-2xl overflow-hidden grid grid-cols-3 max-w-4xl shadow-md">
              
              {/* Sidebar Preview */}
              <div className="bg-slate-950 text-white p-4 font-mono text-[9px] space-y-4">
                <span className="text-[7.5px] font-black tracking-widest text-slate-500 uppercase block border-b border-white/10 pb-1">MENU DO CLIENTE</span>
                <div className="space-y-2">
                  <div className="font-bold text-slate-300">Centro de Comando</div>
                  {config.enabledModules.includes("diagnostico") && <div className="pl-2.5 text-blue-400">• Diagnóstico Executivo</div>}
                  {config.enabledModules.includes("dre") && <div className="pl-2.5 text-blue-400">• DRE Gerencial</div>}
                  {config.enabledModules.includes("financeiro") && <div className="pl-2.5 text-blue-400">• Resultado Financeiro</div>}
                  {config.enabledModules.includes("comercial") && <div className="pl-2.5 text-blue-400">• Comercial</div>}
                  {config.enabledModules.includes("pessoas") && (
                    <div className="pl-2.5 text-blue-400">• {config.displayDictionary["people"] || "Pessoas"}</div>
                  )}
                  {config.enabledModules.includes("apresentacao") && <div className="pl-2.5 text-blue-400">• Decks e Lâminas</div>}
                </div>
              </div>

              {/* Core Content Preview */}
              <div className="col-span-2 bg-slate-50 dark:bg-slate-950 p-4 space-y-4">
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">CONTEÚDO DO DASHBOARD</span>
                
                {/* Metric cards */}
                <div className="grid grid-cols-2 gap-3">
                  {config.customMetrics.map(m => (
                    <div key={m.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <span className="text-[8px] uppercase font-bold text-slate-450 block">{m.name}</span>
                      <span className="text-sm font-black mt-0.5 block">{m.format === "currency" ? "R$ 0,00" : "0.0"}</span>
                    </div>
                  ))}
                </div>

                {/* Slides Preview */}
                <div className="border border-dashed border-slate-350 dark:border-slate-800 p-3 rounded-xl bg-white dark:bg-slate-900 space-y-2 text-[10px]">
                  <span className="font-extrabold text-slate-450 uppercase block">Slides Ativos na Apresentação:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Slide de Capa</li>
                    {config.enabledModules.includes("dre") && <li>Slide de Resumo Geral</li>}
                    {config.enabledModules.includes("comercial") && <li>Slide Comercial</li>}
                    {config.enabledModules.includes("pessoas") && <li>Slide de Equipe</li>}
                  </ul>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
