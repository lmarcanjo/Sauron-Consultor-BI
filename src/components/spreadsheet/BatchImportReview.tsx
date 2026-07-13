/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * F15.1 — Enterprise Consolidation & Context Navigation
 * BatchImportReview.tsx — Componente de importação e revisão de planilhas em lote.
 */

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, Trash2, Plus, Sparkles, Building } from "lucide-react";
import { showToast } from "../Toast";
import { enterpriseRepository, Enterprise, Company } from "../../core/persistence/EnterpriseRepository";
import { workbookRepository } from "../../core/workbook/WorkbookRepository";
import { workbookRepository as libraryWorkbookRepository } from "../../core/workbook-library/WorkbookRepository";
import { IndexedSpreadsheetStorage } from "../../core/storage/IndexedSpreadsheetStorage";
import { activateImportedSources } from "../../core/data/DataActivation";
import { activeDatasetStore } from "../../core/data/ActiveDatasetStore";
import { useDataSourceManager } from "../../hooks/useDataSourceManager";
import { dataSourceManager } from "../../services/dataSourceManager";
import { LancamentoFinanceiro } from "../../types";
import { SourceIdentity, SpreadsheetFile } from "../../types/dataSource";
import { SpreadsheetWorkspaceManager } from "../../services/spreadsheetWorkspaceManager";
import { workspaceIntelligenceEngine } from "../../core/workspace-intelligence/WorkspaceIntelligenceEngine";

let fileIdCounter = 0;
let rowIdCounter = 0;

interface BatchImportReviewProps {
  onImportCompleted: () => void;
  onCancel: () => void;
}

interface BatchFileItem {
  id: string;
  file: File;
  fingerprint: string;
  suggestedGroup: string;
  suggestedCompanyId: string;
  confidence: number;
  action: "confirm" | "ignore" | "temporary";
  rows: any[];
  sheets: string[];
  columnsCount: number;
  originalKeys: string[];
}

