import { useState, useEffect, useCallback } from "react";
import { dataSourceManager } from "../services/dataSourceManager";
import { LancamentoFinanceiro } from "../types";
import { ActiveDataSource, SpreadsheetFile, ActiveDataset, ColumnProfile } from "../types/dataSource";
import { activeDatasetStore } from "../core/data/ActiveDatasetStore";
import { PLATFORM_EVENTS, subscribePlatformEvent } from "../core/events/PlatformEvents";

export function useDataSourceManager() {
  const [activeDataSource, setActiveDataSourceState] = useState<ActiveDataSource>(
    dataSourceManager.getActiveSource()
  );
  const [approvedByConsultant, setApprovedByConsultant] = useState<boolean>(
    dataSourceManager.isApproved()
  );
  
  // Custom force-update counter to trigger re-renders on arbitrary changes
  const [tick, setTick] = useState(0);
  const [activeDataset, setActiveDataset] = useState<ActiveDataset | null>(
    dataSourceManager.getActiveDataset()
  );

  useEffect(() => {
    const handleUpdate = () => {
      setActiveDataSourceState(dataSourceManager.getActiveSource());
      setApprovedByConsultant(dataSourceManager.isApproved());
      setActiveDataset(dataSourceManager.getActiveDataset());
      setTick(t => t + 1);
    };

    const unsubscribe = activeDatasetStore.subscribe(handleUpdate);
    const unsubscribeSource = subscribePlatformEvent(PLATFORM_EVENTS.DATA_SOURCE_STATE_CHANGED, handleUpdate);
    return () => {
      unsubscribe();
      unsubscribeSource();
    };
  }, []);

  const activeRecords = dataSourceManager.getActiveRecords();
  const activeSourceLabel = dataSourceManager.getActiveSourceLabel();
  const workspace = dataSourceManager.getWorkspace();
  const activeFiles = workspace.files.filter(f => workspace.activeFileIds.includes(f.id));

  const setActiveSource = useCallback((source: ActiveDataSource) => {
    dataSourceManager.setActiveSource(source);
  }, []);

  const approveSource = useCallback(() => {
    dataSourceManager.setApproved(true);
  }, []);

  const rejectSource = useCallback(() => {
    dataSourceManager.setApproved(false);
  }, []);

  const refreshDataSource = useCallback(() => {
    setTick(t => t + 1);
  }, []);

  return {
    activeDataSource,
    activeRecords,
    activeSourceLabel,
    activeFiles,
    approvedByConsultant,
    activeDataset,
    getNormalizedView: dataSourceManager.getNormalizedView.bind(dataSourceManager),
    getColumnProfiles: dataSourceManager.getColumnProfiles.bind(dataSourceManager),
    getAvailableFilters: dataSourceManager.getAvailableFilters.bind(dataSourceManager),
    setActiveSource,
    approveSource,
    rejectSource,
    refreshDataSource,
    workspace,
    tick,
  };
}
