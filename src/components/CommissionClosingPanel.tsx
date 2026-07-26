import React from "react";
import { CheckSquare, FileText, Loader2, Printer, Square } from "lucide-react";
import { ActiveDataset } from "../types/dataSource";
import {
  calculateClosingTotals,
  calculateCommissionSellerTotals,
  CommissionBatchResult,
  CommissionClosingFilters,
  CommissionSeller,
  generateSellerStatementsBatch,
  getCommissionClosingFilterOptions,
  listCommissionSellers,
  validateCommissionMappings,
} from "../core/data/commissionClosing";
import { SellerStatement } from "../core/data/sellerStatement";
import { ReviewSourceAnalysisAction } from "./ReviewSourceAnalysisAction";

interface CommissionClosingPanelProps {
  activeDataset: ActiveDataset | null;
  formatCurrency: (value: number) => string;
  onMappingSaved?: () => void;
  onOpenSourceAnalysis?: () => void;
}

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-");
  if (!year || !month) return period;
  return `${month}/${year}`;
}

function PrintableSellerStatement({ statement, formatCurrency }: { statement: SellerStatement; formatCurrency: (value: number) => string }) {
  return (
    <section className="bg-white text-slate-900 border border-slate-300 rounded-xl p-6 mb-6" style={{ pageBreakAfter: "always" }}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resumo/Holerite do Vendedor</p>
          <h3 className="text-lg font-black uppercase text-slate-950 mt-1">{statement.sellerName}</h3>
          <p className="text-[11px] font-mono text-slate-500">Gerado em {new Date(statement.generatedAt).toLocaleDateString("pt-BR")}</p>
        </div>
        <div className="text-right text-[10px] font-mono text-slate-500">
          <p>{statement.source.fileName}</p>
          <p>{statement.source.commissionSheetName || "Aba não configurada"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 text-xs">
        <div className="space-y-1">
          <p><strong>CPF:</strong> {statement.cpf || "Não mapeado"}</p>
          <p><strong>Matrícula:</strong> {statement.registration || "Não mapeada"}</p>
          <p><strong>Setor:</strong> {statement.department || "Não mapeado"}</p>
          <p><strong>Loja:</strong> {statement.store || "Não mapeada"}</p>
          <p><strong>Período:</strong> {statement.period || "Não disponível"}</p>
        </div>
        <div className="space-y-1">
          <p><strong>Total vendido:</strong> {statement.totalSold !== null ? formatCurrency(statement.totalSold) : "Não configurado"}</p>
          <p><strong>Registros:</strong> {statement.recordCount.toLocaleString("pt-BR")}</p>
          <p><strong>Comissão:</strong> {statement.commission.configured && statement.commission.value !== null ? formatCurrency(statement.commission.value) : "Comissão não configurada"}</p>
          <p><strong>Gestor:</strong> {statement.managerName || "Não informado"}</p>
        </div>
      </div>

      <div className="text-[10px] font-mono text-slate-500 border border-slate-200 rounded-lg p-3">
        Origem: {statement.source.peopleSheetName || "Pessoas não configurado"} / {statement.source.commissionSheetName || "Comissão não configurada"}.
        Colunas: {statement.source.columnsUsed.join(", ") || "Nenhuma coluna mapeada"}.
      </div>

      <div className="grid grid-cols-2 gap-12 text-center text-[10px] pt-10">
        <div>
          <div className="border-b border-slate-400 mb-2" />
          <strong className="block uppercase font-mono">{statement.sellerName}</strong>
          <span className="text-slate-500">Assinatura do vendedor</span>
        </div>
        <div>
          <div className="border-b border-slate-400 mb-2" />
          <strong className="block uppercase font-mono">{statement.managerName || "Gestor responsável"}</strong>
          <span className="text-slate-500">Assinatura do gestor</span>
        </div>
      </div>
    </section>
  );
}

export const CommissionClosingPanel: React.FC<CommissionClosingPanelProps> = ({ activeDataset, formatCurrency, onMappingSaved, onOpenSourceAnalysis }) => {
  const [mappingRevision, setMappingRevision] = React.useState(0);
  const [loadingSellers, setLoadingSellers] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [sellers, setSellers] = React.useState<CommissionSeller[]>([]);
  const [selectedSellers, setSelectedSellers] = React.useState<string[]>([]);
  const [filters, setFilters] = React.useState<CommissionClosingFilters>({});
  const [managerName, setManagerName] = React.useState("");
  const [batch, setBatch] = React.useState<CommissionBatchResult | null>(null);
  const [printMode, setPrintMode] = React.useState<"individual" | "batch" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const validation = React.useMemo(() => validateCommissionMappings(), [activeDataset?.datasetId, activeDataset?.importedAt, mappingRevision]);

  React.useEffect(() => {
    let mounted = true;

    async function loadSellers() {
      if (!activeDataset || !validation.isReady) {
        setSellers([]);
        setSelectedSellers([]);
        return;
      }

      setLoadingSellers(true);
      setError(null);
      try {
        const rows = await listCommissionSellers({
          commissionSheetName: filters.commissionSheetName || validation.commissionMapping?.sheetName,
        });
        if (!mounted) return;
        setSellers(rows);
        setSelectedSellers(rows.map(seller => seller.name));
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Falha ao listar vendedores.");
      } finally {
        if (mounted) setLoadingSellers(false);
      }
    }

    loadSellers();
    return () => {
      mounted = false;
    };
  }, [activeDataset?.datasetId, activeDataset?.importedAt, mappingRevision, validation.isReady, validation.commissionMapping?.sheetName, filters.commissionSheetName]);

  const filterOptions = React.useMemo(() => getCommissionClosingFilterOptions(sellers), [sellers]);
  const visibleSellers = React.useMemo(() => sellers.filter(seller => {
    if (filters.period && seller.period !== filters.period) return false;
    if (filters.unit && seller.unit !== filters.unit) return false;
    return true;
  }), [sellers, filters.period, filters.unit]);
  const selectedVisibleSellers = React.useMemo(() => visibleSellers.filter(seller => selectedSellers.includes(seller.name)), [visibleSellers, selectedSellers]);
  const selectedTotals = React.useMemo(() => calculateCommissionSellerTotals(selectedVisibleSellers), [selectedVisibleSellers]);
  const previewTotals = React.useMemo(() => calculateClosingTotals(batch?.statements || []), [batch]);

  React.useEffect(() => {
    setSelectedSellers(current => {
      const visibleNames = visibleSellers.map(seller => seller.name);
      const stillVisible = current.filter(name => visibleNames.includes(name));
      return stillVisible.length > 0 ? stillVisible : visibleNames;
    });
  }, [visibleSellers.map(seller => seller.name).join("|")]);

  const handleMappingSaved = () => {
    setMappingRevision(revision => revision + 1);
    onMappingSaved?.();
  };

  const toggleSeller = (sellerName: string) => {
    setSelectedSellers(current => current.includes(sellerName)
      ? current.filter(name => name !== sellerName)
      : [...current, sellerName]
    );
  };

  const generateBatch = async (mode: "preview" | "individual" | "batch") => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateSellerStatementsBatch(selectedVisibleSellers.map(seller => seller.name), {
        ...filters,
        commissionSheetName: filters.commissionSheetName || validation.commissionMapping?.sheetName,
        managerName,
      });
      setBatch(result);
      setPrintMode(mode === "preview" ? null : mode);
    } catch (err) {
      setBatch(null);
      setPrintMode(null);
      setError(err instanceof Error ? err.message : "Falha ao gerar fechamento de comissões.");
    } finally {
      setGenerating(false);
    }
  };

  if (!activeDataset || !validation.isReady) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/20 p-4">
          <h3 className="text-xs font-black uppercase text-amber-800 dark:text-amber-300">Configuração pendente</h3>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{validation.message}</p>
        </div>
        <ReviewSourceAnalysisAction onOpen={onOpenSourceAnalysis} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">Fechamento de Comissões</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Gere resumos em lote usando apenas vendedores e colunas reais mapeadas.
            </p>
          </div>
          <ReviewSourceAnalysisAction onOpen={onOpenSourceAnalysis} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <label className="text-[10px] font-black uppercase text-slate-500">
            Aba de comissão
            <select
              value={filters.commissionSheetName || validation.commissionMapping?.sheetName || ""}
              onChange={(event) => {
                setBatch(null);
                setPrintMode(null);
                setFilters(current => ({ ...current, commissionSheetName: event.target.value, period: undefined, unit: undefined }));
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100"
            >
              {validation.availableCommissionSheets.length === 0 && validation.commissionMapping?.sheetName && (
                <option value={validation.commissionMapping.sheetName}>{validation.commissionMapping.sheetName}</option>
              )}
              {Array.from(new Set(validation.availableCommissionSheets)).map(sheet => (
                <option key={sheet} value={sheet}>{sheet}</option>
              ))}
            </select>
          </label>

          <label className="text-[10px] font-black uppercase text-slate-500">
            Período
            <select
              value={filters.period || ""}
              onChange={(event) => setFilters(current => ({ ...current, period: event.target.value || undefined }))}
              disabled={filterOptions.periods.length === 0}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 disabled:opacity-50"
            >
              <option value="">Todos</option>
              {filterOptions.periods.map(period => (
                <option key={period} value={period}>{formatPeriodLabel(period)}</option>
              ))}
            </select>
          </label>

          <label className="text-[10px] font-black uppercase text-slate-500">
            Unidade/Loja
            <select
              value={filters.unit || ""}
              onChange={(event) => setFilters(current => ({ ...current, unit: event.target.value || undefined }))}
              disabled={filterOptions.units.length === 0}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 disabled:opacity-50"
            >
              <option value="">Todas</option>
              {filterOptions.units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </label>

          <label className="text-[10px] font-black uppercase text-slate-500">
            Gestor
            <input
              value={managerName}
              onChange={(event) => setManagerName(event.target.value)}
              placeholder="Nome do gestor"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-4">
          {[
            ["Vendedores", selectedTotals.sellerCount.toLocaleString("pt-BR")],
            ["Total vendido", formatCurrency(selectedTotals.totalSold)],
            ["Comissão", formatCurrency(selectedTotals.totalCommission)],
            ["Vendedores sem regra", selectedTotals.sellersWithoutRule.toLocaleString("pt-BR")],
            ["Vendedores com dados incompletos", selectedTotals.sellersWithIncompleteData.toLocaleString("pt-BR")],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3">
              <span className="text-[10px] font-black uppercase text-slate-400">{label}</span>
              <p className="text-sm font-mono font-black text-slate-900 dark:text-white mt-1">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setSelectedSellers(visibleSellers.map(seller => seller.name))}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-black uppercase"
          >
            <CheckSquare size={14} />
            <span>Selecionar todos</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedSellers([])}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-black uppercase"
          >
            <Square size={14} />
            <span>Limpar seleção</span>
          </button>
          <button
            type="button"
            onClick={() => generateBatch("preview")}
            disabled={generating || selectedVisibleSellers.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-[11px] font-black uppercase disabled:opacity-50"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            <span>Gerar prévia</span>
          </button>
          <button
            type="button"
            onClick={() => generateBatch("individual")}
            disabled={generating || selectedVisibleSellers.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-[11px] font-black uppercase disabled:opacity-50"
          >
            <Printer size={14} />
            <span>Gerar PDFs individuais</span>
          </button>
          <button
            type="button"
            onClick={() => generateBatch("batch")}
            disabled={generating || selectedVisibleSellers.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-[11px] font-black uppercase disabled:opacity-50"
          >
            <Printer size={14} />
            <span>Gerar lote imprimível</span>
          </button>
        </div>

        {error && <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-3">{error}</p>}

        <div className="overflow-auto border border-slate-200 dark:border-slate-800 rounded-lg max-h-[420px]">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0">
              <tr>
                <th className="px-3 py-2">Sel.</th>
                <th className="px-3 py-2">Vendedor</th>
                <th className="px-3 py-2">Unidade</th>
                <th className="px-3 py-2 text-right">Registros</th>
                <th className="px-3 py-2 text-right">Total vendido</th>
                <th className="px-3 py-2 text-right">Comissão</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingSellers ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center font-semibold text-slate-500">Carregando vendedores reais...</td></tr>
              ) : visibleSellers.map(seller => (
                <tr key={seller.name} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selectedSellers.includes(seller.name)} onChange={() => toggleSeller(seller.name)} />
                  </td>
                  <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">{seller.name}</td>
                  <td className="px-3 py-2">{seller.unit || "N/A"}</td>
                  <td className="px-3 py-2 text-right font-mono">{seller.recordCount}</td>
                  <td className="px-3 py-2 text-right font-mono">{seller.totalSold !== null ? formatCurrency(seller.totalSold) : "Pendente"}</td>
                  <td className="px-3 py-2 text-right font-mono">{seller.commission !== null ? formatCurrency(seller.commission) : "Comissão não configurada"}</td>
                  <td className="px-3 py-2">{seller.incomplete ? "Dados incompletos" : "Pronto"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {batch && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">Prévia do fechamento gerado</h4>
              <p className="text-[11px] font-semibold text-slate-500">
                {previewTotals.sellerCount} vendedor(es), {formatCurrency(previewTotals.totalSold)} vendidos, {formatCurrency(previewTotals.totalCommission)} em comissão.
              </p>
            </div>
            {printMode && (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-[11px] font-black uppercase"
              >
                <Printer size={14} />
                <span>Imprimir / Salvar PDF</span>
              </button>
            )}
          </div>

          <div className="overflow-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <th className="px-3 py-2">Vendedor</th>
                  <th className="px-3 py-2 text-right">Total vendido</th>
                  <th className="px-3 py-2 text-right">Comissão</th>
                  <th className="px-3 py-2 text-right">Registros</th>
                  <th className="px-3 py-2">Origem</th>
                </tr>
              </thead>
              <tbody>
                {batch.statements.map(statement => (
                  <tr key={statement.sellerName} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2 font-bold">{statement.sellerName}</td>
                    <td className="px-3 py-2 text-right font-mono">{statement.totalSold !== null ? formatCurrency(statement.totalSold) : "Pendente"}</td>
                    <td className="px-3 py-2 text-right font-mono">{statement.commission.configured && statement.commission.value !== null ? formatCurrency(statement.commission.value) : "Comissão não configurada"}</td>
                    <td className="px-3 py-2 text-right font-mono">{statement.recordCount}</td>
                    <td className="px-3 py-2 font-mono text-[10px]">{statement.source.commissionSheetName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {printMode && (
            <div id="commission-closing-print-batch" className="mt-6 bg-white text-slate-900 p-4 rounded-xl border border-slate-200">
              <div className="mb-4 border-b border-slate-200 pb-3">
                <h3 className="text-lg font-black uppercase">Fechamento de Comissões</h3>
                <p className="text-xs text-slate-600">Modo: {printMode === "individual" ? "PDFs individuais" : "Pacote/lote imprimível"}</p>
              </div>
              {batch.statements.map(statement => (
                <PrintableSellerStatement key={statement.sellerName} statement={statement} formatCurrency={formatCurrency} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
