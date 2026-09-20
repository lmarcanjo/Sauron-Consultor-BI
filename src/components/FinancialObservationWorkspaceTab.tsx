import React, { useState, useEffect } from 'react';
import { 
  Calculator, Database, Shield, ShieldAlert, AlertTriangle, ArrowRight, RefreshCw, CheckCircle2, Clock, Eye, Info, FileSpreadsheet, Lock, AlertCircle, Sparkles, Filter, ChevronRight, Layers, FileText, Tag
} from 'lucide-react';
import { ActiveDataset } from '../types/dataSource';
import { activeDatasetStore } from '../core/data/ActiveDatasetStore';
import { getEnterpriseContext } from '../core/enterprise-consolidation';
import { identityEngine } from '../core/identity/IdentityEngine';
import { platformLogger } from '../core/platform/PlatformLogger';
import { FinancialObservationService } from '../core/financial-structure/FinancialObservationService';
import { FinancialObservationInput } from '../core/financial-structure/FinancialStructureContracts';
import { BusinessArtifact } from '../core/business-insight/BusinessArtifactContracts';
import { TrustArtifact } from '../core/trust/TrustContracts';
import { SemanticConfirmationArtifact } from '../core/semantic/confirmation/SemanticConfirmationContracts';
import { FinancialObservationTechnicalView } from './FinancialObservationTechnicalView';
import { TrustAssessmentTechnicalView } from './TrustAssessmentTechnicalView';
import { FinancialClassificationWorkspaceTab } from './FinancialClassificationWorkspaceTab';

interface FinancialObservationWorkspaceTabProps {
  activeDataset?: ActiveDataset | null;
  onNavigateToTab?: (tab: string) => void;
}

export type ExecutionState = 
  | 'IDLE' 
  | 'VALIDATING' 
  | 'LOADING_GOVERNED_DATA' 
  | 'CALCULATING' 
  | 'PERSISTING' 
  | 'COMPLETED' 
  | 'BLOCKED' 
  | 'FAILED';

