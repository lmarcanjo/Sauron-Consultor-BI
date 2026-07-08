/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  FileSpreadsheet,
  UploadCloud,
  Check,
  Trash2,
  Settings2,
  Table,
  Filter,
  BarChart,
  AlertCircle
} from "lucide-react";
import { ActiveDataset, ColumnProfile } from "../../types/dataSource";
import { activeDatasetStore } from "../../core/data/ActiveDatasetStore";
import { createImportService, resolveImportMode, ImportService } from "../../core/import/ImportService";
import { ImportJob, ImportJobProgress, UploadedSheetMetadata } from "../../core/import/ImportJobTypes";

interface SimpleSpreadsheetImporterProps {
  onImported: (dataset: ActiveDataset) => void;
  onCancel: () => void;
}

export const SimpleSpreadsheetImporter: React.FC<SimpleSpreadsheetImporterProps> = ({
  onImported,
  onCancel
}) => {
  const importServiceRef = useRef<ImportService>(createImportService());
  const importMode = resolveImportMode();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "columns">("preview");
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const [importProgress, setImportProgress] = useState<ImportJobProgress | null>(null);
  const [importError, setImportError] = useState<string>("");
  
  // Parsed workbook structures
  const [sheetMetadata, setSheetMetadata] = useState<UploadedSheetMetadata[]>([]);
  const [activeSheetName, setActiveSheetName] = useState<string>("");
  const [activeSheetPreviewRows, setActiveSheetPreviewRows] = useState<any[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());

  // Column configuration state
  const [columnProfiles, setColumnProfiles] = useState<ColumnProfile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active sheet computed values
  const activeSheetMeta = sheetMetadata.find(s => s.sheetName === activeSheetName) || sheetMetadata[0];
  const isLargeLocalFile = !!file && importMode === "local" && file.size >= 10 * 1024 * 1024;

  useEffect(() => {
    if (activeSheetMeta && importJob) {
      importServiceRef.current
        .getImportPreview(importJob.jobId, activeSheetMeta.sheetName, 1, 100)
        .then(page => setActiveSheetPreviewRows(page.rows))
        .catch(error => {
          console.error(error);
          setActiveSheetPreviewRows([]);
        });
    }
  }, [activeSheetName, importJob, activeSheetMeta]);

  const handleFileSelect = async (selectedFile: File) => {
    console.log("[Sauron Instrumentation] IMPORT_START - Iniciando o parse do arquivo bruto (metadata): " + selectedFile.name);
    setFile(selectedFile);
    setIsLoading(true);
    setImportJob(null);
    setImportError("");
    setImportProgress({
      status: "UPLOADING",
      step: "Enviando arquivo",
      message: importMode === "api" ? "Enviando arquivo para processamento em segundo plano." : "Preparando leitura local da planilha.",
      percent: 10,
    });
    try {
      const job = await importServiceRef.current.startSpreadsheetImport(selectedFile);
      setImportJob(job);
      setImportProgress(job.progress);
      setSheetMetadata(job.metadata?.sheets || []);
      setActiveSheetName(job.metadata?.activeSheet || job.metadata?.sheets[0]?.sheetName || "");
    } catch (err: any) {
      console.error(err);
      const message = "Falha ao ler o arquivo de planilha: " + (err.message || "erro desconhecido");
      setImportError(message);
      setImportProgress({
        status: "FAILED",
        step: "Erro",
        message,
        percent: 100,
      });
      alert(message);
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync column profiles if active sheet changes
  useEffect(() => {
    if (activeSheetMeta) {
      // For metadata-only mode, we can't get columns easily without parsing the sheet rows, 
      // which we are trying to avoid.
      // We will need to re-parse just this sheet when it's selected.
      // For now, let's keep column profiles simple or load them on demand.
      setColumnProfiles([]);
    }
  }, [activeSheetName]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setImportJob(null);
    setImportProgress(null);
    setImportError("");
    setSheetMetadata([]);
    setActiveSheetName("");
    setColumnProfiles([]);
  };

  const handleColumnProfileChange = (colName: string, field: keyof ColumnProfile, value: any) => {
    setColumnProfiles(prev =>
      prev.map(p => (p.originalName === colName ? { ...p, [field]: value } : p))
    );
  };

  // Activates the spreadsheet, registers the active dataset and files
  const handleActivateDataset = async () => {
    if (!file || !importJob || selectedSheets.size === 0) {
      alert("Selecione ao menos uma aba.");
      return;
    }

    setIsSaving(true);
    setImportProgress({
      status: "SAVING_ROWS",
      step: "Salvando dados",
      message: importMode === "api" ? "Solicitando ativação do dataset processado no backend." : "Gravando abas selecionadas no IndexedDB.",
      percent: 70,
    });
    try {
      const activeWorkbook = await importServiceRef.current.activateImport(importJob.jobId, Array.from(selectedSheets));
      activeDatasetStore.setActiveDataset(activeWorkbook);

      const latestJob = await importServiceRef.current.getImportJob(importJob.jobId).catch(() => null);
      setImportProgress(latestJob?.progress || {
        status: "READY",
        step: "Pronto",
        message: "Planilha ativada no projeto.",
        percent: 100,
      });
      alert("Workbook ativado com sucesso.");
      onImported(activeWorkbook);
    } catch (err: any) {
      console.error(err);
      const message = "Erro ao salvar workbook: " + (err.message || "erro desconhecido");
      setImportError(message);
      setImportProgress({
        status: "FAILED",
        step: "Erro",
        message,
        percent: 100,
      });
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = file !== null && importJob !== null && sheetMetadata.length > 0 && activeSheetMeta !== undefined;

  return (
    <div id="simple-spreadsheet-importer" className="w-full bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
      {/* Importer Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 dark:border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <FileSpreadsheet className="text-emerald-500" size={24} />
            Carga e Importação Direta de Planilhas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Selecione uma planilha de faturamento real (Excel ou CSV) para visualizar os dados e integrá-la instantaneamente.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          {file && (
            <button
              id="btn-finalize-active-spreadsheet-step"
              onClick={handleActivateDataset}
              disabled={!isFormValid || isSaving}
              className={`px-5 py-2 text-xs font-black uppercase text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md transition-colors ${
                !isFormValid || isSaving
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isSaving ? "Ativando..." : "Usar esta planilha no projeto"}
              <Check size={14} />
            </button>
          )}
        </div>
      </div>

      {(importProgress || importError || isLargeLocalFile) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          {importProgress && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    {importProgress.step}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    {importProgress.message}
                  </p>
                </div>
                <span className="text-[10px] font-black font-mono text-slate-500">
                  {importProgress.percent}%
                </span>
              </div>
              <div className="mt-3 h-2 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.max(0, Math.min(importProgress.percent, 100))}%` }}
                />
              </div>
            </div>
          )}

          {isLargeLocalFile && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/20 p-3">
              <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Arquivo grande detectado. Em produção, o processamento será feito em segundo plano.
              </p>
            </div>
          )}

          {importError && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/20 p-3">
              <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                {importError}
              </p>
            </div>
          )}
        </div>
      )}

      {/* State 1: Choose File */}
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
            dragOver
              ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/10"
              : "border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-full text-emerald-500 dark:text-emerald-400 mb-4 shadow-sm">
            <UploadCloud size={32} />
          </div>
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
            Arraste seu arquivo de planilha ou clique para selecionar
          </h3>
          <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
            Suporta formatos **CSV** e **Excel (.xlsx, .xls)**. Não há limite de tamanho artificial; seus dados são salvos com segurança no navegador via IndexedDB.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              Preserva todas as linhas e colunas
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              Não exige nenhum mapeamento obrigatório
            </span>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-4 animate-pulse">
            {importProgress?.message || "Carregando e processando planilha..."}
          </p>
        </div>
      ) : (
        /* State 2: Preview & Configuration */
        <div className="space-y-6">
          {/* File Metadata Overview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 dark:text-emerald-400 rounded-lg">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Planilha Carregada
                </h4>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {file.name}
                </p>
                <div className="flex items-center gap-2.5 text-[10px] font-semibold text-slate-400 mt-1">
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span>{activeSheetMeta ? activeSheetMeta.rowCount : 0} linhas de dados</span>
                  <span>•</span>
                  <span>{activeSheetMeta ? activeSheetMeta.columnCount : 0} colunas</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRemoveFile}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                Remover Arquivo
              </button>
            </div>
          </div>

          {/* Sheets Selector Table */}
          {sheetMetadata.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">
                  Abas encontradas
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSheets(new Set(sheetMetadata.map(sh => sh.sheetName)))}
                    className="px-2.5 py-1 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    Selecionar todas
                  </button>
                  <button
                    onClick={() => setSelectedSheets(new Set())}
                    className="px-2.5 py-1 text-[10px] font-bold rounded bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors"
                  >
                    Limpar seleção
                  </button>
                </div>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="p-2">Aba</th>
                      <th className="p-2">Dimensões</th>
                      <th className="p-2">Fórmulas</th>
                      <th className="p-2">Classificação</th>
                      <th className="p-2">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheetMetadata.map(sh => (
                      <tr key={sh.sheetName} className="border-b last:border-0 border-slate-100 dark:border-slate-800">
                        <td className="p-2 font-bold">{sh.sheetName}</td>
                        <td className="p-2">{sh.rowCount} lin x {sh.columnCount} col</td>
                        <td className="p-2">{sh.formulaCount > 0 ? "Sim" : "Não"}</td>
                        <td className="p-2">{sh.classification}</td>
                        <td className="p-2">
                          <button
                            onClick={() => {
                              const newSelected = new Set(selectedSheets);
                              if (newSelected.has(sh.sheetName)) newSelected.delete(sh.sheetName);
                              else newSelected.add(sh.sheetName);
                              setSelectedSheets(newSelected);
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-bold ${
                              selectedSheets.has(sh.sheetName) 
                              ? "bg-emerald-100 text-emerald-800" 
                              : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {selectedSheets.has(sh.sheetName) ? "Selecionada" : "Selecionar"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Feature View Switcher */}
          <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4">
            <button
              onClick={() => setActiveTab("preview")}
              className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all relative ${
                activeTab === "preview"
                  ? "text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <Table size={14} />
              Visualização Prévia (Primeiras 100 linhas)
            </button>
            <button
              onClick={() => setActiveTab("columns")}
              className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all relative ${
                activeTab === "columns"
                  ? "text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <Settings2 size={14} />
              Configurar Colunas (Opcional)
            </button>
          </div>

          {/* TAB CONTENT: Preview */}
          {activeTab === "preview" && activeSheetMeta && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="max-h-[350px] overflow-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/40 sticky top-0 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3 font-extrabold text-slate-400 text-center w-12 border-r border-slate-200 dark:border-slate-800">
                        #
                      </th>
                      {activeSheetPreviewRows.length > 0 && Object.keys(activeSheetPreviewRows[0]).map((col, idx) => (
                        <th key={idx} className="p-3 font-extrabold text-slate-800 dark:text-slate-200 min-w-[120px]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeSheetPreviewRows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                      >
                        <td className="p-3 text-center text-slate-400 font-mono font-bold bg-slate-50/30 dark:bg-slate-950/10 border-r border-slate-200 dark:border-slate-800">
                          {rIdx + 1}
                        </td>
                        {Object.values(row).map((val: any, cIdx) => (
                          <td key={cIdx} className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                            {val !== undefined && val !== null ? String(val) : (
                              <span className="text-slate-350 dark:text-slate-600 italic">vazio</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                <span>Total de linhas mostradas: {activeSheetPreviewRows.length} de {activeSheetMeta.rowCount}</span>
                <span>Dados brutos originais do faturamento</span>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Columns optional configurations */}
          {activeTab === "columns" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-blue-50/30 dark:bg-blue-950/10 border-b border-slate-100 dark:border-slate-800 text-xs text-blue-750 dark:text-blue-400 flex items-start gap-2">
                <Settings2 size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px]">Configurações Opcionais</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Você pode personalizar livremente os apelidos das colunas e habilitar flags para módulos específicos de consultoria. **Tudo é opcional**. Se não alterar nada, a planilha será importada integralmente com seus cabeçalhos originais.
                  </p>
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-auto">
                {columnProfiles.map((p, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Header name & original */}
                    <div className="md:col-span-4">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200">{p.originalName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Nome original na planilha</p>
                    </div>

                    {/* Alias Custom naming */}
                    <div className="md:col-span-4">
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Apelido (Alias)</label>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => handleColumnProfileChange(p.originalName, "name", e.target.value)}
                        placeholder={p.originalName}
                        className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                      />
                    </div>

                    {/* Column Type Select */}
                    <div className="md:col-span-4">
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Tipo de Dado</label>
                      <select
                        value={p.type}
                        onChange={(e) => handleColumnProfileChange(p.originalName, "type", e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                      >
                        <option value="string">Texto / ID</option>
                        <option value="number">Valor Numérico / Monetário</option>
                        <option value="date">Data / Mês</option>
                      </select>
                    </div>

                    {/* Option toggles */}
                    <div className="md:col-span-12 grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-50 dark:border-slate-850">
                      <button
                        onClick={() => handleColumnProfileChange(p.originalName, "isFilter", !p.isFilter)}
                        className={`px-2 py-1 text-[9px] font-bold rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                          p.isFilter
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900"
                            : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <Filter size={10} />
                        Filtro {p.isFilter && "✓"}
                      </button>
                      <button
                        onClick={() => handleColumnProfileChange(p.originalName, "isKPI", !p.isKPI)}
                        className={`px-2 py-1 text-[9px] font-bold rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                          p.isKPI
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900"
                            : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <BarChart size={10} />
                        KPI {p.isKPI && "✓"}
                      </button>
                      <button
                        onClick={() => handleColumnProfileChange(p.originalName, "isDRE", !p.isDRE)}
                        className={`px-2 py-1 text-[9px] font-bold rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                          p.isDRE
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"
                            : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        DRE {p.isDRE && "✓"}
                      </button>
                      <button
                        onClick={() => handleColumnProfileChange(p.originalName, "isPessoas", !p.isPessoas)}
                        className={`px-2 py-1 text-[9px] font-bold rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                          p.isPessoas
                            ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900"
                            : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Pessoas {p.isPessoas && "✓"}
                      </button>
                      <button
                        onClick={() => handleColumnProfileChange(p.originalName, "isComissao", !p.isComissao)}
                        className={`px-2 py-1 text-[9px] font-bold rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                          p.isComissao
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900"
                            : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Comissão {p.isComissao && "✓"}
                      </button>
                      <button
                        onClick={() => handleColumnProfileChange(p.originalName, "isApresentacao", !p.isApresentacao)}
                        className={`px-2 py-1 text-[9px] font-bold rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                          p.isApresentacao
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900"
                            : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Apresentação {p.isApresentacao && "✓"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
