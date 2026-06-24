import { useState, useEffect } from "react";
import { dataSourceManager } from "../services/dataSourceManager";
import { LancamentoFinanceiro } from "../types";
import { ActiveDataSource, SpreadsheetFile } from "../types/dataSource";

export function useDataSourceManager() {
  const [activeDataSource, setActiveDataSourceState] = useState<ActiveDataSource>(
    dataSourceManager.getActiveSource()
  );
  const [approvedByConsultant, setApprovedByConsultant] = useState<boolean>(
    dataSourceManager.isApproved()
  );
  
  // Custom force-update counter to trigger re-renders on arbitrary changes
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setActiveDataSourceState(dataSourceManager.getActiveSource());
      setApprovedByConsultant(dataSourceManager.isApproved());
      setTick(t => t + 1);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("sauron_datasource_updated", handleUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("sauron_datasource_updated", handleUpdate);
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
    setActiveSource,
    approveSource,
    rejectSource,
    refreshDataSource,
  };
}
