import React from 'react';
import type { MetricasConsolidadas } from '../types';
import type { ActiveDataset } from '../types/dataSource';
import { ModuleActivationView } from './ModuleActivationView';

interface PosVendasTabProps {
  metrics: MetricasConsolidadas;
  formatCurrency: (value: number) => string;
  activeDataset?: ActiveDataset | null;
  onOpenSourceAnalysis?: () => void;
}

export const PosVendasTab: React.FC<PosVendasTabProps> = ({ activeDataset, onOpenSourceAnalysis }) => (
  <ModuleActivationView moduleId="AFTER_SALES" moduleLabel="Pós-vendas" activeDataset={activeDataset} onOpenSourceAnalysis={onOpenSourceAnalysis} />
);
