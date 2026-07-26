import React, { useState, useEffect } from 'react';
import { activeDatasetStore } from '../core/data/ActiveDatasetStore';

export const DataFlowDebugPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [lastEvent, setLastEvent] = useState<string>('Nenhum evento registrado');
  const [subscribersCount, setSubscribersCount] = useState(activeDatasetStore.getSubscribersCount());
  const [tick, setTick] = useState(0);
  const [isQaMode, setIsQaMode] = useState(false);

  const activeDataset = activeDatasetStore.getActiveDataset();
  const activeSource = activeDataset?.sourceType || null;
  const records = activeDatasetStore.getActiveRows();
  const filters = (activeDataset?.columnProfiles || []).filter((profile: any) => profile.isFilter);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDev = process.env.NODE_ENV === "development";
      const hasQaParam = window.location.search.includes("qa=true");
      setIsQaMode(isDev || hasQaParam);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = activeDatasetStore.subscribe((event) => {
      setLastEvent(`${new Date().toLocaleTimeString('pt-BR')} - ${event.type}`);
      setSubscribersCount(activeDatasetStore.getSubscribersCount());
      setTick(t => t + 1);
    });
    return () => unsubscribe();
  }, []);

  if (!isQaMode) {
    return null;
  }

  if (!open) {
    return (
      <div 
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 bg-slate-900 text-slate-100 p-2 rounded shadow-lg cursor-pointer text-xs font-mono opacity-80 hover:opacity-100 z-50 border border-amber-500/30"
      >
        [QA] Active Dataset Debug
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 text-slate-100 p-4 rounded shadow-lg text-xs font-mono w-80 max-h-96 overflow-y-auto z-50 border border-amber-500/50">
      <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2">
        <h3 className="font-bold text-amber-400">Active Dataset Debug</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">✕</button>
      </div>
      
      <div className="space-y-2">
        <div>
          <span className="text-slate-400">activeSource:</span> 
          <span className="ml-2 text-emerald-400">{activeSource}</span>
        </div>
        <div>
          <span className="text-slate-400">activeDatasetId:</span> 
          <span className="ml-2 text-blue-300">{activeDataset ? activeDataset.datasetId : 'null'}</span>
        </div>
        <div>
          <span className="text-slate-400">sourceType:</span> 
          <span className="ml-2">{activeDataset ? activeDataset.sourceType : 'null'}</span>
        </div>
        <div>
          <span className="text-slate-400">rowCount (Store):</span> 
          <span className="ml-2 text-blue-400">{records.length}</span>
        </div>
        <div>
          <span className="text-slate-400">columnCount:</span> 
          <span className="ml-2 text-blue-400">{activeDataset ? activeDataset.columnCount : 0}</span>
        </div>
        <div>
          <span className="text-slate-400">previewRows:</span> 
          <span className="ml-2">{activeDataset ? activeDataset.previewRows.length : 0}</span>
        </div>
        <div>
          <span className="text-slate-400">subscribersCount:</span> 
          <span className="ml-2 text-amber-400">{subscribersCount}</span>
        </div>
        <div>
          <span className="text-slate-400">filters ({filters.length}):</span> 
          <div className="pl-2 mt-1 max-h-16 overflow-y-auto bg-slate-800 p-1 rounded">
            {filters.map(f => f.name).join(', ')}
          </div>
        </div>
        <div>
          <span className="text-slate-400">modules receiving data:</span>
          <div className="pl-2 mt-1 bg-slate-800 p-1 rounded">
            {activeDataset && activeDataset.columnProfiles ? (
              <>
                {activeDataset.columnProfiles.some((p: any) => p.isDRE || p.isKPI) && <div className="text-emerald-300">✓ DRE & Financeiro</div>}
                {activeDataset.columnProfiles.some((p: any) => p.isKPI || p.isDRE || p.isComissao || p.isPessoas) && <div className="text-emerald-300">✓ Comercial</div>}
                {activeDataset.columnProfiles.some((p: any) => p.isPessoas) && <div className="text-emerald-300">✓ People Intelligence</div>}
                {activeDataset.columnProfiles.some((p: any) => p.isApresentacao || p.isKPI || p.isDRE) && <div className="text-emerald-300">✓ Apresentações</div>}
                {activeDataset.columnProfiles.some((p: any) => p.isKPI || p.isDRE) && <div className="text-emerald-300">✓ Diagnóstico</div>}
              </>
            ) : (
              <div className="text-rose-400">Nenhum mapeamento ativo</div>
            )}
          </div>
        </div>
        <div className="pt-2 border-t border-slate-700">
          <span className="text-slate-400">last store event:</span> 
          <div className="text-amber-300 mt-1">{lastEvent}</div>
        </div>
      </div>
    </div>
  );
};
