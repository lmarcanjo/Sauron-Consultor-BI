import React, { useState } from "react";
import { 
  AlertTriangle, CheckCircle, Info, ShieldAlert, FileText, Download, 
  ArrowRight, Database, AlertCircle, Sparkles, Printer, FileDown
} from "lucide-react";
import { LancamentoFinanceiro } from "../../types";

export interface DiagnosticAlert {
  id: string;
  type: string;
  severity: "Informativo" | "Atenção" | "Revisar";
  column: string;
  affectedRows: string;
  example: string;
  possibleCause: string;
  recommendation: string;
}

interface SpreadsheetStructureDiagnosticsProps {
  rows: any[];
  columns: string[];
  dbActiveRecords?: LancamentoFinanceiro[];
  onBackToMapeamento?: () => void;
  onActivateSource?: () => void;
}

// Diagnostic Engine Function
export function runDiagnostics(rows: any[], columns: string[]): DiagnosticAlert[] {
  const alerts: DiagnosticAlert[] = [];
  if (!rows || rows.length === 0) return alerts;

  // 1. Column without name
  columns.forEach((col, idx) => {
    if (!col || col.startsWith("__EMPTY") || col.trim() === "") {
      alerts.push({
        id: `col_no_name_${idx}`,
        type: "colunas_sem_nome",
        severity: "Revisar",
        column: col || `Coluna Sem Nome #${idx + 1}`,
        affectedRows: "Todas",
        example: col || `__EMPTY_${idx}`,
        possibleCause: "Exportação corrompida ou coluna extra sem cabeçalho no arquivo de origem.",
        recommendation: "Renomeie a coluna na grade de edição acima para atribuir um alias representativo antes de finalizar."
      });
    }
  });

  // Check each column's data values
  columns.forEach((col) => {
    if (!col || col.startsWith("__EMPTY")) return;

    let emptyCount = 0;
    const emptyRowNums: number[] = [];
    const typeCount: Record<string, number> = { number: 0, string: 0, boolean: 0 };
    const valuesList: any[] = [];
    
    // For pattern break detection (Consecutive empty check)
    let maxConsecutiveEmpty = 0;
    let currentConsecutiveEmpty = 0;
    let patternBreakStart = -1;
    let patternBreakEnd = -1;
    let hasDataBefore = false;
    let hasDataAfter = false;
    let consecutiveStartTemp = -1;

    rows.forEach((row, rowIdx) => {
      const val = row[col];
      const isEmpty = val === undefined || val === null || String(val).trim() === "" || String(val).trim() === "-";
      
      if (isEmpty) {
        emptyCount++;
        if (emptyRowNums.length < 5) {
          emptyRowNums.push(rowIdx + 2); // 2-indexed because of header row in excel
        }
        
        if (hasDataBefore) {
          if (currentConsecutiveEmpty === 0) {
            consecutiveStartTemp = rowIdx + 2;
          }
          currentConsecutiveEmpty++;
        }
      } else {
        hasDataBefore = true;
        valuesList.push(val);
        const t = typeof val;
        typeCount[t] = (typeCount[t] || 0) + 1;
        
        if (currentConsecutiveEmpty >= 3) {
          // Found consecutive empty block that has data after
          maxConsecutiveEmpty = currentConsecutiveEmpty;
          patternBreakStart = consecutiveStartTemp;
          patternBreakEnd = rowIdx + 1;
          hasDataAfter = true;
        }
        currentConsecutiveEmpty = 0;
      }
    });

    // 2. Empty cells check
    if (emptyCount > 0) {
      alerts.push({
        id: `empty_cells_${col}`,
        type: "celulas_vazias",
        severity: "Atenção",
        column: col,
        affectedRows: `Linhas ${emptyRowNums.join(", ")}${emptyCount > 5 ? "..." : ""} (Total: ${emptyCount} células)`,
        example: "-",
        possibleCause: "Campos opcionais não preenchidos no ERP ou falha pontual de preenchimento na origem.",
        recommendation: "Os dados foram totalmente preservados. Certifique-se de que a ausência de dados não afeta cálculos críticos de faturamento ou DRE."
      });
    }

    // 3. Pattern break (Consecutive empty in between data)
    if (patternBreakStart !== -1 && hasDataAfter) {
      alerts.push({
        id: `pattern_break_${col}`,
        type: "quebra_padrao",
        severity: "Revisar",
        column: col,
        affectedRows: `Linhas ${patternBreakStart} a ${patternBreakEnd}`,
        example: "Preenchido -> Vazio por várias linhas -> Preenchido novamente",
        possibleCause: "Falha de sincronização, filtro incorreto na exportação ou cadastro incompleto no sistema de origem.",
        recommendation: `Padrão interrompido na coluna ${col} entre as linhas ${patternBreakStart} e ${patternBreakEnd}. Os dados antes e depois desse intervalo possuem preenchimento. Pode indicar falha na exportação ou cadastro incompleto no sistema de origem.`
      });
    }

    // 4. Data type changes (Mixed types)
    const activeTypes = Object.keys(typeCount).filter(k => typeCount[k] > 0);
    if (activeTypes.length > 1) {
      const dominantType = activeTypes.reduce((a, b) => typeCount[a] > typeCount[b] ? a : b);
      const minorType = activeTypes.find(t => t !== dominantType);
      alerts.push({
        id: `mixed_type_${col}`,
        type: "tipo_dados_misto",
        severity: "Atenção",
        column: col,
        affectedRows: "Múltiplas linhas",
        example: `Dominante: ${dominantType} (${typeCount[dominantType]} células), Minoritário: ${minorType} (${typeCount[minorType || ""]} células)`,
        possibleCause: "Uso de caracteres de texto (ex: 'N/A', 'erro') em colunas numéricas ou formatação inconsistente na exportação.",
        recommendation: "Revise os campos com formatos diferentes para garantir consistência de cálculos e evitar quebras em filtros."
      });
    }

    // 5. Formulas check (Check if column appears calculated)
    const isFormulaColumn = col.toLowerCase().includes("lucro") || col.toLowerCase().includes("margem");
    if (isFormulaColumn) {
      alerts.push({
        id: `formula_detected_${col}`,
        type: "formulas_preservadas",
        severity: "Informativo",
        column: col,
        affectedRows: "Todas as linhas",
        example: col.toLowerCase().includes("margem") ? "[Lucro] / [Receita]" : "[Receita] - [Custo]",
        possibleCause: "Coluna calculada baseada em outras variáveis.",
        recommendation: `Esta coluna contém valores calculados de faturamento. O Sauron preservou os valores originais importados e sinalizou a estrutura para sua revisão consultiva.`
      });
    }
    
    // 6. Invalid dates
    const isDateColumn = col.toLowerCase().includes("data") || col.toLowerCase().includes("mês") || col.toLowerCase().includes("mes");
    if (isDateColumn) {
      const invalidDateRows: number[] = [];
      rows.forEach((row, idx) => {
        const val = row[col];
        if (val) {
          const strVal = String(val);
          // Check simple date formats like YYYY-MM or DD/MM/YYYY or similar
          const isValidDate = !isNaN(Date.parse(strVal)) || /^\d{4}-\d{2}$/.test(strVal) || /^\d{2}\/\d{2}\/\d{4}$/.test(strVal);
          if (!isValidDate) {
            invalidDateRows.push(idx + 2);
          }
        }
      });
      if (invalidDateRows.length > 0) {
        alerts.push({
          id: `invalid_date_${col}`,
          type: "data_invalida",
          severity: "Revisar",
          column: col,
          affectedRows: `Linhas ${invalidDateRows.slice(0, 5).join(", ")}${invalidDateRows.length > 5 ? "..." : ""}`,
          example: String(rows[invalidDateRows[0] - 2]?.[col] || ""),
          possibleCause: "Datas com padrão textual não reconhecido ou dias inválidos (ex: 30 de Fevereiro).",
          recommendation: "Verifique as linhas afetadas. Datas inconsistentes podem prejudicar agrupamentos mensais e análise histórica."
        });
      }
    }
  });

  // 7. Duplicate rows check
  const seenRows = new Map<string, number>();
  const duplicateRows: string[] = [];
  rows.forEach((row, idx) => {
    // Generate a unique key for the row omitting id/linha
    const key = Object.keys(row)
      .filter(k => k !== "id" && k !== "linha" && k !== "numero_linha" && k !== "c_id")
      .map(k => String(row[k]))
      .join("|");
    
    if (seenRows.has(key)) {
      duplicateRows.push(`Linha ${seenRows.get(key)} ↔ Linha ${idx + 2}`);
    } else {
      seenRows.set(key, idx + 2);
    }
  });

  if (duplicateRows.length > 0) {
    alerts.push({
      id: `duplicate_rows`,
      type: "linhas_duplicadas",
      severity: "Revisar",
      column: "Todas",
      affectedRows: `Detectadas ${duplicateRows.length} duplicidades de estrutura`,
      example: duplicateRows[0],
      possibleCause: "Exportação redundante do ERP ou duplicidade de linhas na planilha de origem.",
      recommendation: "O Sauron manteve as linhas para preservar a integridade estrita do arquivo original. Verifique se as linhas representam registros duplicados reais."
    });
  }

  return alerts;
}

