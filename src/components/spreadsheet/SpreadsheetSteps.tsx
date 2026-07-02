/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Upload, FileSpreadsheet, Plus, ArrowRight, RefreshCw, Trash2, HelpCircle, AlertCircle, Info, Sparkles, Check, CheckCircle2
} from "lucide-react";
import { SpreadsheetExcelViewer } from "./SpreadsheetExcelViewer";
import { ColumnConfigDrawer } from "./ColumnConfigDrawer";
import { SpreadsheetStructureDiagnostics } from "./SpreadsheetStructureDiagnostics";
import { SpreadsheetColumn, SpreadsheetSheet } from "../../types/dataSource";

// --- 1. SPREADSHEET UPLOAD STEP ---
interface SpreadsheetUploadStepProps {
  importProgress: { message: string; percent: number } | null;
  triggerFileSelect: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleLocalFileLoad: (e: React.ChangeEvent<HTMLInputElement>) => void;
  carregarDemonstrativoFicticio: (id: "automotivo" | "agro" | "servicos" | "industria") => void;
  rawFiles: { id: string; name: string; size: number; type: string }[];
  aggregationStrategy: "APPEND" | "REPLACE" | "MERGE";
  setAggregationStrategy: (val: "APPEND" | "REPLACE" | "MERGE") => void;
  joinKey: string;
  setJoinKey: (val: string) => void;
  conflictResolution: "LAST_WINS" | "FIRST_WINS";
  setConflictResolution: (val: "LAST_WINS" | "FIRST_WINS") => void;
  importHistory: { id: string; fileName: string; date: string; rows: number; cols: number; active: boolean }[];
  setImportHistory: React.Dispatch<React.SetStateAction<{ id: string; fileName: string; date: string; rows: number; cols: number; active: boolean }[]>>;
  rawRows: any[];
  setActiveStep: (val: "upload" | "abas" | "mapeamento" | "ativacao") => void;
  demoOptions: { id: string; label: string; icon: any }[];
}

