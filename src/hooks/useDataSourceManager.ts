import { useState, useEffect } from "react";
import { dataSourceManager } from "../services/dataSourceManager";
import { LancamentoFinanceiro } from "../types";
import { ActiveDataSource, SpreadsheetFile, ActiveDataset, ColumnProfile } from "../types/dataSource";

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

    if (typeof window !== "undefined") {
      window.addEventListener("sauron_datasource_updated", handleUpdate);
      window.addEventListener("DATASET_ACTIVATED", handleUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("sauron_datasource_updated", handleUpdate);
        window.removeEventListener("DATASET_ACTIVATED", handleUpdate);
      }
    };
  }, []);

  const activeRecords = dataSourceManager.getActiveRecords();
  const activeSourceLabel = dataSourceManager.getActiveSourceLabel();
  const workspace = dataSourceManager.getWorkspace();
  const activeFiles = workspace.files.filter(f => workspace.activeFileIds.includes(f.id));

  const setActiveSource = (source: ActiveDataSource) => {
    dataSourceManager.setActiveSource(source);
  };

  const approveSource = () => {
    dataSourceManager.setApproved(true);
  };

  const rejectSource = () => {
    dataSourceManager.setApproved(false);
  };

  const refreshDataSource = () => {
    setTick(t => t + 1);
  };

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
  };
}
