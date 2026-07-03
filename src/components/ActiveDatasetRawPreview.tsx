import React, { useState, useEffect } from 'react';
import { activeDatasetStore } from '../core/data/ActiveDatasetStore';
import { ActiveDataset } from '../types/dataSource';

export const ActiveDatasetRawPreview: React.FC = () => {
  const [dataset, setDataset] = useState<ActiveDataset | null>(activeDatasetStore.getActiveDataset());

  useEffect(() => {
    const unsub = activeDatasetStore.subscribe((event) => {
      if (['DATASET_ACTIVATED', 'DATASET_REHYDRATED', 'DATASET_REMOVED'].includes(event.type)) {
        setDataset(activeDatasetStore.getActiveDataset());
      }
    });
    return unsub;
  }, []);

  if (!dataset) {
    return (
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        Nenhuma planilha ativa. Importe uma planilha para visualizar os dados reais.
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border border-emerald-500 dark:border-emerald-700 rounded-lg shadow-sm mb-6">
      <h2 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2 uppercase tracking-wider">Dataset Ativo (Prova Real)</h2>
      <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400 mb-4">
        <p><strong className="text-slate-800 dark:text-slate-200">Nome:</strong> {dataset.sourceName}</p>
        <p><strong className="text-slate-800 dark:text-slate-200">ID:</strong> {dataset.datasetId}</p>
        <p><strong className="text-slate-800 dark:text-slate-200">Linhas:</strong> {dataset.rowCount}</p>
        <p><strong className="text-slate-800 dark:text-slate-200">Colunas:</strong> {dataset.columnCount}</p>
      </div>
      
      <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-700 pt-2">
        <table className="w-full text-[10px] text-left text-slate-600 dark:text-slate-400">
          <thead className="text-slate-500 uppercase">
            <tr>
              {dataset.previewRows.length > 0 && Object.keys(dataset.previewRows[0].raw).map(key => (
                <th key={key} className="px-2 py-1 font-bold">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataset.previewRows.slice(0, 20).map((row, idx) => (
              <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                {Object.values(row.raw).map((val, vIdx) => (
                  <td key={vIdx} className="px-2 py-1 truncate max-w-[100px]">{String(val)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