export const BatchImportReview: React.FC<BatchImportReviewProps> = ({ onImportCompleted, onCancel }) => {
  useDataSourceManager();
  const [fileItems, setFileItems] = useState<BatchFileItem[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  // Create enterprise modal helper
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [activeItemIdForCreation, setActiveItemIdForCreation] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEnterprises();
  }, []);

  const loadEnterprises = async () => {
    const list = await enterpriseRepository.getAll();
    setEnterprises(list);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(e.target.files);
    }
  };

  const processFiles = async (fileList: FileList) => {
    setIsProcessing(true);
    const XLSX = await import("xlsx");
    const loadedItems: BatchFileItem[] = [];

    const existingCompanies = enterprises.filter(e => e.type === "Empresa") as Company[];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const fingerprint = `fp_${file.name.replace(/\s+/g, "_")}_${file.size}`;
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        
        let fileRows: any[] = [];
        const originalKeysSet = new Set<string>();
        const sheets: string[] = [];
        let colCount = 0;

        workbook.SheetNames.forEach(sheetName => {
          sheets.push(sheetName);
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          if (json.length > 0) {
            json.forEach((row: any) => {
              Object.keys(row).forEach(k => {
                if (k !== "id") originalKeysSet.add(k);
              });
            });
            colCount = Math.max(colCount, Object.keys(json[0]).length);
            fileRows.push(...json);
          }
        });

        // Smart Suggestion Logic
        let suggestedCompanyId = "";
        let suggestedGroup = "Grupo Geral";
        let confidence = 30;

        // Tentar inferir pelo nome do arquivo ou linhas
        const lowerName = file.name.toLowerCase();
        
        // Varrer linhas do arquivo para encontrar dados de Empresa/Grupo
        const sampleRow = fileRows[0] || {};
        const rowCompany = String(sampleRow.Empresa || sampleRow.RazaoSocial || sampleRow["Razão Social"] || "").trim();
        const rowGroup = String(sampleRow.Grupo || sampleRow.GrupoEconomico || sampleRow["Grupo Econômico"] || "").trim();

        if (rowGroup) suggestedGroup = rowGroup;

        // Match contra empresas cadastradas
        let matched = existingCompanies.find(c => 
          lowerName.includes(c.name.toLowerCase()) || 
          (rowCompany && c.name.toLowerCase().includes(rowCompany.toLowerCase()))
        );

        if (matched) {
          suggestedCompanyId = matched.id;
          confidence = 95;
          const parentG = enterprises.find(e => e.id === matched?.parentId);
          if (parentG) suggestedGroup = parentG.name;
        } else if (rowCompany) {
          // Empresa não cadastrada mas identificada nas linhas
          confidence = 70;
        }

        loadedItems.push({
          id: `batch_file_${Date.now()}_${i}`,
          file,
          fingerprint,
          suggestedGroup,
          suggestedCompanyId,
          confidence,
          action: "confirm",
          rows: fileRows,
          sheets,
          columnsCount: colCount,
          originalKeys: Array.from(originalKeysSet)
        });
      } catch (e) {
        showToast("error", `Falha ao ler o arquivo ${file.name}`);
        console.error(e);
      }
    }

    setFileItems(prev => [...prev, ...loadedItems]);
    setIsProcessing(false);
  };

  const handleUpdateItemAction = (id: string, action: BatchFileItem["action"]) => {
    setFileItems(prev => prev.map(item => item.id === id ? { ...item, action } : item));
  };

  const handleUpdateItemCompany = (id: string, companyId: string) => {
    setFileItems(prev => prev.map(item => item.id === id ? { ...item, suggestedCompanyId: companyId, confidence: 100 } : item));
  };

  const handleRemoveItem = (id: string) => {
    setFileItems(prev => prev.filter(item => item.id !== id));
  };

  const openCreateCompanyModal = (itemId: string) => {
    setActiveItemIdForCreation(itemId);
    setIsCreateModalOpen(true);
  };

  const handleCreateCompanyDirectly = async () => {
    if (!newCompanyName.trim()) return;
    try {
      const activeGroup = enterprises.find(e => e.type === "Grupo");
      const newCompany: Company = {
        id: `comp_${Date.now()}`,
        parentId: activeGroup?.id || "group_default",
        unitIds: [],
        name: newCompanyName.trim(),
        type: "Empresa",
        segment: "general",
        workbookIds: [],
        contacts: []
      };

      await enterpriseRepository.save(newCompany);
      await loadEnterprises();

      if (activeItemIdForCreation) {
        handleUpdateItemCompany(activeItemIdForCreation, newCompany.id);
      }

      setNewCompanyName("");
      setIsCreateModalOpen(false);
      setActiveItemIdForCreation(null);
      showToast("success", "Empresa cadastrada e vinculada à planilha com sucesso!");
    } catch (e) {
      showToast("error", "Erro ao criar empresa.");
    }
  };

  const handleImportAll = async () => {
    const validItems = fileItems.filter(item => item.action !== "ignore");
    if (validItems.length === 0) {
      showToast("warning", "Nenhum arquivo ativo para importação.");
      return;
    }

    setIsProcessing(true);

    try {
      let accumulatedRows: LancamentoFinanceiro[] = [];
      const spreadsheetIds: string[] = [];
      const sourceNames: string[] = [];

      for (const item of validItems) {
        const fileId = `wb_${Date.now()}_${fileIdCounter++}`;
        sourceNames.push(item.file.name);
        spreadsheetIds.push(fileId);

        // Converter dados do arquivo para LancamentoFinanceiro
        const fileRowsClean = item.rows.map((row, idx) => {
          const getNum = (v: any) => {
            if (v === undefined || v === null || v === "") return 0;
            if (typeof v === "number") return v;
            const sanit = String(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
            const parsed = parseFloat(sanit);
            return isNaN(parsed) ? 0 : parsed;
          };

          return {
            id: `up_row_${Date.now()}_${idx}_${rowIdCounter++}`,
            Grupo: row["Grupo"] || row["Grupo Economico"] || row["Grupo Econômico"] || item.suggestedGroup || "Geral",
            CNPJ: row["CNPJ"] || row["Cnpj"] || "00.000.000/0001-00",
            Marca: row["Marca"] || row["Bandeira"] || "N/D",
            Empresa: row["Empresa"] || row["Razão Social"] || row["Razao Social"] || "Empresa Geral",
            Mês: row["Mês"] || row["Mes"] || row["Competência"] || row["Competencia"] || "N/D",
            Razão: row["Razão"] || row["Razao"] || "Outros",
            Categoria: row["Categoria"] || row["Classificação"] || row["Classificacao"] || "Sem Categoria",
            Receita: row["Receita"] !== undefined ? getNum(row["Receita"]) : getNum(row["Valor"] || 0),
            Custo: row["Custo"] !== undefined ? getNum(row["Custo"]) : 0,
            Despesa: row["Despesa"] !== undefined ? getNum(row["Despesa"]) : 0,
            Lucro: row["Lucro"] !== undefined ? getNum(row["Lucro"]) : 0,
            Margem: row["Margem"] !== undefined ? getNum(row["Margem"]) : 0,
            Vendedor: row["Vendedor"] || row["Consultor"] || "Padrão",
            
            // Metadados de rastreabilidade
            arquivo: item.file.name,
            aba: item.sheets[0] || "Dados",
            linha: idx + 2,
            coluna: item.columnsCount,
            dataImportacao: new Date().toISOString(),
            usuario: "Lennon Marcanjo",
            ...row
          };
        });

        accumulatedRows.push(...fileRowsClean);

        // Se for confirmar definitivo, persistir na biblioteca, IndexedDB e vincular no Twin
        if (item.action === "confirm") {
          const currentWorkspace = workspaceIntelligenceEngine.getCurrentIntelligentWorkspace();
          const workspaceId = currentWorkspace?.id || "workspace_default";

          // 1. Criar identidade canônica
          const sourceIdentity: SourceIdentity = {
            sourceId: fileId,
            workbookId: fileId,
            datasetId: fileId,
            storageKey: fileId,
            workspaceId,
            originalFileName: item.file.name
          };

          // 3 & 4 & 5. Persistir no IndexedDB
          await IndexedSpreadsheetStorage.saveRows(fileId, fileRowsClean);
          await IndexedSpreadsheetStorage.saveMetadata(fileId, {
            id: fileId,
            fileName: item.file.name,
            sheets: item.sheets.map(name => ({
              sheetName: name,
              rowCount: item.rows.length,
              columns: item.originalKeys,
              previewRows: fileRowsClean.slice(0, 5)
            })),
            uploadedAt: new Date().toISOString()
          });

          // 6. Vincular no Twin
          if (item.suggestedCompanyId) {
            const comp = enterprises.find(e => e.id === item.suggestedCompanyId) as Company;
            if (comp) {
              const currentWbIds = (comp as any).workbookIds || [];
              if (!currentWbIds.includes(fileId)) {
                await enterpriseRepository.save({
                  ...comp,
                  workbookIds: [...currentWbIds, fileId]
                });
              }
            }
          }

          // 7 & 8. Validar leitura do metadata e rows de forma leve (sem carregar tudo)
          let isPersistedValid = false;
          try {
            const checkMeta = await IndexedSpreadsheetStorage.getMetadata(fileId);
            const rowCount = checkMeta?.sheets?.reduce((sum, s) => sum + s.rowCount, 0) || 0;
            const checkPreview = await IndexedSpreadsheetStorage.getRowsPaged(fileId, item.sheets[0] || "Dados", 0, 1);
            if (checkMeta && rowCount > 0 && checkPreview && checkPreview.length > 0) {
              isPersistedValid = true;
            }
          } catch (e) {
            console.error(`[Persistencia] Falha ao validar dados gravados de ${fileId}:`, e);
          }

          const statusString = isPersistedValid ? "READY" : "STORAGE_INCOMPLETE";

          // Criar metadados da planilha para biblioteca
          const datasetPayload = {
            datasetId: fileId,
            sourceType: "SPREADSHEET_DATA" as const,
            sourceName: item.file.name,
            importedAt: new Date().toISOString(),
            rowCount: item.rows.length,
            columnCount: item.columnsCount,
            sheets: item.sheets.map(name => ({
              sheetName: name,
              rowCount: item.rows.length,
              columnCount: item.columnsCount,
              formulaCount: 0,
              storageRef: `ref_${fileId}_${name}`,
              classification: "Base de dados" as const,
              selectedForImport: true
            })),
            activeSheet: item.sheets[0] || "Dados",
            previewRows: fileRowsClean.slice(0, 5).map((row, idx) => ({
              raw: row,
              normalized: row,
              metadata: {
                rowIndex: idx + 1,
                sheetName: item.sheets[0] || "Dados",
                fileName: item.file.name
              }
            })),
            columnProfiles: item.originalKeys.map(k => ({
              name: k,
              originalName: k,
              type: "string",
              isDRE: ["Receita", "Custo", "Despesa", "Lucro", "Margem"].includes(k),
              isKPI: ["CNPJ", "Vendedor", "Comissão"].includes(k)
            })),
            importProfile: null,
            rawStorageRef: fileId,
            status: "ACTIVE" as const,
            sourceIdentity,
          };

          // Salvar no repositório de planilhas da biblioteca
          const { workbook } = libraryWorkbookRepository.createWorkbookFromActiveDataset(datasetPayload);
          libraryWorkbookRepository.setWorkbookStatus(workbook.id, statusString as any);

          // Salvar no repositório core
          const virtualWorkbook = {
            id: fileId,
            name: item.file.name,
            sheets: item.sheets.map(name => ({
              sheetName: name,
              rowCount: item.rows.length
            })),
            columns: item.originalKeys.map(k => ({ name: k, type: "any" })),
            metadata: {
              importedAt: new Date().toISOString(),
              size: item.file.size
            },
            createdAt: new Date().toISOString(),
            activeDataset: datasetPayload,
          };
          workbookRepository.save(virtualWorkbook as any);
        }
      }

      // Consolidar todos através do ativador unificado
      if (accumulatedRows.length > 0) {
        const firstValidItem = validItems.find(item => item.suggestedCompanyId);
        const targetCompany = firstValidItem 
          ? enterprises.find(e => e.id === firstValidItem.suggestedCompanyId) as Company
          : enterprises.find(e => e.type === "Empresa") as Company;

        const parentGroup = targetCompany?.parentId 
          ? enterprises.find(e => e.id === targetCompany.parentId) 
          : enterprises.find(e => e.type === "Grupo");

        const activeContext = {
          groupId: parentGroup?.id,
          companyId: targetCompany?.id,
          workbookIds: spreadsheetIds,
          datasetIds: spreadsheetIds,
          scope: parentGroup ? "GROUP" as const : "COMPANY" as const
        };

        await activateImportedSources({
          workbookIds: spreadsheetIds,
          datasetIds: spreadsheetIds,
          enterpriseContext: activeContext
        });
      }

      showToast("success", `${validItems.length} planilhas importadas com sucesso!`);
      onImportCompleted();
    } catch (e) {
      showToast("error", "Erro ao processar a importação em lote.");
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 text-left font-sans text-xs">
      
      {/* Upload Zone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragOver ? "border-blue-500 bg-blue-500/5" : "border-slate-350 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/20"
        }`}
      >
        <input 
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".csv, .xlsx, .xls"
          className="hidden"
        />
        <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2 animate-bounce" />
        <p className="text-slate-850 dark:text-slate-200 font-bold uppercase tracking-wider">
          Arraste planilhas ou clique para selecionar múltiplos arquivos
        </p>
        <p className="text-slate-450 mt-1">Formatos aceitos: CSV, XLSX, XLS. Nenhum arquivo substitui outro automaticamente.</p>
      </div>

      {fileItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
            <span className="font-extrabold uppercase text-slate-500 tracking-wider">Revisão de Lote ({fileItems.length} Arquivos)</span>
            <div className="flex gap-2">
              <button 
                onClick={handleImportAll}
                disabled={isProcessing}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black uppercase transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isProcessing ? "Importando..." : "Confirmar Todas"}
              </button>
              <button 
                onClick={onCancel}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg font-black uppercase transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 uppercase tracking-widest text-[9px] font-black">
                  <th className="py-2 text-left">Arquivo</th>
                  <th className="py-2 text-left">Grupo</th>
                  <th className="py-2 text-left">Empresa Sugerida</th>
                  <th className="py-2 text-center">Confiança</th>
                  <th className="py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {fileItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                    <td className="py-3 flex items-center gap-2">
                      <FileSpreadsheet className="text-emerald-500 shrink-0" size={14} />
                      <div className="max-w-[150px] truncate">
                        <span className="font-bold text-slate-800 dark:text-slate-250 block truncate">{item.file.name}</span>
                        <span className="text-[9px] text-slate-450 block font-mono">{(item.file.size / 1024).toFixed(0)} KB | {item.rows.length} linhas</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-650 dark:text-slate-400 font-semibold">{item.suggestedGroup}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={item.suggestedCompanyId}
                          onChange={e => handleUpdateItemCompany(item.id, e.target.value)}
                          className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg focus:outline-hidden"
                        >
                          <option value="">-- Sem vínculo --</option>
                          {enterprises.filter(e => e.type === "Empresa").map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => openCreateCompanyModal(item.id)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 text-blue-500 rounded-lg transition-colors cursor-pointer"
                          title="Cadastrar nova empresa"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                        item.confidence >= 90 ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-455" :
                        item.confidence >= 60 ? "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-455" :
                        "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}>
                        {item.confidence}%
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-1">
                      <select
                        value={item.action}
                        onChange={e => handleUpdateItemAction(item.id, e.target.value as any)}
                        className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded focus:outline-hidden"
                      >
                        <option value="confirm">Vincular Definitivo</option>
                        <option value="temporary">Abrir Temporário</option>
                        <option value="ignore">Ignorar Planilha</option>
                      </select>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 text-rose-500 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Direct creation modal overlay */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-96 text-left space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Building size={16} className="text-blue-500" /> Cadastrar Nova Empresa
            </h3>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-450 uppercase font-black">Nome da Empresa</span>
              <input
                type="text"
                placeholder="Ex: Fazendas Farmers"
                value={newCompanyName}
                onChange={e => setNewCompanyName(e.target.value)}
                className="w-full bg-slate-950 text-xs px-3 py-2 rounded-lg border border-slate-800 text-white"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={handleCreateCompanyDirectly}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase transition-all cursor-pointer"
              >
                Cadastrar
              </button>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-black uppercase transition-all cursor-pointer"
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
export default BatchImportReview;
