import React, { useState, useEffect } from 'react';
import { activeDatasetStore } from '../core/data/ActiveDatasetStore';
import { getSheetRows } from '../core/data/businessViews';
import { ActiveDataset } from '../types/dataSource';

export const ActiveDatasetRawPreview: React.FC = () => {
  const [dataset, setDataset] = useState<ActiveDataset | null>(activeDatasetStore.getActiveDataset());
  const [selectedSheet, setSelectedSheet] = useState<string>(activeDatasetStore.getActiveDataset()?.activeSheet || "");
  const [sheetRows, setSheetRows] = useState<Record<string, any>[]>([]);

  useEffect(() => {
    const unsub = activeDatasetStore.subscribe((event) => {
      if (['DATASET_ACTIVATED', 'DATASET_REHYDRATED', 'DATASET_REMOVED'].includes(event.type)) {
        const nextDataset = activeDatasetStore.getActiveDataset();
        setDataset(nextDataset);
        setSelectedSheet(nextDataset?.activeSheet || "");
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!dataset) {
      setSheetRows([]);
      return;
    }

    const sheetName = selectedSheet || dataset.activeSheet;
    if (!sheetName) {
      setSheetRows((dataset.previewRows || []).slice(0, 20).map(row => row.raw));
      return;
    }

    getSheetRows(sheetName, 20)
      .then(rows => {
        if (rows.length > 0) {
          setSheetRows(rows);
          return;
        }

        setSheetRows(
          (dataset.previewRows || [])
            .filter(row => row.metadata.sheetName === sheetName)
            .slice(0, 20)
            .map(row => row.raw)
        );
      })
      .catch(() => {
        setSheetRows((dataset.previewRows || []).slice(0, 20).map(row => row.raw));
      });
  }, [dataset, selectedSheet]);

  const datasetSheets = dataset?.sheets || [];
  const sheets = datasetSheets.map(sheet => typeof sheet === "string" ? sheet : sheet.sheetName);
  const activeSheetName = selectedSheet || dataset?.activeSheet || "";
  const activeSheetMetadata = datasetSheets.find((sheet): sheet is Exclude<ActiveDataset["sheets"][number], string> =>
    typeof sheet !== "string" && sheet.sheetName === activeSheetName
  );
  const visibleRows = sheetRows.slice(0, 20);
  const headers = visibleRows.length > 0
    ? Object.keys(visibleRows[0]).filter(key => !key.startsWith("__"))
    : [];

  if (!dataset) {
    return (
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        Nenhuma fonte de dados ativa. Adicione uma planilha para visualizar as informações.
      </div>
    );
  }

  return (
    <div data-testid="active-dataset-raw-preview" className="p-4 bg-white dark:bg-slate-900 border border-emerald-500 dark:border-emerald-700 rounded-lg shadow-sm mb-6">
      <h2 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2 uppercase tracking-wider">Dados ativos</h2>
      <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400 mb-4">
        <p data-testid="active-dataset-source-name"><strong className="text-slate-800 dark:text-slate-200">Nome:</strong> {dataset.sourceName}</p>
        <p><strong className="text-slate-800 dark:text-slate-200">Linhas:</strong> {activeSheetMetadata?.rowCount ?? dataset.rowCount}</p>
        <p><strong className="text-slate-800 dark:text-slate-200">Colunas:</strong> {activeSheetMetadata?.columnCount ?? dataset.columnCount}</p>
        <p><strong className="text-slate-800 dark:text-slate-200">Aba:</strong> {activeSheetName}</p>
        {sheets.length > 1 && (
          <p><strong className="text-slate-800 dark:text-slate-200">Linhas totais:</strong> {dataset.rowCount}</p>
        )}
      </div>
      {sheets.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {sheets.map((sheetName, index) => (
            <button
              key={`${sheetName}-${index}`}
              onClick={() => setSelectedSheet(sheetName)}
              className={`px-2.5 py-1 rounded border text-[10px] font-bold transition-colors ${
                (selectedSheet || dataset.activeSheet) === sheetName
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {sheetName}
            </button>
          ))}
        </div>
      )}
      
      <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-700 pt-2">
        {headers.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">A planilha ativa não possui linhas de prévia para exibir.</p>
        ) : (
          <table className="w-full text-[10px] text-left text-slate-600 dark:text-slate-400">
            <thead className="text-slate-500 uppercase">
              <tr>
                {headers.map(key => (
                  <th key={key} className="px-2 py-1 font-bold whitespace-nowrap">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                  {headers.map((header) => (
                    <td key={header} className="px-2 py-1 truncate max-w-[160px]">{String(row[header] ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