export const FinancialObservationWorkspaceTab: React.FC<FinancialObservationWorkspaceTabProps> = ({
  activeDataset: activeDatasetProp,
  onNavigateToTab
}) => {
  const activeDataset = activeDatasetProp || activeDatasetStore.getActiveDataset();
  const context = getEnterpriseContext();
  const currentUser = identityEngine.getCurrentUser();

  // Application Service Instance
  const observationService = React.useMemo(() => new FinancialObservationService(), []);

  // State
  const [targetDataset, setTargetDataset] = useState<ActiveDataset | null>(activeDataset);
  const [trustArtifact, setTrustArtifact] = useState<TrustArtifact | null>(null);
  const [confirmationArtifact, setConfirmationArtifact] = useState<SemanticConfirmationArtifact | null>(null);
  const [artifactHistory, setArtifactHistory] = useState<readonly BusinessArtifact[]>([]);
  const [currentArtifact, setCurrentArtifact] = useState<BusinessArtifact | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState>('IDLE');
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Form selections
  const [selectedMonetaryMeasure, setSelectedMonetaryMeasure] = useState<string>('');
  const [selectedTemporalField, setSelectedTemporalField] = useState<string>('');
  const [selectedCategoryField, setSelectedCategoryField] = useState<string>('');
  const [topN, setTopN] = useState<number>(5);

  // UI Modes
  const [viewMode, setViewMode] = useState<'EXECUTIVE' | 'TECHNICAL' | 'HISTORY' | 'CLASSIFICATION'>('EXECUTIVE');
  const [showTrustDetails, setShowTrustDetails] = useState<boolean>(false);

  // Load canonical context via Application Service
  useEffect(() => {
    let isMounted = true;
    const loadContext = async () => {
      try {
        const engagementId = context.workspaceId || 'workspace_default';
        const proj = await observationService.resolveContext(engagementId, activeDataset, currentUser);

        if (!isMounted) return;

        setTargetDataset(proj.activeDataset);
        setConfirmationArtifact(proj.confirmationArtifact);
        setTrustArtifact(proj.trustArtifact);
        setCurrentArtifact(proj.businessArtifact);
        setArtifactHistory(proj.artifactHistory);

        if (proj.confirmationArtifact) {
          const confirmedMonetary = proj.confirmationArtifact.fieldDecisions.find(
            (d: any) => d.decision === 'CONFIRMED' || d.decision === 'CUSTOM_INTERPRETATION'
          );
          if (confirmedMonetary && !selectedMonetaryMeasure) {
            setSelectedMonetaryMeasure(confirmedMonetary.physicalName);
          }
        }
      } catch (err: any) {
        platformLogger.error(`[FinancialObservationTab] Context resolution error: ${err?.message}`);
      }
    };

    void loadContext();
    return () => { isMounted = false; };
  }, [activeDataset, context.workspaceId, observationService]);

  // Derived field options from confirmation (STRICT: only confirmed decisions)
  // Derived field options from confirmation or suggestions (falls back to column profiles for PRELIMINARY analysis)
  const confirmedDecisions = React.useMemo(() => {
    if (confirmationArtifact && confirmationArtifact.fieldDecisions.length > 0) {
      return confirmationArtifact.fieldDecisions.filter(
        d => d.decision === 'CONFIRMED' || d.decision === 'CUSTOM_INTERPRETATION'
      );
    }
    // Preliminary fallback using suggested column schema properties from active dataset
    if (!targetDataset) return [];
    return targetDataset.columnProfiles.map(p => ({
      columnId: p.name,
      physicalName: p.originalName || p.name,
      decision: 'CONFIRMED' as const,
      consultantLabel: p.name
    }));
  }, [confirmationArtifact, targetDataset]);

  const monetaryFields = React.useMemo(() => {
    if (confirmationArtifact && confirmationArtifact.fieldDecisions.length > 0) {
      return confirmedDecisions.map(d => d.physicalName);
    }
    // Fallback candidates
    return ['Valor', 'Valor Pago', 'Saldo'].filter(f => 
      targetDataset?.columnProfiles.some(p => (p.originalName || p.name) === f)
    );
  }, [confirmedDecisions, confirmationArtifact, targetDataset]);

  const temporalFields = React.useMemo(() => {
    if (confirmationArtifact && confirmationArtifact.fieldDecisions.length > 0) {
      return confirmedDecisions
        .filter(d => {
          const name = d.physicalName.toLowerCase();
          const label = (d.consultantLabel || '').toLowerCase();
          return name.includes('data') || name.includes('date') || name.includes('mes') || name.includes('ano') || name.includes('periodo') ||
                 label.includes('data') || label.includes('date') || label.includes('mes') || label.includes('ano') || label.includes('periodo');
        })
        .map(d => d.physicalName);
    }
    // Fallback candidates
    return ['Emissão', 'Vencimento', 'Pagamento'].filter(f => 
      targetDataset?.columnProfiles.some(p => (p.originalName || p.name) === f)
    );
  }, [confirmedDecisions, confirmationArtifact, targetDataset]);

  const categoryFields = React.useMemo(() => {
    if (confirmationArtifact && confirmationArtifact.fieldDecisions.length > 0) {
      return confirmedDecisions
        .filter(d => !temporalFields.includes(d.physicalName))
        .map(d => d.physicalName);
    }
    // Fallback candidates
    return ['Situação', 'Pessoa', 'Conta Contábil', 'Centro de Resultado', 'Unidade de Negócio'].filter(f => 
      targetDataset?.columnProfiles.some(p => (p.originalName || p.name) === f)
    );
  }, [confirmedDecisions, temporalFields, confirmationArtifact, targetDataset]);

  // Check Trust status
  const trustUsageAssessment = trustArtifact?.usageAssessments.find(u => u.usageType === 'FINANCIAL_ANALYSIS');
  const isTrustAuthorized = trustUsageAssessment && (trustUsageAssessment.status === 'TRUSTED' || trustUsageAssessment.status === 'CONDITIONALLY_TRUSTED');
  const isTrustBlocked = !trustArtifact || trustArtifact.trustAssessment.overallState === 'BLOCKED' || !isTrustAuthorized;

  // Execution Handler
  const handleExecuteObservation = async () => {
    if (!targetDataset || !trustArtifact || !activeConfirmationArtifact || (executionState !== 'IDLE' && executionState !== 'COMPLETED' && executionState !== 'FAILED')) {
      return;
    }

    if (!selectedMonetaryMeasure) {
      setExecutionError('Selecione uma medida monetária confirmada para prosseguir.');
      setExecutionState('BLOCKED');
      return;
    }

    setExecutionError(null);
    setExecutionState('VALIDATING');

    try {
      // Step 1: Validate & Prepare Input
      const scopeId = context.unitId || context.companyId || context.groupId || targetDataset.datasetId;
      const rawScope = String(context.scope || '').toUpperCase();
      const scopeLevel: 'UNIT' | 'COMPANY' | 'GROUP' = rawScope === 'UNIT' ? 'UNIT' : rawScope === 'COMPANY' ? 'COMPANY' : 'GROUP';

      const rawRows = activeDatasetStore.getActiveRows() || [];
      const records = rawRows.map((r, idx) => ({
        recordId: `rec_${idx}`,
        values: (r as any) || {}
      }));

      const input: FinancialObservationInput = {
        user: currentUser,
        scope: {
          scopeLevel,
          scopeId,
          engagementId: context.workspaceId || 'workspace_default',
          period: typeof context.period === 'string' ? context.period : undefined
        },
        trustArtifact,
        semanticConfirmationDecisions: activeConfirmationArtifact.fieldDecisions,
        records,
        trustUsage: 'FINANCIAL_ANALYSIS',
        options: {
          topN
        }
      };

      setExecutionState('LOADING_GOVERNED_DATA');
      await new Promise(r => setTimeout(r, 100)); // Smooth UI transition

      setExecutionState('CALCULATING');
      await new Promise(r => setTimeout(r, 100));

      setExecutionState('PERSISTING');
      const artifact = await observationService.executeObservation(input, currentUser);

      setCurrentArtifact(artifact);
      const engagementId = context.workspaceId || 'workspace_default';
      const proj = await observationService.resolveContext(engagementId, activeDataset, currentUser);
      setArtifactHistory(proj.artifactHistory);
      setExecutionState('COMPLETED');
    } catch (err: any) {
      setExecutionError(err?.message || 'Ocorreu um erro ao executar a observação financeira.');
      setExecutionState('FAILED');
    }
  };

  // State: NO_SOURCE
  if (!targetDataset) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center max-w-xl mx-auto my-12 space-y-6 shadow-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 border border-emerald-100 dark:border-emerald-900">
          <Database size={28} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight">Nenhuma Fonte de Dados Ativa</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Para realizar a Observação Financeira, selecione ou conecte uma fonte de dados no Engajamento ativo.
          </p>
        </div>
        {onNavigateToTab && (
          <button
            onClick={() => onNavigateToTab('central_dados')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <FileSpreadsheet size={15} />
            <span>Ir para Central de Dados</span>
          </button>
        )}
      </div>
    );
  }

  // Certified observation requires an actual semantic confirmation. The
  // preliminary dashboard is rendered by ModuleActivationView and never
  // fabricates confirmation decisions here.
  const isPreliminaryMode = !confirmationArtifact;
  const activeConfirmationArtifact = confirmationArtifact;

  return (
    <div className="space-y-6 font-sans animate-fade-in text-slate-850 dark:text-slate-100 pb-12">
      {/* HEADER DA ABA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calculator size={20} className="text-emerald-500" />
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">Observação Financeira</h2>
            {isPreliminaryMode ? (
              <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-black rounded-md uppercase tracking-wider">
                Análise Preliminar Descritiva
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black rounded-md uppercase tracking-wider">
                Governada por Trust
              </span>
            )}
          </div>
          {isPreliminaryMode && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-semibold mb-2">
              Atenção: Você está visualizando uma Análise Financeira Preliminar. Os campos sugeridos pela planilha original foram mantidos e a análise descritiva é parcial, sem a validação formal exigida para a DRE Certificada ou diagnósticos completos.
            </div>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Análise descritiva neutra da estrutura monetária da fonte <span className="font-semibold text-slate-700 dark:text-slate-300">{targetDataset.sourceName}</span>.
          </p>
        </div>

        {/* CONTROLES DE NAVEGAÇÃO E VISUALIZAÇÃO */}
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setViewMode('EXECUTIVE')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'EXECUTIVE' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Visão Executiva
            </button>
            <button
              onClick={() => setViewMode('TECHNICAL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'TECHNICAL' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Visão Técnica
            </button>
            <button
              onClick={() => setViewMode('HISTORY')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${viewMode === 'HISTORY' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <Clock size={13} />
              <span>Histórico ({artifactHistory.length})</span>
            </button>
            <button
              onClick={() => setViewMode('CLASSIFICATION')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${viewMode === 'CLASSIFICATION' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'}`}
            >
              <Tag size={13} />
              <span>Classificação Financeira</span>
            </button>
          </div>
        </div>
      </div>

      {/* PAINEL DE GOVERNANÇA & TRUST */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className={isTrustBlocked ? 'text-rose-500' : 'text-emerald-500'} />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Certificação de Trust para Análise Financeira
            </h3>
          </div>
          <button
            onClick={() => setShowTrustDetails(!showTrustDetails)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
          >
            <span>{showTrustDetails ? 'Ocultar Detalhes' : 'Ver Detalhes do Trust'}</span>
            <ChevronRight size={14} className={`transform transition-transform ${showTrustDetails ? 'rotate-90' : ''}`} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Estado de Confiabilidade:</span>
            <span className={`px-2.5 py-0.5 rounded-md font-bold uppercase border text-[11px] ${
              trustArtifact?.trustAssessment.overallState === 'TRUSTED'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : trustArtifact?.trustAssessment.overallState === 'CONDITIONALLY_TRUSTED'
                ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
            }`}>
              {trustArtifact?.trustAssessment.overallState || 'NÃO AVALIADO'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Uso FINANCIAL_ANALYSIS:</span>
            <span className={`font-bold ${isTrustAuthorized ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isTrustAuthorized ? 'AUTORIZADO' : 'BLOQUEADO'}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto text-slate-400 font-mono text-[11px]">
            <span>Schema v1</span>
            <span>•</span>
            <span>Versão da Política: {trustArtifact?.provenance.policyVersion || '1.0.0'}</span>
          </div>
        </div>

        {showTrustDetails && trustArtifact && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <TrustAssessmentTechnicalView artifact={trustArtifact} />
          </div>
        )}
      </div>

      {/* BLOQUEIO DE TRUST */}
      {isTrustBlocked && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl p-6 text-rose-900 dark:text-rose-200 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-rose-600 shrink-0" />
            <h4 className="font-black text-sm uppercase tracking-wide">Execução Bloqueada pela Governança de Trust</h4>
          </div>
          <p className="text-xs leading-relaxed">
            {trustArtifact?.trustAssessment.primaryBlockingReason || 'Esta fonte não atingiu os requisitos mínimos de integridade estrutural e qualidade para a execução de análises financeiras.'}
          </p>
          <div className="pt-2">
            <span className="text-xs font-bold block mb-1">Remediações Necessárias:</span>
            <ul className="list-disc list-inside text-xs space-y-1 text-rose-800 dark:text-rose-300">
              {trustArtifact?.blockingConditions.map((b, idx) => (
                <li key={idx}>{b.remediationHint}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* CONFIGURAÇÃO SOURCE-DRIVEN & EXECUÇÃO */}
      {!isTrustBlocked && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
              <Filter size={16} className="text-blue-500" />
              <span>Configuração Source-Driven da Observação</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Selecione os campos confirmados para compor a análise. Somente estruturas validadas estão disponíveis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SELETOR MONETÁRIO (OBRIGATÓRIO) */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Medida Monetária Confirmada <span className="text-rose-500">*</span>
              </label>
              {monetaryFields.length > 0 ? (
                <select
                  value={selectedMonetaryMeasure}
                  onChange={e => setSelectedMonetaryMeasure(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecione uma medida...</option>
                  {monetaryFields.map(f => (
                    <option key={f} value={f}>{f} (Confirmado)</option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-medium">
                  Nenhuma medida monetária confirmada nesta fonte.
                </div>
              )}
              <span className="text-[11px] text-slate-400 block">Exibe somente campos validados no schema.</span>
            </div>

            {/* SELETOR TEMPORAL (OPCIONAL) */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Campo Temporal (Opcional)
              </label>
              <select
                value={selectedTemporalField}
                onChange={e => setSelectedTemporalField(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Nenhum (Análise geral sem período)</option>
                {temporalFields.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 block">Usado para identificar a cobertura de datas.</span>
            </div>

            {/* SELETOR DE CATEGORIA & TOP N */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Categoria & Concentração (Opcional)
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedCategoryField}
                  onChange={e => setSelectedCategoryField(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Sem agrupamento</option>
                  {categoryFields.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>

                <select
                  value={topN}
                  onChange={e => setTopN(Number(e.target.value))}
                  disabled={!selectedCategoryField}
                  className="w-20 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  <option value={3}>Top 3</option>
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                </select>
              </div>
              <span className="text-[11px] text-slate-400 block">Mede a distribuição neutra por categoria.</span>
            </div>
          </div>

          {/* MENSAGEM DE ERRO NA EXECUÇÃO */}
          {executionError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{executionError}</span>
            </div>
          )}

          {/* CTA PRINCIPAL E ÚNICA DE EXECUÇÃO */}
          <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500 font-medium">
              Estado: <span className="font-bold text-slate-800 dark:text-slate-200">{executionState}</span>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {isPreliminaryMode && onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('analise_estrutura')}
                  className="px-4 py-2.5 rounded-xl border border-slate-350 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  REVISAR ENTENDIMENTO DOS CAMPOS
                </button>
              )}

              <button
                onClick={handleExecuteObservation}
                disabled={executionState === 'VALIDATING' || executionState === 'LOADING_GOVERNED_DATA' || executionState === 'CALCULATING' || executionState === 'PERSISTING' || !selectedMonetaryMeasure}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
              >
                {executionState === 'VALIDATING' || executionState === 'LOADING_GOVERNED_DATA' || executionState === 'CALCULATING' || executionState === 'PERSISTING' ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Processando Observação...</span>
                  </>
                ) : (
                  <>
                    <Calculator size={15} />
                    <span>ANALISAR DADOS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXIBIÇÃO DO RESULTADO (BUSINESS ARTIFACT REAL) */}
      {viewMode === 'TECHNICAL' && currentArtifact && (
        <FinancialObservationTechnicalView artifact={currentArtifact} />
      )}

      {viewMode === 'HISTORY' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
            <Clock size={16} className="text-blue-500" />
            <span>Histórico de Execuções Governadas</span>
          </h3>

          {artifactHistory.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Nenhum artefato registrado historicamente para este escopo.</p>
          ) : (
            <div className="space-y-3">
              {artifactHistory.map((art, idx) => (
                <div key={art.artifactId} className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Versão #{artifactHistory.length - idx} — {new Date(art.metadata.generatedAt).toLocaleString('pt-BR')}
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      Engine: {art.engineId} (v{art.engineVersion}) | Artifact ID: {art.artifactId}
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentArtifact(art)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] rounded-lg transition-all"
                  >
                    Visualizar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'EXECUTIVE' && currentArtifact && (
        <div className="space-y-6">
          {/* CARDS DE MÉTRICAS OBSERVADAS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {currentArtifact.calculatedMetrics.slice(0, 4).map(m => (
              <div key={m.metricId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">{m.name}</span>
                <span className="text-xl font-black text-slate-900 dark:text-white block">
                  {typeof m.value === 'number' ? m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : m.value} <span className="text-xs font-semibold text-slate-400">{m.unit}</span>
                </span>
                <span className="text-[10px] text-slate-400 block italic">Origem: {m.formulaReference}</span>
              </div>
            ))}
          </div>

          {/* PAINEL DE OBSERVAÇÕES NEUTRAS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sparkles size={16} className="text-emerald-500" />
              <span>Observações Factuais da Estrutura</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentArtifact.businessObservations.map(obs => (
                <div key={obs.observationId} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">{obs.title}</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{obs.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* DEGRAU DE LIMITAÇÕES VISÍVEIS */}
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 space-y-2 text-amber-900 dark:text-amber-200 text-xs">
            <span className="font-extrabold uppercase tracking-wider block flex items-center gap-1.5">
              <Info size={14} className="text-amber-600" />
              <span>Limitações Declaradas da Observação</span>
            </span>
            <ul className="list-disc list-inside space-y-1 text-[11px] font-medium text-amber-800 dark:text-amber-300">
              {currentArtifact.limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {viewMode === 'CLASSIFICATION' && (
        <FinancialClassificationWorkspaceTab
          dataSourceId={targetDataset.datasetId}
          engagementId={context.workspaceId || 'eng_1'}
          trustArtifactId={trustArtifact?.artifactId}
          semanticConfirmationArtifactId={activeConfirmationArtifact?.artifactId}
        />
      )}
    </div>
  );
};
