import React from 'react';
import type { MetricasConsolidadas } from '../types';
import type { ActiveDataset } from '../types/dataSource';
import { ModuleActivationView } from './ModuleActivationView';

interface FinanceiroTabProps {
  metrics: MetricasConsolidadas;
  formatCurrency: (value: number) => string;
  activeDataset?: ActiveDataset | null;
  onOpenSourceAnalysis?: () => void;
}

export const FinanceiroTab: React.FC<FinanceiroTabProps> = ({ activeDataset, onOpenSourceAnalysis }) => (
  <ModuleActivationView moduleId="FINANCIAL" moduleLabel="Financeiro" activeDataset={activeDataset} onOpenSourceAnalysis={onOpenSourceAnalysis} />
);
