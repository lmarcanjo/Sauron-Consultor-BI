/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 *
 * F15.1 — Enterprise Consolidation & Context Navigation
 * WorkbookLibraryTab.tsx — Visualização agrupada da biblioteca de planilhas.
 */

import React, { useEffect, useState } from "react";
import { 
  Archive, CheckCircle2, FileSpreadsheet, Pencil, Plus, RotateCcw, 
  Trash2, Building, Network, ChevronRight, ChevronDown, Move, CheckSquare
} from "lucide-react";
import { activeDatasetStore } from "../core/data/ActiveDatasetStore";
import {
  DEFAULT_WORKBOOK_PROJECT_ID,
  Workbook,
  WorkbookReadinessViewModel,
  workbookReadinessService,
  workbookRepository,
} from "../core/workbook-library";
import { enterpriseRepository, Enterprise, Company, BusinessGroup, Unit } from "../core/persistence/EnterpriseRepository";
import { SafeDisplayAdapters } from "../core/workbook/SafeDisplayAdapters";
import { showToast } from "./Toast";
import { getEnterpriseContext } from "../core/enterprise-consolidation/EnterpriseContextStore";
import { enterpriseConsolidationService } from "../core/enterprise-consolidation";

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString("pt-BR") : value;
}

import { activateImportedSources } from "../core/data/DataActivation";

