import React from 'react';
import type { MetricasConsolidadas } from '../types';
import type { ActiveDataset } from '../types/dataSource';
import { ModuleActivationView } from './ModuleActivationView';

interface ComercialTabProps {
  metrics: MetricasConsolidadas;
  formatCurrency: (value: number) => string;
  activeDataset?: ActiveDataset | null;
  onOpenSourceAnalysis?: () => void;
}

export const ComercialTab: React.FC<ComercialTabProps> = ({ activeDataset, onOpenSourceAnalysis }) => (
  <ModuleActivationView moduleId="COMMERCIAL" moduleLabel="Comercial" activeDataset={activeDataset} onOpenSourceAnalysis={onOpenSourceAnalysis} />
);
