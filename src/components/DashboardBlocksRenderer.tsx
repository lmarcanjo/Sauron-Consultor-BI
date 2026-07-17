import React from "react";
import { AlertTriangle, BarChart3, Database, Lightbulb, TrendingUp } from "lucide-react";
import { DashboardBlock, DashboardMetricCardData, DashboardPendingConfigData, DashboardRankingItem, DashboardTableData } from "../core/dashboard-engine";

interface DashboardBlocksRendererProps {
  blocks: DashboardBlock[];
}

function statusLabel(status: DashboardBlock["status"]): string {
  if (status === "ready") return "Pronto";
  if (status === "pending") return "Configuração pendente";
  if (status === "insufficient_data") return "Dados insuficientes";
  if (status === "empty") return "Sem linhas";
  return "Revisar";
}

function metricBlocks(blocks: DashboardBlock[]): DashboardBlock<DashboardMetricCardData>[] {
  return blocks.filter((block): block is DashboardBlock<DashboardMetricCardData> => block.type === "MetricCard");
}

function pendingBlocks(blocks: DashboardBlock[]): DashboardBlock<DashboardPendingConfigData>[] {
  return blocks.filter((block): block is DashboardBlock<DashboardPendingConfigData> => block.type === "PendingConfigBlock");
}

function rankingBlocks(blocks: DashboardBlock[]): DashboardBlock<{ items: DashboardRankingItem[] }>[] {
  return blocks.filter((block): block is DashboardBlock<{ items: DashboardRankingItem[] }> => block.type === "RankingBlock");
}

function tableBlocks(blocks: DashboardBlock[]): DashboardBlock<DashboardTableData>[] {
  return blocks.filter((block): block is DashboardBlock<DashboardTableData> => block.type === "TableBlock");
}

function insightBlocks(blocks: DashboardBlock[]) {
  return blocks.filter(block => block.type === "InsightBlock");
}

export const DashboardBlocksRenderer: React.FC<DashboardBlocksRendererProps> = ({ blocks }) => {
  const metricCardBlocks = metricBlocks(blocks);
  const pendings = pendingBlocks(blocks);
  const rankings = rankingBlocks(blocks);
  const tables = tableBlocks(blocks);
  const insights = insightBlocks(blocks);

  return (
    <div className="space-y-4">
      {metricCardBlocks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {metricCardBlocks.map(block => (
            <div key={block.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{block.title}</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{block.data.formattedValue}</p>
                </div>
                <span className="p-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300 rounded-lg">
                  <TrendingUp size={15} />
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-bold">
                <span className="text-slate-500 truncate">{block.data.sheetName || "Aba não configurada"}</span>
                <span className={block.status === "ready" ? "text-emerald-600" : "text-amber-600"}>{statusLabel(block.status)}</span>
              </div>
              {block.data.columnsUsed.length > 0 && (
                <p className="text-[10px] text-slate-400 mt-1 truncate">Campos usados: {block.data.columnsUsed.join(", ")}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {pendings.map(block => (
        <div key={block.id} className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/80 dark:bg-amber-950/20 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-xs font-black uppercase text-amber-800 dark:text-amber-300">{block.title}</h4>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{block.data.message}</p>
              {block.data.availableSheets.length > 0 && (
                <p className="text-[11px] text-slate-500 mt-2">Abas disponíveis: {block.data.availableSheets.slice(0, 8).join(", ")}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {rankings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {rankings.map(block => (
            <div key={block.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2 mb-3">
                <BarChart3 size={14} className="text-blue-500" />
                {block.title}
              </h3>
              {block.data.items.length > 0 ? (
                <div className="space-y-1.5">
                  {block.data.items.map(item => (
                    <div key={`${block.id}:${item.label}`} className="flex items-center justify-between gap-3 text-xs border-b border-slate-100 dark:border-slate-800 py-1.5 last:border-0">
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{item.label}</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                        {item.formattedValue || `${item.count.toLocaleString("pt-BR")} registros`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-500">Configuração pendente.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {tables.map(block => (
        <div key={block.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
              <Database size={14} className="text-blue-500" />
              {block.title}
            </h3>
            <span className="text-[10px] font-bold text-slate-400 truncate">{block.data.sheetName || "Aba não configurada"}</span>
          </div>
          {block.data.rows.length > 0 && block.data.columns.length > 0 ? (
            <div className="overflow-auto max-h-[360px]">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0">
                  <tr>
                    {block.data.columns.map(column => (
                      <th key={column} className="px-3 py-2 font-black text-slate-600 dark:text-slate-300 whitespace-nowrap border-b border-slate-200 dark:border-slate-800">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.data.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-slate-100 dark:border-slate-800">
                      {block.data.columns.map(column => (
                        <td key={column} className="px-3 py-2 max-w-[180px] truncate text-slate-700 dark:text-slate-300">{String(row[column] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-4 text-xs font-semibold text-slate-500">Há uma fonte de dados ativa. Confirme os campos deste módulo para gerar análises.</p>
          )}
        </div>
      ))}

      {insights.map(block => (
        <div key={block.id} className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Lightbulb size={16} className="text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-xs font-black uppercase text-blue-700 dark:text-blue-300">{block.title}</h4>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{String((block.data as any).message || "")}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