export const WorkbookLibraryTab: React.FC = () => {
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [selectedWorkbookId, setSelectedWorkbookId] = useState<string>("");
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [targetMoveWorkbookId, setTargetMoveWorkbookId] = useState<string | null>(null);
  const [readinessByWorkbookId, setReadinessByWorkbookId] = useState<Record<string, WorkbookReadinessViewModel>>({});
  const [sourceBindings, setSourceBindings] = useState<Awaited<ReturnType<typeof enterpriseRepository.listSourceBindings>>>([]);

  const refresh = React.useCallback(async () => {
    const list = workbookRepository.listWorkbooks({
      projectId: DEFAULT_WORKBOOK_PROJECT_ID,
      includeArchived: true,
    });
    setWorkbooks(list);
    setSelectedWorkbookId(workbookRepository.getSelectedWorkbook()?.id || "");

    const ents = await enterpriseRepository.getAll();
    setEnterprises(ents);
    const bindings = await enterpriseRepository.listSourceBindings();
    setSourceBindings(bindings);

    const nextReadiness: Record<string, WorkbookReadinessViewModel> = {};
    await Promise.all(
      list.map(async (wb) => {
        const binding = bindings.find(item => item.workbookId === wb.id || item.sourceId === wb.id);
        const linkedEnterpriseIds = [binding?.groupId, binding?.companyId, binding?.unitId].filter(Boolean) as string[];

        nextReadiness[wb.id] = await workbookReadinessService.evaluate({
          workbook: wb,
          linkedEnterpriseIds,
          hasMappings: true,
          hasEnabledModules: wb.status === "ACTIVE",
          hasPresentation: false,
          hasPersistentStorage: true,
          hasSelectedTabs: true,
        });
      })
    );

    setReadinessByWorkbookId(nextReadiness);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activateWorkbook = async (workbookId: string) => {
    try {
      const dataset = workbookRepository.selectWorkbook(workbookId, DEFAULT_WORKBOOK_PROJECT_ID);
      if (!dataset) {
        showToast("error", "Planilha não encontrada no repositório.");
        return;
      }

      const binding = await enterpriseRepository.getSourceBinding(workbookId);
      // O vínculo canônico é a fonte de verdade; arrays antigos servem apenas
      // para abrir bibliotecas criadas antes da migração.
      const linkedEnt = binding?.unitId
        ? enterprises.find(entity => entity.id === binding.unitId)
        : binding?.companyId
          ? enterprises.find(entity => entity.id === binding.companyId)
          : binding?.groupId
            ? enterprises.find(entity => entity.id === binding.groupId)
            : enterprises.find(e => e.id === workbookId || (e as any).workbookIds?.includes(workbookId));
      
      let groupId = undefined;
      let companyId = undefined;
      let unitId: string | undefined;
      let scope: "GROUP" | "COMPANY" | "UNIT" | "WORKBOOK" = "WORKBOOK";

      if (binding) {
        groupId = binding.groupId;
        companyId = binding.companyId;
        unitId = binding.unitId;
        scope = unitId ? "UNIT" : companyId ? "COMPANY" : groupId ? "GROUP" : "WORKBOOK";
      } else if (linkedEnt) {
        if (linkedEnt.type === "Grupo") {
          groupId = linkedEnt.id;
          scope = "GROUP";
        } else if (linkedEnt.type === "Empresa") {
          companyId = linkedEnt.id;
          groupId = linkedEnt.parentId;
          scope = "COMPANY";
        } else if (linkedEnt.type === "Unidade") {
          companyId = linkedEnt.parentId;
          const parentComp = enterprises.find(e => e.id === linkedEnt.parentId) as Company;
          groupId = parentComp?.parentId;
          scope = "UNIT";
        }
      }

      await activateImportedSources({
        workbookIds: [workbookId],
        datasetIds: [dataset.datasetId],
        enterpriseContext: {
          groupId,
          companyId,
          unitId,
          workbookIds: [workbookId],
          datasetIds: [dataset.datasetId],
          scope
        }
      });

      await enterpriseConsolidationService.refreshActiveDatasetForContext(getEnterpriseContext());

      await refresh();
      showToast("success", "Planilha ativada para análise.");
    } catch (err: any) {
      console.error("[WorkbookLibraryTab] Error activating workbook:", err);
      showToast("error", "Erro ao ativar planilha: " + err.message);
    }
  };

  const archiveWorkbook = (workbook: Workbook) => {
    workbookRepository.archiveWorkbook(workbook.id);
    if (selectedWorkbookId === workbook.id) activeDatasetStore.clearActiveDataset();
    void enterpriseConsolidationService.refreshActiveDatasetForContext(getEnterpriseContext());
    void refresh();
      showToast("info", "Planilha arquivada com sucesso.");
  };

  const restoreWorkbook = (workbook: Workbook) => {
    workbookRepository.restoreWorkbook(workbook.id);
    void enterpriseConsolidationService.refreshActiveDatasetForContext(getEnterpriseContext());
    void refresh();
      showToast("success", "Planilha restaurada com sucesso.");
  };

  const deleteWorkbook = (workbook: Workbook) => {
    if (!window.confirm(`Excluir "${workbook.name}" da biblioteca? Esta ação não pode ser desfeita.`)) return;
    workbookRepository.deleteWorkbook(workbook.id);
    if (selectedWorkbookId === workbook.id) activeDatasetStore.clearActiveDataset();
    void enterpriseConsolidationService.refreshActiveDatasetForContext(getEnterpriseContext());
    void refresh();
      showToast("success", "Planilha removida da biblioteca.");
  };

  // Mover workbook para outra empresa
  const handleMoveWorkbook = async (companyId: string) => {
    if (!targetMoveWorkbookId) return;
    
    const targetComp = enterprises.find(e => e.id === companyId) as Company;
    if (!targetComp) return;

    if (!window.confirm(`Deseja mover este workbook para a empresa "${targetComp.name}"?`)) return;

    try {
      const workbook = workbookRepository.getWorkbook(targetMoveWorkbookId);
      const version = workbook ? workbookRepository.getCurrentVersion(workbook.id) : null;
      await enterpriseRepository.bindSource({
        sourceId: version?.activeDataset?.datasetId || targetMoveWorkbookId,
        workbookId: targetMoveWorkbookId,
        datasetId: version?.activeDataset?.datasetId || targetMoveWorkbookId,
        groupId: targetComp.parentId,
        companyId: targetComp.id,
      });
      await enterpriseConsolidationService.refreshActiveDatasetForContext(getEnterpriseContext());

      showToast("success", `Planilha movida com sucesso para a empresa ${targetComp.name}.`);
      setIsMoveModalOpen(false);
      setTargetMoveWorkbookId(null);
      await refresh();
    } catch (e) {
      showToast("error", "Erro ao mover workbook.");
    }
  };

  // Organizar os workbooks por hierarquia
  const groups = enterprises.filter(e => e.type === "Grupo") as BusinessGroup[];
  const companies = enterprises.filter(e => e.type === "Empresa") as Company[];

  const getWbsForCompany = (comp: Company): Workbook[] => {
    const wbIds = new Set(sourceBindings
      .filter(binding => binding.companyId === comp.id && !binding.unitId)
      .map(binding => binding.workbookId));
    return workbooks.filter(w => wbIds.has(w.id));
  };

  const getWbsForUnit = (unit: Unit): Workbook[] => {
    const wbIds = new Set(sourceBindings
      .filter(binding => binding.unitId === unit.id)
      .map(binding => binding.workbookId));
    return workbooks.filter(w => wbIds.has(w.id));
  };

  // Workbooks vinculados a entidades que não aparecem na árvore atual também
  // precisam permanecer visíveis, para que nenhum arquivo persistido suma da
  // biblioteca por uma inconsistência de hierarquia.
  const visibleGroupIds = new Set(groups.map(group => group.id));
  const visibleCompanyIds = new Set(
    companies.filter(company => company.parentId && visibleGroupIds.has(company.parentId)).map(company => company.id)
  );
  const visibleUnitIds = new Set(
    enterprises
      .filter(entity => entity.type === "Unidade" && entity.parentId && visibleCompanyIds.has(entity.parentId))
      .map(entity => entity.id)
  );
  const visibleHierarchyEntityIds = new Set([...visibleGroupIds, ...visibleCompanyIds, ...visibleUnitIds]);
  const visibleHierarchyWorkbookIds = new Set(
    sourceBindings
      .filter(binding => [binding.groupId, binding.companyId, binding.unitId].some(id => id && visibleHierarchyEntityIds.has(id)))
      .map(binding => binding.workbookId)
  );
  const unlinkedWorkbooks = workbooks.filter(wb => !visibleHierarchyWorkbookIds.has(wb.id));

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-150 text-left font-sans text-xs">
      
      {/* Top summary header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <FileSpreadsheet size={16} className="text-blue-500" />
              Biblioteca de Planilhas
            </h2>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Todas as fontes da consultoria, organizadas por grupo, empresa e unidade.
            </p>
          </div>
        </div>
      </div>

      {/* Renderização Hierárquica */}
      <div className="space-y-4">
        {groups.map(group => {
          const groupCompanies = companies.filter(c => c.parentId === group.id);
          
          return (
            <div key={group.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                <Network size={14} className="text-blue-500" />
                <span className="font-extrabold text-slate-850 dark:text-slate-100 uppercase tracking-wider">Grupo: {group.name}</span>
              </div>

              {groupCompanies.length === 0 ? (
                <p className="text-[10px] text-slate-450 pl-6">Nenhuma empresa cadastrada sob este grupo.</p>
              ) : (
                <div className="space-y-3 pl-4">
                  {groupCompanies.map(company => {
                    const compWbs = getWbsForCompany(company);
                    const childUnits = enterprises.filter(e => e.type === "Unidade" && e.parentId === company.id) as Unit[];

                    return (
                      <div key={company.id} className="border-l-2 border-slate-100 dark:border-slate-800 pl-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Building size={12} className="text-slate-450" />
                          <span className="font-bold text-slate-800 dark:text-slate-250">Empresa: {company.name}</span>
                        </div>

                        {/* Workbooks da Empresa */}
                        {compWbs.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                            {compWbs.map(wb => (
                              <WorkbookCard 
                                key={wb.id} 
                                wb={wb} 
                                readiness={readinessByWorkbookId[wb.id]}
                                isSelected={wb.id === selectedWorkbookId}
                                companyName={company.name}
                                onActivate={() => activateWorkbook(wb.id)}
                                onArchive={() => archiveWorkbook(wb)}
                                onRestore={() => restoreWorkbook(wb)}
                                onDelete={() => deleteWorkbook(wb)}
                                onMove={() => {
                                  setTargetMoveWorkbookId(wb.id);
                                  setIsMoveModalOpen(true);
                                }}
                              />
                            ))}
                          </div>
                        )}

                        {/* Unidades da Empresa */}
                        {childUnits.length > 0 && (
                          <div className="pl-4 space-y-2 pt-1">
                            {childUnits.map(unit => {
                              const unitWbs = getWbsForUnit(unit);
                              if (unitWbs.length === 0) return null;
                              return (
                                <div key={unit.id} className="space-y-1">
                                  <span className="text-[10px] text-slate-450 font-bold">Unidade: {unit.name}</span>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                                    {unitWbs.map(wb => (
                                      <WorkbookCard 
                                        key={wb.id} 
                                        wb={wb} 
                                        readiness={readinessByWorkbookId[wb.id]}
                                        isSelected={wb.id === selectedWorkbookId}
                                        companyName={company.name}
                                        onActivate={() => activateWorkbook(wb.id)}
                                        onArchive={() => archiveWorkbook(wb)}
                                        onRestore={() => restoreWorkbook(wb)}
                                        onDelete={() => deleteWorkbook(wb)}
                                        onMove={() => {
                                          setTargetMoveWorkbookId(wb.id);
                                          setIsMoveModalOpen(true);
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {compWbs.length === 0 && childUnits.length === 0 && (
                          <p className="text-[10px] text-slate-450 pl-4">Nenhuma planilha vinculada a esta empresa.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Planilhas sem vinculo */}
        {unlinkedWorkbooks.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-805 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider">Planilhas sem vinculo definido</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
              {unlinkedWorkbooks.map(wb => (
                <WorkbookCard 
                  key={wb.id} 
                  wb={wb} 
                  readiness={readinessByWorkbookId[wb.id]}
                  isSelected={wb.id === selectedWorkbookId}
                  companyName="Sem Vínculo"
                  onActivate={() => activateWorkbook(wb.id)}
                  onArchive={() => archiveWorkbook(wb)}
                  onRestore={() => restoreWorkbook(wb)}
                  onDelete={() => deleteWorkbook(wb)}
                  onMove={() => {
                    setTargetMoveWorkbookId(wb.id);
                    setIsMoveModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal para Mover de Empresa */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-96 text-left space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Move size={16} className="text-blue-500" /> Associar Planilha a Empresa
            </h3>
            <p className="text-xs text-slate-400">Selecione a empresa de destino para esta planilha:</p>
            <div className="space-y-1">
              <select
                onChange={e => handleMoveWorkbook(e.target.value)}
                defaultValue=""
                className="w-full bg-slate-950 text-xs px-3 py-2 rounded-lg border border-slate-800 text-white focus:outline-hidden"
              >
                <option value="" disabled>Selecione uma empresa</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setIsMoveModalOpen(false);
                  setTargetMoveWorkbookId(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-lg text-xs font-black uppercase transition-all cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Cartao de uma planilha na biblioteca.
const WorkbookCard: React.FC<{
  wb: Workbook;
  readiness?: WorkbookReadinessViewModel;
  isSelected: boolean;
  companyName: string;
  onActivate: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onMove: () => void;
}> = ({ wb, readiness, isSelected, companyName, onActivate, onArchive, onRestore, onDelete, onMove }) => {
  const safe = SafeDisplayAdapters.toSafeWorkbook(wb);
  return (
    <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between h-[130px] ${
      isSelected 
        ? "bg-blue-600/10 border-blue-500/50 shadow-sm" 
        : "bg-slate-50/50 dark:bg-slate-950/20 border-slate-150 dark:border-slate-850 hover:bg-slate-100/50 dark:hover:bg-slate-950/40"
    }`}>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-mono text-slate-450 uppercase font-black">
            Empresa: {companyName}
          </span>
          <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
            readiness?.badgeClass ?? (safe.status === "ACTIVE" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-450" : "bg-slate-200 text-slate-500")
          }`}>
            {readiness?.label ?? (safe.status === "ACTIVE" ? "Ativo" : "Arquivado")}
          </span>
        </div>
        <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 truncate mt-1">{safe.name}</h4>
        <span className="text-[10px] text-slate-450 block truncate">Importado em: {safe.displayImportedAt}</span>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-850/60">
        <div className="flex items-center gap-1 text-[9px] font-mono text-slate-450">
          <span>{safe.displayRowCount} Linhas</span>
        </div>
        
        <div className="flex gap-1.5">
          {wb.status === "ACTIVE" ? (
            <>
              {!isSelected && (
                <button 
                  onClick={onActivate} 
                  className="p-1 hover:bg-blue-500/20 text-blue-500 rounded transition-colors cursor-pointer"
                  title="Usar esta planilha"
                >
                  <CheckSquare size={12} />
                </button>
              )}
              <button 
                onClick={onMove} 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded transition-colors cursor-pointer"
                title="Mover para outra Empresa"
              >
                <Move size={12} />
              </button>
              <button 
                onClick={onArchive} 
                className="p-1 hover:bg-amber-500/20 text-amber-500 rounded transition-colors cursor-pointer"
                title="Arquivar"
              >
                <Archive size={12} />
              </button>
            </>
          ) : (
            <button 
              onClick={onRestore} 
              className="p-1 hover:bg-emerald-500/20 text-emerald-500 rounded transition-colors cursor-pointer"
              title="Restaurar"
            >
              <RotateCcw size={12} />
            </button>
          )}
          <button 
            onClick={onDelete} 
            className="p-1 hover:bg-rose-500/20 text-rose-500 rounded transition-colors cursor-pointer"
            title="Excluir da biblioteca"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default WorkbookLibraryTab;
