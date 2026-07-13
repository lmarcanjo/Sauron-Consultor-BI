/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * F15 — Enterprise Digital Twin
 * EnterpriseDigitalTwinTab.tsx — Representação e modelagem da estrutura organizacional do cliente
 */

import React, { useState, useEffect } from "react";
import {
  Network, Building, Layers, FileText, Database, Calendar, Plus, Edit2,
  Trash2, ShieldCheck, Link2, CheckCircle2, History, ChevronRight, Activity, Info
} from "lucide-react";
import { enterpriseRepository, Enterprise, BusinessGroup, Company, Unit } from "../core/persistence/EnterpriseRepository";
import { useDataSourceManager } from "../hooks/useDataSourceManager";
import { workbookRepository } from "../core/workbook/WorkbookRepository";
import { workbookRepository as libraryWorkbookRepository } from "../core/workbook-library";
import { spreadsheetStorageAdapter } from "../core/storage/IndexedSpreadsheetStorageAdapter";
import { getEnterpriseContext, setEnterpriseContext } from "../core/enterprise-consolidation";
import { showToast } from "./Toast";

export const EnterpriseDigitalTwinTab: React.FC = () => {
  const { activeDataset, activeFiles, refreshDataSource } = useDataSourceManager();

  // State
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [activeGroup, setActiveGroup] = useState<BusinessGroup | null>(null);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);

  // Safe Deletion Modals State
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<Enterprise | null>(null);
  const [groupDeleteCascadeConfirmText, setGroupDeleteCascadeConfirmText] = useState("");

  const [showDeleteCompanyModal, setShowDeleteCompanyModal] = useState(false);
  const [deleteCompanyTarget, setDeleteCompanyTarget] = useState<Enterprise | null>(null);
  const [deleteCompanyOption, setDeleteCompanyOption] = useState<"only_registry" | "registry_and_sources" | "move_sources">("only_registry");
  const [deleteCompanyMoveTargetId, setDeleteCompanyMoveTargetId] = useState("");

  // Forms State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<"group" | "company" | "unit">("company");
  const [newName, setNewName] = useState("");
  const [newSegment, setNewSegment] = useState("automotive");
  const [newCnpj, setNewCnpj] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");

  // Association helper state
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [associateTargetId, setAssociateTargetId] = useState("");
  const [associateWorkbookId, setAssociateWorkbookId] = useState("");

  // Load structure
  const loadStructure = async () => {
    const list = await enterpriseRepository.getAll();
    setEnterprises(list);

    // Resolver Grupo Ativo padrão
    const groups = list.filter(e => e.type === "Grupo") as BusinessGroup[];
    if (groups.length > 0) {
      const storedGroupId = localStorage.getItem("sauron_active_group_id");
      const currentGroup = groups.find(g => g.id === storedGroupId) || groups[0];
      setActiveGroup(currentGroup);

      // Resolver Empresa Ativa padrão
      const companies = list.filter(e => e.type === "Empresa" && e.parentId === currentGroup.id) as Company[];
      if (companies.length > 0) {
        const storedCompanyId = localStorage.getItem("sauron_active_company_id");
        const currentCompany = companies.find(c => c.id === storedCompanyId) || companies[0];
        setActiveCompany(currentCompany);

        // Resolver Unidade Ativa padrão
        const units = list.filter(e => e.type === "Unidade" && e.parentId === currentCompany.id) as Unit[];
        if (units.length > 0) {
          const storedUnitId = localStorage.getItem("sauron_active_unit_id");
          const currentUnit = units.find(u => u.id === storedUnitId) || units[0];
          setActiveUnit(currentUnit);
        } else {
          setActiveUnit(null);
        }
      } else {
        setActiveCompany(null);
        setActiveUnit(null);
      }
    } else {
      setActiveGroup(null);
      setActiveCompany(null);
      setActiveUnit(null);
    }
  };

  useEffect(() => {
    loadStructure();
  }, []);

  const selectGroup = (group: BusinessGroup) => {
    setActiveGroup(group);
    localStorage.setItem("sauron_active_group_id", group.id);
    
    // Auto-select first company of this group
    const firstCompany = enterprises.find(e => e.type === "Empresa" && (e as Company).parentId === group.id) as Company;
    if (firstCompany) {
      selectCompany(firstCompany);
    } else {
      setActiveCompany(null);
      setActiveUnit(null);
      localStorage.removeItem("sauron_active_company_id");
      localStorage.removeItem("sauron_active_unit_id");
    }
    triggerGlobalContextUpdate();
  };

  const selectCompany = (company: Company) => {
    setActiveCompany(company);
    localStorage.setItem("sauron_active_company_id", company.id);
    
    // Auto-select first unit of this company
    const firstUnit = enterprises.find(e => e.type === "Unidade" && (e as Unit).parentId === company.id) as Unit;
    if (firstUnit) {
      selectUnit(firstUnit);
    } else {
      setActiveUnit(null);
      localStorage.removeItem("sauron_active_unit_id");
    }
    triggerGlobalContextUpdate();
  };

  const selectUnit = (unit: Unit) => {
    setActiveUnit(unit);
    localStorage.setItem("sauron_active_unit_id", unit.id);
    triggerGlobalContextUpdate();
  };

  const triggerGlobalContextUpdate = () => {
    const event = new CustomEvent("sauron:context-updated", {
      detail: {
        groupId: localStorage.getItem("sauron_active_group_id"),
        companyId: localStorage.getItem("sauron_active_company_id"),
        unitId: localStorage.getItem("sauron_active_unit_id")
      }
    });
    window.dispatchEvent(event);
    refreshDataSource();
  };

  // Add entity handler
  const handleAddEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const id = `${addType}_${Date.now()}`;
    
    if (addType === "group") {
      const newGroup: BusinessGroup = {
        id,
        name: newName,
        type: "Grupo",
        segment: newSegment,
        cnpj: newCnpj,
        notes: newNotes,
        companyIds: []
      };
      await enterpriseRepository.save(newGroup);
    } else if (addType === "company") {
      const parentId = selectedParentId || activeGroup?.id;
      if (!parentId) {
        showToast("error", "Selecione um Grupo pai.");
        return;
      }
      const newCompany: Company = {
        id,
        name: newName,
        type: "Empresa",
        segment: newSegment,
        cnpj: newCnpj,
        notes: newNotes,
        parentId,
        unitIds: []
      };
      await enterpriseRepository.save(newCompany);

      // Atualizar o grupo pai
      const parent = await enterpriseRepository.getById(parentId) as BusinessGroup;
      if (parent) {
        parent.companyIds = [...(parent.companyIds || []), id];
        await enterpriseRepository.save(parent);
      }
    } else if (addType === "unit") {
      const parentId = selectedParentId || activeCompany?.id;
      if (!parentId) {
        showToast("error", "Selecione uma Empresa pai.");
        return;
      }
      const newUnit: Unit = {
        id,
        name: newName,
        type: "Unidade",
        segment: newSegment,
        cnpj: newCnpj,
        notes: newNotes,
        parentId
      };
      await enterpriseRepository.save(newUnit);

      // Atualizar a empresa pai
      const parent = await enterpriseRepository.getById(parentId) as Company;
      if (parent) {
        parent.unitIds = [...(parent.unitIds || []), id];
        await enterpriseRepository.save(parent);
      }
    }

    showToast("success", "Entidade criada no Gêmeo Digital.");
    setShowAddModal(false);
    setNewName("");
    setNewCnpj("");
    setNewNotes("");
    loadStructure();
  };

  // Delete entity handler
  const handleDeleteEntity = async (id: string, type: string) => {
    const target = enterprises.find(e => e.id === id);
    if (!target) return;
    if (target.type === "Grupo") {
      setDeleteGroupTarget(target);
      setGroupDeleteCascadeConfirmText("");
      setShowDeleteGroupModal(true);
    } else if (target.type === "Empresa") {
      setDeleteCompanyTarget(target);
      setDeleteCompanyOption("only_registry");
      setDeleteCompanyMoveTargetId("");
      setShowDeleteCompanyModal(true);
    } else {
      if (!confirm(`Deseja realmente remover a unidade ${target.name}?`)) return;
      await enterpriseRepository.delete(id);
      showToast("success", "Unidade removida com sucesso.");
      loadStructure();
    }
  };

  const handleConfirmDeleteGroup = async () => {
    if (!deleteGroupTarget) return;

    const childCompanies = enterprises.filter(c => (c as Company).parentId === deleteGroupTarget.id);
    if (childCompanies.length > 0) {
      if (groupDeleteCascadeConfirmText !== deleteGroupTarget.name) {
        showToast("warning", "Confirmação incorreta. Digite o nome exato do grupo para autorizar a exclusão em cascata.");
        return;
      }
      for (const comp of childCompanies) {
        const childUnits = enterprises.filter(u => (u as Unit).parentId === comp.id);
        for (const unit of childUnits) {
          await enterpriseRepository.delete(unit.id);
        }
        await enterpriseRepository.delete(comp.id);
      }
    }

    await enterpriseRepository.delete(deleteGroupTarget.id);
    showToast("success", `Grupo ${deleteGroupTarget.name} excluído com sucesso.`);

    const context = getEnterpriseContext();
    if (context.groupId === deleteGroupTarget.id) {
      setEnterpriseContext({
        scope: "COMPANY",
        groupId: undefined,
        companyId: undefined,
        unitId: undefined,
        workbookIds: [],
        datasetIds: []
      });
    }

    setShowDeleteGroupModal(false);
    setDeleteGroupTarget(null);
    loadStructure();
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

    const wbs = deleteCompanyTarget.workbookIds || [];

    if (deleteCompanyOption === "registry_and_sources") {
      for (const wbId of wbs) {
        libraryWorkbookRepository.deleteWorkbook(wbId);
        const wb = libraryWorkbookRepository.getWorkbook(wbId);
        if (wb) {
          await spreadsheetStorageAdapter.deleteMetadata(wb.id);
          await spreadsheetStorageAdapter.deleteRows(wb.id);
        }
      }
    } else if (deleteCompanyOption === "move_sources" && deleteCompanyMoveTargetId) {
      const destCompany = enterprises.find(e => e.id === deleteCompanyMoveTargetId);
      if (destCompany) {
        const destWbs = destCompany.workbookIds || [];
        const nextWbs = Array.from(new Set([...destWbs, ...wbs]));
        await enterpriseRepository.save({
          ...destCompany,
          workbookIds: nextWbs
        });
      }
    }

    await enterpriseRepository.delete(deleteCompanyTarget.id);
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
    loadStructure();
  };

  // Associate Workbook
  const handleAssociateWorkbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!associateTargetId || !associateWorkbookId) return;

    const entity = await enterpriseRepository.getById(associateTargetId);
    if (entity) {
      // Salvar dinamicamente nos metadados da empresa/unidade
      const updated = {
        ...entity,
        workbookIds: Array.from(new Set([...((entity as any).workbookIds || []), associateWorkbookId]))
      };
      await enterpriseRepository.save(updated as any);
      showToast("success", "Workbook associado com sucesso.");
      setShowAssociateModal(false);
      loadStructure();
    }
  };

  // Get associated workbooks
  const getAssociatedWorkbooks = (entityId: string): string[] => {
    const entity = enterprises.find(e => e.id === entityId);
    return (entity as any)?.workbookIds || [];
  };

  const getCompanyTimeline = () => {
    // Retorna marcos reais da empresa (como importações)
    const timeline = [];
    if (activeDataset) {
      timeline.push({
        title: "Dados Operacionais Importados",
        description: `Planilha '${activeDataset.sourceName}' vinculada à análise.`,
        date: activeDataset.importedAt,
        type: "import"
      });
    }
    
    const ata = localStorage.getItem("sauron_ata_created");
    if (ata) {
      timeline.push({
        title: "Ata de Reunião Salva",
        description: "Reunião de alinhamento executivo realizada e registrada.",
        date: new Date(Number(ata)).toISOString(),
        type: "meeting"
      });
    }

    const plan = localStorage.getItem("sauron_plan_created");
    if (plan) {
      timeline.push({
        title: "Plano de Ação Homologado",
        description: "Plano de mitigação e prazos definidos no sistema.",
        date: new Date(Number(plan)).toISOString(),
        type: "plan"
      });
    }

    return timeline.sort((a,b) => b.date.localeCompare(a.date));
  };

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800 dark:text-slate-100" id="digital-twin-tab">
      
      {/* Context Summary Desk */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Network size={160} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-blue-600/30 text-blue-400 rounded-full border border-blue-500/20">
              Enterprise Digital Twin
            </span>
            <h1 className="text-xl font-black tracking-tight">Representação Organizacional</h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Modelagem tática da holding estruturada em Grupos, Empresas e Unidades de faturamento.
            </p>
          </div>
          <button
            onClick={() => {
              setAddType("company");
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer shadow-md shrink-0"
          >
            <Plus size={12} /> Adicionar Empresa/Unidade
          </button>
        </div>

        {/* Global Context Panel */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-4 border-t border-slate-850/60">
          <div>
            <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Grupo Ativo</span>
            <span className="text-xs font-bold text-slate-200">{activeGroup?.name || "Nenhum"}</span>
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Empresa Ativa</span>
            <span className="text-xs font-bold text-slate-200">{activeCompany?.name || "Nenhuma"}</span>
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Unidade Ativa</span>
            <span className="text-xs font-bold text-slate-200">{activeUnit?.name || "Nenhuma"}</span>
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Fontes Vinculadas</span>
            <span className="text-xs font-bold text-slate-200">
              {activeDataset ? `1 ativa (${activeDataset.sourceName})` : "Nenhuma"}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Status Mapeamento</span>
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
              {activeDataset ? (
                <>
                  <CheckCircle2 size={12} className="text-emerald-500" /> Ativo
                </>
              ) : "Pendente"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle: Interactive Org Tree Map */}
        <div className="lg:col-span-2 space-y-6 text-left">
          
          {/* Org Tree Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-blue-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Estrutura de Grupos</h3>
              </div>
            </div>

            {/* Tree Render */}
            <div className="space-y-4">
              {enterprises.filter(e => e.type === "Grupo").map(group => (
                <div key={group.id} className="border border-slate-150 dark:border-slate-850 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      onClick={() => selectGroup(group as BusinessGroup)}
                      className={`flex items-center gap-2 cursor-pointer p-1 rounded transition-all ${
                        activeGroup?.id === group.id ? "text-blue-500 font-extrabold" : "text-slate-850 dark:text-slate-200 hover:text-blue-400"
                      }`}
                    >
                      <Building size={16} />
                      <span className="text-xs font-extrabold uppercase">{group.name}</span>
                      <span className="text-[8px] uppercase px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 rounded text-slate-500">Grupo</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setAssociateTargetId(group.id);
                          setShowAssociateModal(true);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors"
                        title="Vincular Workbook"
                      >
                        <Link2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteEntity(group.id, "Grupo")}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Mapped Companies of this Group */}
                  <div className="pl-6 border-l border-slate-200 dark:border-slate-800 space-y-3">
                    {enterprises
                      .filter(e => e.type === "Empresa" && (e as Company).parentId === group.id)
                      .map(company => (
                        <div key={company.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div
                              onClick={() => selectCompany(company as Company)}
                              className={`flex items-center gap-2 cursor-pointer p-1 rounded transition-all ${
                                activeCompany?.id === company.id ? "text-emerald-500 font-extrabold" : "text-slate-700 dark:text-slate-350 hover:text-emerald-400"
                              }`}
                            >
                              <ChevronRight size={12} />
                              <Building size={14} />
                              <span className="text-xs font-bold">{company.name}</span>
                              <span className="text-[8px] uppercase px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 rounded text-slate-500">Empresa</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setAssociateTargetId(company.id);
                                  setShowAssociateModal(true);
                                }}
                                className="p-1 text-slate-400 hover:text-emerald-500 rounded transition-colors"
                              >
                                <Link2 size={11} />
                              </button>
                              <button
                                onClick={() => handleDeleteEntity(company.id, "Empresa")}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>

                          {/* Workbooks Associated */}
                          {getAssociatedWorkbooks(company.id).length > 0 && (
                            <div className="pl-6 flex flex-wrap gap-1.5">
                              {getAssociatedWorkbooks(company.id).map(wId => (
                                <span key={wId} className="inline-flex items-center gap-1 text-[8px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/10">
                                  <FileText size={8} /> Workbook: {wId.slice(0, 8)}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Mapped Units of this Company */}
                          <div className="pl-6 border-l border-slate-200 dark:border-slate-850 space-y-2">
                            {enterprises
                              .filter(e => e.type === "Unidade" && (e as Unit).parentId === company.id)
                              .map(unit => (
                                <div key={unit.id} className="flex items-center justify-between">
                                  <div
                                    onClick={() => selectUnit(unit as Unit)}
                                    className={`flex items-center gap-1.5 cursor-pointer p-0.5 rounded transition-all ${
                                      activeUnit?.id === unit.id ? "text-purple-500 font-extrabold" : "text-slate-600 dark:text-slate-400 hover:text-purple-400"
                                    }`}
                                  >
                                    <Building size={12} />
                                    <span className="text-[11px] font-semibold">{unit.name}</span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleDeleteEntity(unit.id, "Unidade")}
                                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>

                        </div>
                      ))}
                  </div>

                </div>
              ))}

              {enterprises.length === 0 && (
                <div className="text-center py-6 text-slate-400 space-y-2">
                  <Info size={24} className="mx-auto text-slate-350" />
                  <p className="text-xs">Estrutura organizacional vazia. Crie um Grupo corporativo acima.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Selected Context Profile & Timeline */}
        <div className="space-y-6 text-left">
          
          {/* Context Details Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-800 pb-3">
              <Activity size={16} className="text-blue-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Perfil do Contexto</h3>
            </div>

            {activeCompany ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Nome da Empresa</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{activeCompany.name}</span>
                </div>
                {activeCompany.cnpj && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">CNPJ</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{activeCompany.cnpj}</span>
                  </div>
                )}
                {activeCompany.segment && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Segmento Operacional</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">{activeCompany.segment}</span>
                  </div>
                )}
                {activeCompany.notes && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Observações táticas</span>
                    <p className="text-[10px] text-slate-500 leading-normal">{activeCompany.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-450 text-center py-4">Nenhuma empresa ativa selecionada no momento.</p>
            )}
          </div>

          {/* Timeline Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-800 pb-3">
              <History size={16} className="text-purple-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Timeline da Empresa</h3>
            </div>

            <div className="space-y-4">
              {getCompanyTimeline().map((item, idx) => (
                <div key={idx} className="flex gap-3 text-left">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    {idx < getCompanyTimeline().length - 1 && (
                      <div className="w-0.5 bg-slate-100 dark:bg-slate-800 flex-1 my-1" />
                    )}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{item.title}</h4>
                    <p className="text-[10px] text-slate-500">{item.description}</p>
                    <span className="text-[8px] font-mono text-slate-400 block">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}

              {getCompanyTimeline().length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Nenhum evento registrado nesta empresa.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Add Entity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">Adicionar no Gêmeo Digital</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Fechar</button>
            </div>

            <form onSubmit={handleAddEntity} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Tipo de Entidade</label>
                <select
                  value={addType}
                  onChange={e => setAddType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-hidden text-slate-700 dark:text-slate-300"
                >
                  <option value="group">Grupo Empresarial (Holding)</option>
                  <option value="company">Empresa / Unidade Faturamento</option>
                  <option value="unit">Filial / Oficina / Loja Física</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Nome da Entidade</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Renault Castelo, Nissan Sul"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white"
                />
              </div>

              {addType !== "unit" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Segmento</label>
                  <select
                    value={newSegment}
                    onChange={e => setNewSegment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-hidden text-slate-700 dark:text-slate-300"
                  >
                    <option value="automotive">Automotivo (Concessionárias)</option>
                    <option value="agribusiness">Agronegócio (Fazendas)</option>
                    <option value="shared">Geral / Multi-Segmento</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">CNPJ (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: 00.000.000/0000-00"
                  value={newCnpj}
                  onChange={e => setNewCnpj(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white"
                />
              </div>

              {addType !== "group" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Pai Organizacional</label>
                  <select
                    value={selectedParentId}
                    onChange={e => setSelectedParentId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-hidden text-slate-700 dark:text-slate-300"
                  >
                    <option value="">-- Selecione o Pai --</option>
                    {enterprises
                      .filter(e => addType === "company" ? e.type === "Grupo" : e.type === "Empresa")
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                      ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Observações táticas</label>
                <textarea
                  placeholder="Descrição das operações, headcount, etc..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white h-16 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cadastrar Entidade
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Associate Workbook Modal */}
      {showAssociateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-left animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">Vincular Workbook</h3>
              <button onClick={() => setShowAssociateModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Fechar</button>
            </div>

            <form onSubmit={handleAssociateWorkbook} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Workbook Disponível</label>
                <select
                  value={associateWorkbookId}
                  onChange={e => setAssociateWorkbookId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-hidden text-slate-700 dark:text-slate-300"
                >
                  <option value="">-- Selecione o Workbook --</option>
                  {workbookRepository.list().map(w => (
                    <option key={w.id} value={w.id}>{w.metadata?.name || w.id.slice(0, 12)}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                Vincular Workbook
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Group */}
      {showDeleteGroupModal && deleteGroupTarget && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full text-slate-100 space-y-4 text-left shadow-2xl">
            <h3 className="text-sm font-black uppercase text-white tracking-wider border-b border-slate-850 pb-2 flex items-center gap-2">
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
                      className="w-full text-xs p-2.5 bg-slate-955 border border-slate-800 rounded-lg text-white font-bold"
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
                className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-350 rounded-lg text-xs"
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
              Confirmar Exclusão da Empresa
            </h3>
            
            <div className="space-y-3 text-xs border-b border-slate-850 pb-3">
              <p className="text-slate-400 font-semibold leading-relaxed">
                Você solicitou a exclusão da empresa <strong>{deleteCompanyTarget.name}</strong>.
              </p>

              {/* Linked resources info */}
              <div className="p-3 bg-slate-955/65 border border-slate-850 rounded-xl space-y-2">
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
                      <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Mantém as planilhas e dados financeiros intactos na biblioteca do sistema.</p>
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
                      <p className="text-[10px] text-slate-550 mt-0.5 text-rose-400 font-semibold">Apaga definitivamente todas as planilhas importadas vinculadas a esta empresa.</p>
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
                className="px-4 py-2 bg-slate-850 hover:bg-slate-850 text-slate-350 rounded-lg text-xs"
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