export const SpreadsheetStructureDiagnostics: React.FC<SpreadsheetStructureDiagnosticsProps> = ({
  rows,
  columns,
  dbActiveRecords = [],
  onBackToMapeamento,
  onActivateSource,
}) => {
  const alerts = runDiagnostics(rows, columns);
  const [showReport, setShowReport] = useState(false);

  // Dynamic DB comparison (Requirement 8)
  const dbComparison = React.useMemo(() => {
    if (!dbActiveRecords || dbActiveRecords.length === 0) return null;

    const spreadsheetCount = rows.length;
    const dbCount = dbActiveRecords.length;
    const countDiff = spreadsheetCount - dbCount;

    // Compare aggregated Receita/Lucro if available
    const ssTotalReceita = rows.reduce((sum, r) => sum + (Number(r.Receita) || 0), 0);
    const dbTotalReceita = dbActiveRecords.reduce((sum, r) => sum + (Number(r.Receita) || 0), 0);
    
    const comparisons: string[] = [];
    let databaseDiscrepancy = false;

    // Check if there is consecutive pattern break in spreadsheet that exists in DB too
    let bothHaveEmptyFields = false;
    columns.forEach(col => {
      const hasSSEmpty = rows.some(r => r[col] === undefined || r[col] === null || r[col] === "");
      const dbColName = Object.keys(dbActiveRecords[0] || {}).find(k => k.toLowerCase() === col.toLowerCase());
      if (dbColName) {
        const hasDBEmpty = dbActiveRecords.some(r => (r as any)[dbColName] === undefined || (r as any)[dbColName] === null || (r as any)[dbColName] === "");
        if (hasSSEmpty && hasDBEmpty) {
          bothHaveEmptyFields = true;
          comparisons.push(
            `Possível divergência ou padrão de origem entre planilha e banco na coluna '${col}'. A planilha apresenta ausência de dados em alguns registros. O banco também possui registros vazios nesse campo, indicando provável origem no sistema de banco.`
          );
        } else if (hasSSEmpty && !hasDBEmpty) {
          databaseDiscrepancy = true;
          comparisons.push(
            `A planilha possui ausência de dados na coluna '${col}', mas o banco possui valores preenchidos. Pode indicar falha na exportação para planilha.`
          );
        }
      }
    });

    return {
      spreadsheetCount,
      dbCount,
      countDiff,
      ssTotalReceita,
      dbTotalReceita,
      bothHaveEmptyFields,
      databaseDiscrepancy,
      comparisons
    };
  }, [rows, dbActiveRecords, columns]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="SpreadsheetStructureDiagnostics">
      {/* Overview Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest block mb-1">Módulo de Integridade</span>
          <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
            <ShieldAlert size={20} className="text-yellow-500 animate-pulse" />
            Diagnóstico Estrutural de Planilha Real
          </h3>
          <p className="text-slate-400 text-xs mt-1 max-w-xl">
            Sinalizamos inconsistências e pontos de atenção para sua revisão profissional. <strong>Nenhum dado é deletado ou alterado automaticamente.</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onBackToMapeamento && (
            <button
              onClick={onBackToMapeamento}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
            >
              Revisar Mapeamento
            </button>
          )}
          <button
            onClick={() => setShowReport(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <FileText size={14} />
            Gerar Relatório de Atenção
          </button>
        </div>
      </div>

      {/* Alert Listings */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider">Pontos de Atenção Identificados ({alerts.length})</h4>
        
        {alerts.length === 0 ? (
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900 rounded-xl p-6 text-center">
            <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Planilha sem anomalias estruturais críticas!</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-1">Todos os registros estão consistentes e prontos para faturamento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {alerts.map((alert) => {
              const isCritical = alert.severity === "Revisar";
              const isWarning = alert.severity === "Atenção";
              return (
                <div 
                  key={alert.id} 
                  className={`border rounded-xl p-4.5 transition-all bg-white dark:bg-slate-900 shadow-3xs hover:shadow-2xs ${
                    isCritical 
                      ? "border-red-200 dark:border-red-950/60 border-l-4 border-l-red-500" 
                      : isWarning
                      ? "border-yellow-200 dark:border-yellow-950/60 border-l-4 border-l-yellow-500"
                      : "border-sky-200 dark:border-sky-950/60 border-l-4 border-l-sky-500"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      isCritical ? "bg-red-50 dark:bg-red-950/40 text-red-500" :
                      isWarning ? "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-500" :
                      "bg-sky-50 dark:bg-sky-950/40 text-sky-500"
                    }`}>
                      {isCritical ? <ShieldAlert size={16} /> : isWarning ? <AlertTriangle size={16} /> : <Info size={16} />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase">
                          Coluna: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs text-blue-600 dark:text-blue-400 font-mono font-bold">{alert.column}</code>
                        </span>
                        <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                          isCritical ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400" :
                          isWarning ? "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400" :
                          "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400"
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                        {alert.recommendation}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pt-2 text-[11px] border-t border-slate-100 dark:border-slate-800 mt-2 text-slate-500 dark:text-slate-400 font-medium">
                        <div>
                          <strong>Linhas Afetadas:</strong> {alert.affectedRows}
                        </div>
                        <div>
                          <strong>Exemplo:</strong> <code className="bg-slate-50 dark:bg-slate-850 px-1 py-0.5 rounded text-[10px] font-mono">{alert.example}</code>
                        </div>
                        <div className="sm:col-span-2">
                          <strong>Causa Provável:</strong> {alert.possibleCause}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison with Connected Database (Requirement 8) */}
      {dbComparison && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Database size={15} className="text-blue-500" />
            Análise Comparativa com Banco de Dados Ativo
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Registros na Planilha</span>
              <strong className="text-lg text-slate-800 dark:text-white font-black">{dbComparison.spreadsheetCount}</strong>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Registros no Banco</span>
              <strong className="text-lg text-slate-800 dark:text-white font-black">{dbComparison.dbCount}</strong>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Diferença Absoluta</span>
              <strong className={`text-lg font-black ${dbComparison.countDiff === 0 ? "text-emerald-500" : "text-amber-500"}`}>
                {dbComparison.countDiff > 0 ? `+${dbComparison.countDiff}` : dbComparison.countDiff}
              </strong>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-black text-slate-400 block">Verificações de Integridade Cruzada:</span>
            {dbComparison.comparisons.map((comp, idx) => (
              <div key={idx} className="flex gap-2 items-start bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-950 px-3.5 py-2.5 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed font-semibold">
                <AlertCircle size={14} className="shrink-0 text-amber-500 mt-0.5" />
                <span>{comp}</span>
              </div>
            ))}
            {dbComparison.comparisons.length === 0 && (
              <div className="flex gap-2 items-center bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950 px-3 py-2 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                <span>Nenhuma divergência estrutural detectada entre a planilha real e o banco conectado.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trigger Final Activation */}
      {onActivateSource && (
        <div className="flex justify-end pt-2">
          <button
            onClick={onActivateSource}
            id="btn-confirm-and-activate-source"
            className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow hover:shadow-lg transition-all cursor-pointer"
          >
            <CheckCircle size={14} /> Ativar Fonte de Dados no Workspace
          </button>
        </div>
      )}

      {/* Relatório de Atenção Modal (Requirement 9) */}
      {showReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-8 shadow-2xl relative space-y-6 animate-fade-in print:border-none print:shadow-none print:p-0">
            
            {/* Header print area */}
            <div className="flex items-start justify-between border-b border-slate-150 dark:border-slate-800 pb-4 print:border-b-2">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider">Sauron OPERATING PLATFORM</span>
                <h2 className="text-xl font-black text-slate-850 dark:text-white uppercase tracking-tight">Relatório de Atenção da Planilha</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  <span><strong>Data:</strong> {new Date().toLocaleDateString()}</span>
                  <span><strong>Importado por:</strong> Lennon Marcanjo</span>
                  <span><strong>Segmento:</strong> Consultoria Operacional</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowReport(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer print:hidden"
              >
                ✕
              </button>
            </div>

            {/* Print warnings / info */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-150 dark:border-amber-900 rounded-xl p-4 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed font-semibold">
              Este relatório apresenta um compilado técnico das divergências de preenchimento, formatação e estrutura identificadas na planilha carregada para o Sauron. Ele serve como documentação técnica para o setor de TI ou administração do sistema ERP de origem para orientar eventuais revisões de integridade.
            </div>

            {/* List alerts in PDF layout */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-black text-slate-400 block">Sinalizações Técnicas para Revisão:</span>
              <div className="border border-slate-150 dark:border-slate-850 rounded-xl divide-y divide-slate-150 dark:divide-slate-850 overflow-hidden text-xs">
                {alerts.map((al, idx) => (
                  <div key={idx} className="p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-extrabold text-slate-800 dark:text-white uppercase">
                        Coluna: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono font-bold text-blue-600 dark:text-blue-400">{al.column}</code>
                      </span>
                      <span className="text-[10px] font-black text-slate-500 uppercase">{al.severity}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                      {al.recommendation}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 pt-1 text-[11px] text-slate-400">
                      <span><strong>Faixa afetada:</strong> {al.affectedRows}</span>
                      <span><strong>Possível causa:</strong> {al.possibleCause}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Connected DB report block if applicable */}
            {dbComparison && (
              <div className="space-y-3 pt-3 border-t border-slate-150 dark:border-slate-800">
                <span className="text-[10px] uppercase font-black text-slate-400 block">Comparativo Cruzado de Sistema:</span>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                    <span>Métrica total faturada Planilha:</span>
                    <strong className="block text-sm font-bold text-slate-800 dark:text-white mt-1">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(dbComparison.ssTotalReceita)}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                    <span>Métrica total faturada Banco:</span>
                    <strong className="block text-sm font-bold text-slate-800 dark:text-white mt-1">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(dbComparison.dbTotalReceita)}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Actions panel */}
            <div className="flex justify-between items-center pt-5 border-t border-slate-150 dark:border-slate-800 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-lg text-xs font-bold cursor-pointer shadow transition-all"
              >
                <Printer size={14} /> Imprimir / Salvar PDF
              </button>
              <button
                type="button"
                onClick={() => setShowReport(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-all"
              >
                Fechar
              </button>
            </div>

            {/* Footer print note */}
            <div className="hidden print:block text-center text-[10px] text-slate-400 pt-6 border-t border-slate-200 mt-12">
              Sauron OS — Plataforma Corporativa de Consultoria. Todos os dados originais foram mantidos intactos e sem alterações automatizadas.
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
