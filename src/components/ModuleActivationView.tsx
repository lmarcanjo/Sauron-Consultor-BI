import React, { useEffect, useState } from 'react';
import { Activity, Archive, Box, CheckCircle2, Database, Package, Wrench } from 'lucide-react';
import type { ActiveDataset } from '../types/dataSource';
import type { ModuleActivationProjection, ModuleConfigurationRecord, ModuleId } from '../core/module-activation';
import { moduleActivationService, moduleConfigurationContextFromArtifact, moduleConfigurationService } from '../core/module-activation';
import { preliminaryFinancialAnalysisService } from '../core/preliminary-analysis/PreliminaryFinancialAnalysisService';
import type { PreliminaryFinancialAnalysisArtifact } from '../core/preliminary-analysis/PreliminaryFinancialAnalysisContracts';
import { consultantWorkspaceManager } from '../modules/consultant-workspace/ConsultantWorkspaceManager';
import { identityEngine } from '../core/identity/IdentityEngine';
import { getEnterpriseContext } from '../core/enterprise-consolidation';
import { ModuleStatusPanel } from './ModuleStatusPanel';
import { ModuleActivationWizard } from './ModuleActivationWizard';
import { PreliminaryFinancialDashboard } from './PreliminaryFinancialDashboard';

interface ModuleActivationViewProps {
  moduleId: ModuleId;
  moduleLabel: string;
  activeDataset?: ActiveDataset | null;
  onOpenSourceAnalysis?: () => void;
}

const ICONS: Record<ModuleId, React.ReactNode> = {
  FINANCIAL: <Activity size={20} className="text-emerald-400" />,
  COMMERCIAL: <Activity size={20} className="text-blue-400" />,
  INVENTORY: <Archive size={20} className="text-amber-400" />,
  ITEMS: <Box size={20} className="text-indigo-400" />,
  AFTER_SALES: <Wrench size={20} className="text-violet-400" />,
};

export const ModuleActivationView: React.FC<ModuleActivationViewProps> = ({ moduleId, moduleLabel, activeDataset: activeDatasetProp, onOpenSourceAnalysis }) => {
  const [artifact, setArtifact] = useState<PreliminaryFinancialAnalysisArtifact | null>(null);
  const [projection, setProjection] = useState<ModuleActivationProjection | null>(null);
  const [configuration, setConfiguration] = useState<ModuleConfigurationRecord | null>(null);
  const [engagementId, setEngagementId] = useState('');
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeDetails, setActiveDetails] = useState(false);
  const activeDataset = activeDatasetProp || null;
  const sourceId = activeDataset?.sourceIdentity?.sourceId || activeDataset?.datasetId || '';
  const currentUser = identityEngine.getCurrentUser();

  const load = async () => {
    setLoading(true);
    try {
      const context = getEnterpriseContext();
      const project = await consultantWorkspaceManager.getActiveProject();
      const nextEngagementId = project?.id || context.workspaceId || '';
      setEngagementId(nextEngagementId);
      let nextArtifact: PreliminaryFinancialAnalysisArtifact | null = null;
      if (nextEngagementId && sourceId) {
        nextArtifact = await preliminaryFinancialAnalysisService.getLatestForEngagement(nextEngagementId, currentUser).catch(() => null);
        if (nextArtifact?.dataSourceId !== sourceId) nextArtifact = null;
      }
      setArtifact(nextArtifact);
      const nextConfiguration = nextArtifact
        ? await moduleConfigurationService.getValidConfiguration(moduleConfigurationContextFromArtifact(moduleId, nextArtifact))
        : null;
      setConfiguration(nextConfiguration);
      setProjection(moduleActivationService.resolveModuleById(moduleId, {
        engagementId: nextEngagementId,
        dataSourceId: sourceId,
        preliminaryArtifact: nextArtifact,
        currentUserId: currentUser?.id || '',
        configuration: nextConfiguration,
      }));
    } catch {
      setArtifact(null);
      setConfiguration(null);
      setProjection(moduleActivationService.resolveModuleById(moduleId, {
        engagementId: '',
        dataSourceId: sourceId,
        preliminaryArtifact: null,
        currentUserId: currentUser?.id || '',
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [moduleId, sourceId, activeDataset?.importedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaved = (saved: ModuleConfigurationRecord) => {
    setConfiguration(saved);
    setWizardOpen(false);
    void load();
  };

  if (loading) return <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-sm font-semibold text-slate-500" data-testid={`module-loading-${moduleId.toLowerCase()}`}>Atualizando {moduleLabel}...</div>;

  if (!projection) return null;

  if (moduleId === 'FINANCIAL' && artifact && projection.status === 'ACTIVE') {
    return <div className="space-y-4"><PreliminaryFinancialDashboard artifact={artifact} onNavigateToAnalysis={onOpenSourceAnalysis} /><p className="text-[11px] text-slate-500 font-semibold">Fonte: {artifact.sourceFileName} · análise {artifact.analysisMode.toLowerCase()} · artefato {artifact.artifactId}</p></div>;
  }

  const primaryAction = () => {
    if (projection.primaryAction === 'CONFIGURE') {
      setWizardOpen(true);
    } else if (projection.primaryAction === 'CHANGE_SOURCE' || projection.primaryAction === 'REVIEW_FIELDS') {
      onOpenSourceAnalysis?.();
    } else {
      setActiveDetails(true);
    }
  };

  return <div className="space-y-4">
    <ModuleStatusPanel projection={projection} moduleLabel={moduleLabel} moduleIcon={ICONS[moduleId]} sourceFileName={activeDataset?.sourceName} onPrimaryAction={primaryAction} onChangeSource={onOpenSourceAnalysis} />
    {projection.status === 'ACTIVE' && activeDetails && artifact && <section className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900 p-5" data-testid={`module-active-details-${moduleId.toLowerCase()}`}><h3 className="flex items-center gap-2 text-sm font-black text-emerald-800 dark:text-emerald-200"><CheckCircle2 size={16} /> Dados disponíveis</h3><p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">{artifact.validRowCount.toLocaleString('pt-BR')} registros podem ser usados por {moduleLabel}.</p><div className="flex flex-wrap gap-2 mt-3">{projection.requirements.filter(item => item.status === 'SATISFIED').flatMap(item => item.matchingPhysicalFields).map(field => <span key={field} className="rounded-md bg-white/70 dark:bg-slate-900/60 px-2 py-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-200">{field}</span>)}</div></section>}
    {wizardOpen && artifact && <ModuleActivationWizard moduleId={moduleId} moduleLabel={moduleLabel} engagementId={engagementId} dataSourceId={sourceId} currentUserId={currentUser?.id || ''} artifact={artifact} projection={projection} onSaved={handleSaved} onClose={() => setWizardOpen(false)} />}
    {!activeDataset && <p className="text-xs text-slate-500">Nenhuma fonte de dados ativa. Abra a Central de Dados para importar uma fonte.</p>}
  </div>;
};
