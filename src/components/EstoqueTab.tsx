import React from 'react';
import type { MetricasConsolidadas } from '../types';
import type { ActiveDataset } from '../types/dataSource';
import { ModuleActivationView } from './ModuleActivationView';

interface EstoqueTabProps {
  metrics: MetricasConsolidadas;
  formatCurrency: (value: number) => string;
  activeDataset?: ActiveDataset | null;
  onOpenSourceAnalysis?: () => void;
}

export const EstoqueTab: React.FC<EstoqueTabProps> = ({ activeDataset, onOpenSourceAnalysis }) => (
  <ModuleActivationView moduleId="INVENTORY" moduleLabel="Estoque" activeDataset={activeDataset} onOpenSourceAnalysis={onOpenSourceAnalysis} />
);