export const SpreadsheetUploadStep: React.FC<SpreadsheetUploadStepProps> = ({
  importProgress,
  triggerFileSelect,
  fileInputRef,
  handleLocalFileLoad,
  carregarDemonstrativoFicticio,
  rawFiles,
  aggregationStrategy,
  setAggregationStrategy,
  joinKey,
  setJoinKey,
  conflictResolution,
  setConflictResolution,
  importHistory,
  setImportHistory,
  rawRows,
  setActiveStep,
  demoOptions
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h2 className="text-sm font-black uppercase text-slate-705 dark:text-slate-350">Passo 1: Carregar Planilhas e Fontes Auxiliares</h2>
        <p className="text-xs text-slate-400 mt-1">Carregue arquivos .xlsx, .xls ou .csv para processamento e consolidação automática.</p>
      </div>

      {importProgress && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-150 dark:border-blue-900 rounded-xl space-y-2 animate-fade-in shadow-3xs">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
              <RefreshCw size={14} className="animate-spin text-blue-500" />
              {importProgress.message}
            </span>
            <span className="font-mono text-blue-700 dark:text-blue-400 font-bold">{importProgress.percent}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-850 rounded-full h-2 overflow-hidden border border-slate-300/30">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${importProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      <div 
        onClick={triggerFileSelect}
        className="border-2 border-dashed border-slate-205 dark:border-slate-800 rounded-2xl p-8 bg-slate-50/30 dark:bg-slate-900/20 hover:bg-blue-50/10 hover:border-blue-400 transition-colors cursor-pointer text-center space-y-3"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleLocalFileLoad} 
          accept=".csv, .xlsx, .xls, .tsv" 
          multiple 
          className="hidden" 
        />
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
          <Upload className="text-blue-600 dark:text-blue-400" size={24} />
        </div>
        <p className="text-xs font-bold text-slate-705 dark:text-slate-250">Arraste seus arquivos de planilhas ou dê um clique para navegar</p>
        <p className="text-[10.5px] text-slate-405">Suporte: .XLSX, .XLS, .CSV ou .TSV de qualquer layout e número de abas</p>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Aceleração: Carregar Estrutura Fictícia</span>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {demoOptions.map(item => (
            <button
              key={item.id}
              onClick={() => carregarDemonstrativoFicticio(item.id as any)}
              className="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 hover:border-blue-300 transition-colors gap-2 cursor-pointer"
            >
              <item.icon className="text-blue-500" size={24} />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {rawFiles.length > 0 && (
        <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Planilhas Ativas Registradas ({rawFiles.length})</span>
          <div className="divide-y divide-slate-200/50 dark:divide-slate-800">
            {rawFiles.map(f => (
              <div key={f.id} className="py-2 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={14} className="text-emerald-500" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">{f.name}</span>
                  <span className="text-[10px] text-slate-400">({Math.round(f.size/1024)} KB)</span>
                </div>
                <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-450 font-bold px-2 py-0.5 rounded text-[10px]">RAW LOADED</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Configurações de Consolidação (Multi-Planilha)</span>
          <p className="text-[11px] text-slate-450">Escolha o comportamento ao importar múltiplas planilhas simultâneas.</p>
          
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Estratégia de Integração</label>
              <select
                value={aggregationStrategy}
                onChange={(e) => setAggregationStrategy(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs font-bold"
              >
                <option value="APPEND">Adicionar ao final (APPEND)</option>
                <option value="REPLACE">Sobrescrever tudo (REPLACE)</option>
                <option value="MERGE">Carregar como nova versão independente (SEPARATE)</option>
              </select>
            </div>

            {aggregationStrategy === "MERGE" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Chave de Junção (Join)</label>
                  <select
                    value={joinKey}
                    onChange={(e) => setJoinKey(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs font-bold"
                  >
                    <option value="Empresa">Empresa</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="Marca">Marca/Bandeira</option>
                    <option value="Mês">Mês</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Conflitos de Duplicados</label>
                  <select
                    value={conflictResolution}
                    onChange={(e) => setConflictResolution(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs font-bold"
                  >
                    <option value="LAST_WINS">Última Escrita (Last Wins)</option>
                    <option value="FIRST_WINS">Primeira Escrita (First Wins)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Histórico de Carga Recente</span>
          <p className="text-[11px] text-slate-450">Tente desativar/ativar fontes para auditorias de performance.</p>

          <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
            {importHistory.map(hist => (
              <div key={hist.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px]">
                <div className="truncate max-w-[160px]">
                  <span className="font-bold block truncate text-slate-700 dark:text-slate-300" title={hist.fileName}>{hist.fileName}</span>
                  <span className="text-[9px] text-slate-400">{hist.date} • {hist.rows} rows • {hist.cols} cols</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded ${hist.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"}`}>
                    {hist.active ? "Ativo" : "Pendente"}
                  </span>
                  <input
                    type="checkbox"
                    checked={hist.active}
                    onChange={(e) => {
                      setImportHistory(prev => prev.map(p => p.id === hist.id ? { ...p, active: e.target.checked } : p));
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {rawRows.length > 0 && (
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveStep("abas")}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            Continuar para Visualizar Planilha <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};


// --- 2. SPREADSHEET PREVIEW STEP ---
interface SpreadsheetPreviewStepProps {
  rawSheets: { id: string; fileName: string; sheetName: string; selected: boolean; classification: string; rowCount: number; customName: string }[];
  setRawSheets: React.Dispatch<React.SetStateAction<{ id: string; fileName: string; sheetName: string; selected: boolean; classification: string; rowCount: number; customName: string }[]>>;
  rawRows: any[];
  selectedFileId: string;
  setSelectedFileId: (val: string) => void;
  rawFiles: { id: string; name: string; size: number; type: string }[];
  activeSheetName: string;
  setActiveSheetName: (val: string) => void;
  setActiveStep: (val: "upload" | "abas" | "mapeamento" | "ativacao") => void;
  viewerSheets: SpreadsheetSheet[];
  viewerColumnProfiles?: Record<string, SpreadsheetColumn>;
  onSelectColumn: (columnName: string) => void;
  onRenameColumn: (columnName: string, newAlias: string) => void;
  onToggleColumnUsage: (columnName: string, ignored: boolean) => void;
  onToggleFilter: (columnName: string, isFilter: boolean) => void;
}

export const SpreadsheetPreviewStep: React.FC<SpreadsheetPreviewStepProps> = ({
  rawSheets,
  setRawSheets,
  rawRows,
  selectedFileId,
  setSelectedFileId,
  rawFiles,
  activeSheetName,
  setActiveSheetName,
  setActiveStep,
  viewerSheets,
  viewerColumnProfiles = {},
  onSelectColumn,
  onRenameColumn,
  onToggleColumnUsage,
  onToggleFilter
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black uppercase text-slate-705 dark:text-slate-350">Passo 2: Abas Encontradas e Seleção de Amostra</h2>
          <p className="text-xs text-slate-400 mt-1">Configure quais abas representam os lançamentos financeiros gerenciais.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveStep("upload")}
            className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-250 text-slate-700 rounded-lg"
          >
            Voltar
          </button>
          <button
            onClick={() => setActiveStep("mapeamento")}
            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-750 text-white rounded-lg flex items-center gap-1.5"
          >
            Configurar Colunas <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Identificação de Abas</span>
            <div className="space-y-2.5 max-h-[250px] overflow-y-auto custom-scrollbar">
              {rawSheets.map(sheet => (
                <div key={sheet.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={sheet.selected} 
                        onChange={(e) => {
                          setRawSheets(prev => prev.map(p => p.id === sheet.id ? { ...p, selected: e.target.checked } : p));
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                      />
                      <span>{sheet.sheetName}</span>
                    </label>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">{sheet.rowCount} rows</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Classificação</span>
                      <select 
                        value={sheet.classification} 
                        onChange={(e) => {
                          setRawSheets(prev => prev.map(p => p.id === sheet.id ? { ...p, classification: e.target.value } : p));
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5"
                      >
                        <option value="DRE">Lançamento Geral</option>
                        <option value="VENDEDORES">Comissões Vendedores</option>
                        <option value="IGNORE">Ignorar Aba</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Apelido</span>
                      <input 
                        type="text" 
                        value={sheet.customName} 
                        onChange={(e) => {
                          setRawSheets(prev => prev.map(p => p.id === sheet.id ? { ...p, customName: e.target.value } : p));
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-350" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Visualizador Prévio Interativo de Planilha</span>
            <select
              value={selectedFileId}
              onChange={(e) => {
                setSelectedFileId(e.target.value);
                const file = rawFiles.find(f => f.id === e.target.value);
                if (file) setActiveSheetName(file.name);
              }}
              className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1 text-slate-800 dark:text-slate-200"
            >
              {rawFiles.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-950 p-2">
            <SpreadsheetExcelViewer
              sheets={viewerSheets}
              activeSheet={activeSheetName}
              onSelectSheet={setActiveSheetName}
              columnProfiles={viewerColumnProfiles}
              onSelectColumn={onSelectColumn}
              onRenameColumn={onRenameColumn}
              onToggleColumnUsage={onToggleColumnUsage}
              onToggleFilter={onToggleFilter}
            />
          </div>
        </div>
      </div>
    </div>
  );
};


// --- 3. SPREADSHEET COLUMN CONFIG STEP ---
interface SpreadsheetColumnConfigStepProps {
  columnMappings: Record<string, string>;
  handleMappingChange: (targetField: string, spreadsheetCol: string) => void;
  availableColumns: string[];
  activeTemplateName: string;
  isCustomizingMappings: boolean;
  setIsCustomizingMappings: (val: boolean) => void;
  importProfileName: string;
  setImportProfileName: (val: string) => void;
  activeSegment: string;
  setActiveSegment: (val: "automotivo" | "agro" | "servicos" | "industria" | "geral") => void;
  setActiveStep: (val: "upload" | "abas" | "mapeamento" | "ativacao") => void;
  isMappingValid: boolean;
}

export const SpreadsheetColumnConfigStep: React.FC<SpreadsheetColumnConfigStepProps> = ({
  columnMappings,
  handleMappingChange,
  availableColumns,
  activeTemplateName,
  isCustomizingMappings,
  setIsCustomizingMappings,
  importProfileName,
  setImportProfileName,
  activeSegment,
  setActiveSegment,
  setActiveStep,
  isMappingValid
}) => {
  const fields = [
    { key: "Grupo", label: "Holding / Grupo", desc: "Grupo empresarial (ex: Grupo Alpha)", required: true },
    { key: "CNPJ", label: "CNPJ Filial", desc: "CNPJ com ou sem máscara (ex: 00.000.000/0001-00)", required: true },
    { key: "Marca", label: "Marca / Bandeira", desc: "Bandeira/Marca de operação (ex: Nissan, Renault)", required: true },
    { key: "Empresa", label: "Razão Social", desc: "Nome empresarial (ex: Alpha Sul Veículos)", required: true },
    { key: "Mês", label: "Mês de Lançamento", desc: "Data ou descrição mensal (ex: 2026-06)", required: true },
    { key: "Razão", label: "Conta Contábil / Razão", desc: "Conta de destino (ex: Vendas de Veículos)", required: true },
    { key: "Receita", label: "Volume de Receitas", desc: "Valores positivos de entrada faturamento", required: true },
    { key: "Custo", label: "Valores de Custo", desc: "Valores de custo (COGS) positivos", required: true },
    { key: "Despesa", label: "Valores de Despesas", desc: "Valores operacionais gerais positivos", required: true }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black uppercase text-slate-705 dark:text-slate-350">Passo 3: Mapeador de Colunas e Validador Estrutural</h2>
          <p className="text-xs text-slate-400 mt-1">Sincronize as colunas de sua planilha aos campos canônicos do Sauron OS.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveStep("abas")}
            className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-250 text-slate-700 rounded-lg"
          >
            Voltar
          </button>
          <button
            onClick={() => setActiveStep("ativacao")}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 text-white ${
              isMappingValid ? "bg-blue-600 hover:bg-blue-750" : "bg-slate-400 cursor-not-allowed"
            }`}
            disabled={!isMappingValid}
          >
            Revisar e Ativar Fonte <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mapeamento de Colunas ({activeTemplateName})</span>
            <button
              onClick={() => setIsCustomizingMappings(!isCustomizingMappings)}
              className="text-[10px] font-extrabold uppercase text-blue-500 hover:underline"
            >
              {isCustomizingMappings ? "Usar Mapeamento Automático" : "Personalizar Mapeador"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    {f.label}
                    {f.required && <span className="text-red-500 font-black">*</span>}
                  </label>
                  <span className="text-[8.5px] font-mono text-slate-400">{f.key}</span>
                </div>
                <p className="text-[10.5px] text-slate-450">{f.desc}</p>
                <select
                  value={columnMappings[f.key] || ""}
                  onChange={(e) => handleMappingChange(f.key, e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-750 rounded px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="">-- Ignorar ou Não Encontrada --</option>
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">Perfil de Importação do Cliente</span>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 block uppercase text-[10px]">Nome do Perfil Técnico</label>
                <input 
                  type="text" 
                  value={importProfileName} 
                  onChange={(e) => setImportProfileName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-850 dark:text-slate-200 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 block uppercase text-[10px]">Segmento de Negócio</label>
                <select 
                  value={activeSegment} 
                  onChange={(e) => setActiveSegment(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-850 dark:text-slate-200 font-bold"
                >
                  <option value="automotivo">Concessionárias (Automotivo)</option>
                  <option value="agro">Agronegócio (Agro)</option>
                  <option value="servicos">Serviços B2B</option>
                  <option value="industria">Indústria Geral</option>
                  <option value="geral">Geral (Holding Comercial)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- 4. SPREADSHEET DIAGNOSTICS STEP ---
interface SpreadsheetDiagnosticsStepProps {
  rawRows: any[];
  columnMappings: Record<string, string>;
  onShowNextStep: () => void;
}

export const SpreadsheetDiagnosticsStep: React.FC<SpreadsheetDiagnosticsStepProps> = ({
  rawRows,
  columnMappings,
  onShowNextStep
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-black uppercase text-slate-705 dark:text-slate-350 flex items-center gap-1.5">
          <Sparkles className="text-yellow-500" size={16} />
          Diagnóstico de Integridade e Saneamento de Dados
        </h3>
        <p className="text-xs text-slate-400 mt-1">O motor do Sauron OS analisou a planilha e identificou anomalias contábeis.</p>
      </div>

      <SpreadsheetStructureDiagnostics
        rows={rawRows}
        columns={Object.keys(rawRows[0] || {}).filter(k => k !== "id" && !k.startsWith("__"))}
      />

      <div className="flex justify-end pt-2">
        <button
          onClick={onShowNextStep}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded-lg text-xs font-bold cursor-pointer"
        >
          Avançar para Homologação
        </button>
      </div>
    </div>
  );
};


// --- 5. SPREADSHEET ACTIVATION STEP ---
interface SpreadsheetActivationStepProps {
  customFilters: any[];
  setCustomFilters: React.Dispatch<React.SetStateAction<any[]>>;
  calculatedFields: any[];
  setCalculatedFields: React.Dispatch<React.SetStateAction<any[]>>;
  isSavingConfig: boolean;
  handleFinalizarEAtivar: () => void;
  rawRows: any[];
  columnMappings: Record<string, string>;
  setActiveStep: (val: "upload" | "abas" | "mapeamento" | "ativacao") => void;
}

export const SpreadsheetActivationStep: React.FC<SpreadsheetActivationStepProps> = ({
  customFilters,
  setCustomFilters,
  calculatedFields,
  setCalculatedFields,
  isSavingConfig,
  handleFinalizarEAtivar,
  rawRows,
  columnMappings,
  setActiveStep
}) => {
  const [newFilterCol, setNewFilterCol] = React.useState("");
  const [newFilterLabel, setNewFilterLabel] = React.useState("");
  const [newFilterType, setNewFilterType] = React.useState<"text" | "list" | "number">("list");

  const [newCalcName, setNewCalcName] = React.useState("");
  const [newCalcFormula, setNewCalcFormula] = React.useState("");

  const handleAddFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilterCol) return;
    const item: any = {
      id: `f_${Date.now()}`,
      columnName: newFilterCol,
      label: newFilterLabel || newFilterCol,
      type: newFilterType,
      appearDashboard: true,
      appearReports: true,
      appearSlides: true
    };
    setCustomFilters([...customFilters, item]);
    setNewFilterCol("");
    setNewFilterLabel("");
  };

  const handleAddCalcField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalcName || !newCalcFormula) return;
    const item: any = {
      id: `c_${Date.now()}`,
      name: newCalcName,
      formula: newCalcFormula,
      valid: true
    };
    setCalculatedFields([...calculatedFields, item]);
    setNewCalcName("");
    setNewCalcFormula("");
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black uppercase text-slate-705 dark:text-slate-350">Passo 4: Finalização e Ativação do Backbone</h2>
          <p className="text-xs text-slate-400 mt-1">Homologue a estrutura importada para propagar os dados nos módulos de consultoria.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveStep("mapeamento")}
            className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-250 text-slate-700 rounded-lg cursor-pointer"
          >
            Voltar
          </button>
          <button
            onClick={handleFinalizarEAtivar}
            className="px-5 py-2 text-xs font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
            disabled={isSavingConfig}
          >
            {isSavingConfig ? "Ativando..." : "Finalizar e Ativar Fonte"} <Check size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parametrization of extra filters */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
          <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1">
            <Info size={12} className="text-blue-500" /> Mapeamento de Filtros Adicionais
          </span>
          <p className="text-[11px] text-slate-450 leading-relaxed">
            Selecione colunas adicionais para gerarem caixas de filtros dinâmicos no Dashboard Executivo.
          </p>

          <form onSubmit={handleAddFilter} className="grid grid-cols-3 gap-2 text-xs">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 block uppercase">Coluna</label>
              <select
                value={newFilterCol}
                onChange={(e) => setNewFilterCol(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
              >
                <option value="">Selecione...</option>
                {Object.keys(rawRows[0] || {}).map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 block uppercase">Rótulo (Label)</label>
              <input
                type="text"
                value={newFilterLabel}
                onChange={(e) => setNewFilterLabel(e.target.value)}
                placeholder="Ex: Região"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-semibold"
              />
            </div>
            <div className="space-y-1 flex items-end">
              <button
                type="submit"
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs"
              >
                + Adicionar
              </button>
            </div>
          </form>

          {customFilters.length > 0 && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
              {customFilters.map(cf => (
                <div key={cf.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-semibold">
                  <span>{cf.label} <span className="text-[9px] text-slate-400">({cf.columnName})</span></span>
                  <button
                    onClick={() => setCustomFilters(prev => prev.filter(f => f.id !== cf.id))}
                    className="text-rose-500 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calculated Formulas */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
          <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1">
            <Info size={12} className="text-purple-500" /> Fórmulas Calculadas Dinâmicas
          </span>
          <p className="text-[11px] text-slate-450 leading-relaxed">
            Defina colunas extras virtuais criadas por meio de operações matemáticas simples entre colunas.
          </p>

          <form onSubmit={handleAddCalcField} className="grid grid-cols-3 gap-2 text-xs">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 block uppercase">Nova Coluna</label>
              <input
                type="text"
                value={newCalcName}
                onChange={(e) => setNewCalcName(e.target.value)}
                placeholder="Ex: EBITDA"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 block uppercase">Fórmula</label>
              <input
                type="text"
                value={newCalcFormula}
                onChange={(e) => setNewCalcFormula(e.target.value)}
                placeholder="Ex: [Receita] - [Custo]"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="space-y-1 flex items-end">
              <button
                type="submit"
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs"
              >
                + Adicionar
              </button>
            </div>
          </form>

          {calculatedFields.length > 0 && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
              {calculatedFields.map(calc => (
                <div key={calc.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-semibold">
                  <span>{calc.name} <span className="text-[9px] text-purple-500 font-mono">({calc.formula})</span></span>
                  <button
                    onClick={() => setCalculatedFields(prev => prev.filter(f => f.id !== calc.id))}
                    className="text-rose-500 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
