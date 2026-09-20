import React, { useState } from 'react';
import { Tag, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, ArrowRight, Save, Lock } from 'lucide-react';
import { ClassificationType, FinancialNature, StatementGroup, SignPolicy, FinancialClassificationDecision } from '../core/financial-classification/FinancialClassificationContracts';
import { FinancialClassificationEngine } from '../core/financial-classification/FinancialClassificationEngine';
import { FinancialClassificationService } from '../core/financial-classification/FinancialClassificationService';
import { identityEngine } from '../core/identity/IdentityEngine';

interface FinancialClassificationWorkspaceTabProps {
  dataSourceId?: string;
  engagementId?: string;
  schemaVersionNumber?: number;
  semanticConfirmationArtifactId?: string;
  trustArtifactId?: string;
  categoryFieldPhysicalName?: string;
  monetaryFieldPhysicalName?: string;
  observedCategories?: Array<{ physicalValue: string; totalValue: number; recordCount: number }>;
  onClassificationConfirmed?: () => void;
}

export const FinancialClassificationWorkspaceTab: React.FC<FinancialClassificationWorkspaceTabProps> = ({
  dataSourceId = 'ds_fin_1',
  engagementId = 'eng_1',
  schemaVersionNumber = 1,
  semanticConfirmationArtifactId = 'sem_conf_1',
  trustArtifactId = 'trust_ds_1_v1_123',
  categoryFieldPhysicalName = 'CATEGORIA',
  monetaryFieldPhysicalName = 'VALOR',
  observedCategories = [
    { physicalValue: 'Vendas de Produtos', totalValue: 450000, recordCount: 45 },
    { physicalValue: 'Operações de Contratos', totalValue: 350000, recordCount: 30 },
    { physicalValue: 'Folha de Pagamento', totalValue: -180000, recordCount: 15 },
    { physicalValue: 'Aluguel & Condomínio', totalValue: -45000, recordCount: 12 },
    { physicalValue: 'Tarifas Bancárias', totalValue: -2500, recordCount: 3 }
  ],
  onClassificationConfirmed
}) => {
  const currentUser = identityEngine.getCurrentUser();
  const service = React.useMemo(() => new FinancialClassificationService(), []);
  const engine = React.useMemo(() => new FinancialClassificationEngine(), []);

  const totalDatasetValue = observedCategories.reduce((acc, c) => acc + Math.abs(c.totalValue), 0);

  // Decisões em estado local
  const [decisions, setDecisions] = useState<Record<string, {
    classificationType: ClassificationType;
    financialNature: FinancialNature;
    statementGroup: StatementGroup;
    signPolicy: SignPolicy;
    rationale: string;
  }>>(() => {
    const initial: Record<string, any> = {};
    for (const cat of observedCategories) {
      initial[cat.physicalValue] = {
        classificationType: 'UNRESOLVED',
        financialNature: 'UNKNOWN',
        statementGroup: 'UNCLASSIFIED',
        signPolicy: 'PRESERVE_SOURCE_SIGN',
        rationale: ''
      };
    }
    return initial;
  });

  const totalDatasetRecordCount = observedCategories.reduce((acc, c) => acc + c.recordCount, 0);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleUpdateCategory = (physicalValue: string, updates: Partial<typeof decisions[string]>) => {
    setDecisions(prev => ({
      ...prev,
      [physicalValue]: {
        ...prev[physicalValue],
        ...updates
      }
    }));
  };

  const handleConfirmClassification = async () => {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Montar decisões
      const formattedDecisions: Omit<FinancialClassificationDecision, 'decisionId' | 'decidedAt'>[] = observedCategories.map(cat => {
        const dec = decisions[cat.physicalValue];
        const norm = engine.normalizeCategory(cat.physicalValue);
        const mat = engine.evaluateMateriality({
          categoryIdentity: norm.categoryIdentity,
          absoluteValue: Math.abs(cat.totalValue),
          datasetTotalAbsoluteValue: totalDatasetValue,
          recordCount: cat.recordCount,
          datasetTotalRecordCount: totalDatasetRecordCount
        });

        return {
          categoryIdentity: norm.categoryIdentity,
          physicalValue: cat.physicalValue,
          normalizedValue: norm.normalizedValue,
          categoryNormalizationMetadata: norm.metadata,
          categoryFieldPhysicalName,
          monetaryFieldPhysicalName,
          classificationType: dec.classificationType,
          financialNature: dec.financialNature,
          statementGroup: dec.statementGroup,
          signPolicy: dec.signPolicy,
          scope: { scopeLevel: 'DATA_SOURCE', scopeId: dataSourceId, engagementId },
          rationale: dec.rationale || 'Classificação manual do consultor',
          consultantId: currentUser?.id || 'usr_consultant',
          supportingEvidenceIds: [],
          semanticDecisionIds: [],
          trustArtifactId,
          limitations: [],
          status: dec.classificationType === 'UNRESOLVED' ? 'KEEP_UNCLASSIFIED' : 'CONFIRM_CLASSIFICATION',
          provenance: {
            dataSourceId,
            schemaVersionNumber,
            trustArtifactId,
            trustUsage: 'FINANCIAL_ANALYSIS',
            semanticConfirmationArtifactId,
            engineId: 'FinancialClassificationEngine',
            engineVersion: '1.0.0-HARDENED'
          },
          materialityAssessment: mat
        };
      });

      // 2. Salvar Draft via Application Service
      const draft = await service.saveDraftClassification({
        engagementId,
        dataSourceId,
        schemaVersionNumber,
        semanticConfirmationArtifactId,
        trustArtifactId,
        containerId: 'Sheet1',
        monetaryFieldReference: monetaryFieldPhysicalName,
        categoryFieldReference: categoryFieldPhysicalName,
        decisions: formattedDecisions
      }, currentUser);

      // 3. Confirmar Classificação
      const confirmed = await service.confirmClassification(draft.artifactId, currentUser);

      setSuccessMessage(`Classificação Financeira ${confirmed.artifactId} confirmada com sucesso!`);
      if (onClassificationConfirmed) onClassificationConfirmed();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao confirmar classificação financeira.');
    } finally {
      setSaving(false);
    }
  };

  const hasUnresolvedMaterial = observedCategories.some(cat => {
    const dec = decisions[cat.physicalValue];
    const norm = engine.normalizeCategory(cat.physicalValue);
    const mat = engine.evaluateMateriality({
      categoryIdentity: norm.categoryIdentity,
      absoluteValue: Math.abs(cat.totalValue),
      datasetTotalAbsoluteValue: totalDatasetValue,
      recordCount: cat.recordCount,
      datasetTotalRecordCount: totalDatasetRecordCount
    });
    return mat.materialityState === 'MATERIAL' && dec.classificationType === 'UNRESOLVED';
  });

  return (
    <div className="p-6 bg-slate-900 text-slate-100 rounded-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Tag className="w-6 h-6 text-indigo-400" />
            Classificação Financeira Declarada (Preparatória para DRE)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Defina explicitamente a natureza e os agrupamentos das categorias físicas confirmadas. Nenhuma classificação é feita automaticamente.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-amber-400" /> Decisão Humana Goverada
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
            <tr>
              <th className="p-3">Categoria Física</th>
              <th className="p-3">Valor Observado</th>
              <th className="p-3">Materialidade</th>
              <th className="p-3">Tipo de Fluxo</th>
              <th className="p-3">Natureza Financeira</th>
              <th className="p-3">Grupo Preparatório</th>
              <th className="p-3">Sign Policy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/50">
            {observedCategories.map(cat => {
              const dec = decisions[cat.physicalValue];
              const norm = engine.normalizeCategory(cat.physicalValue);
              const mat = engine.evaluateMateriality({
                categoryIdentity: norm.categoryIdentity,
                absoluteValue: Math.abs(cat.totalValue),
                datasetTotalAbsoluteValue: totalDatasetValue,
                recordCount: cat.recordCount,
                datasetTotalRecordCount: totalDatasetRecordCount
              });
              const projected = engine.projectValue(cat.totalValue, dec.signPolicy);

              return (
                <tr key={cat.physicalValue} className="hover:bg-slate-800/50">
                  <td className="p-3 font-medium text-slate-200">
                    {cat.physicalValue}
                    <div className="text-[10px] font-mono text-slate-500">{norm.normalizedValue}</div>
                    <div className="text-xs text-slate-500">{cat.recordCount} registros</div>
                  </td>
                  <td className="p-3 font-mono text-slate-300">
                    R$ {cat.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {dec.signPolicy !== 'PRESERVE_SOURCE_SIGN' && (
                      <div className="text-xs text-indigo-400">Projetado: R$ {projected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    )}
                  </td>
                  <td className="p-3">
                    {mat.materialityState === 'MATERIAL' ? (
                      <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20" title={mat.materialityReasons.join(' ')}>
                        MATERIAL
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                        Secundário
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <select
                      value={dec.classificationType}
                      onChange={e => handleUpdateCategory(cat.physicalValue, { classificationType: e.target.value as ClassificationType })}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="UNRESOLVED">-- Selecionar --</option>
                      <option value="INFLOW">INFLOW (Entrada)</option>
                      <option value="OUTFLOW">OUTFLOW (Saída)</option>
                      <option value="BALANCE">BALANCE (Saldo)</option>
                      <option value="NON_FINANCIAL">NON_FINANCIAL (Não financeiro)</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={dec.financialNature}
                      onChange={e => handleUpdateCategory(cat.physicalValue, { financialNature: e.target.value as FinancialNature })}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="UNKNOWN">-- Selecionar --</option>
                      <option value="OPERATING">OPERATING (Operacional)</option>
                      <option value="FINANCING">FINANCING (Financiamento)</option>
                      <option value="INVESTING">INVESTING (Investimento)</option>
                      <option value="TAX">TAX (Tributário)</option>
                      <option value="PERSONNEL">PERSONNEL (Pessoal)</option>
                      <option value="OTHER">OTHER (Outros)</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={dec.statementGroup}
                      onChange={e => handleUpdateCategory(cat.physicalValue, { statementGroup: e.target.value as StatementGroup })}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="UNCLASSIFIED">-- Selecionar --</option>
                      <option value="GROSS_INFLOW">GROSS_INFLOW</option>
                      <option value="DEDUCTION">DEDUCTION</option>
                      <option value="DIRECT_COST">DIRECT_COST</option>
                      <option value="OPERATING_EXPENSE">OPERATING_EXPENSE</option>
                      <option value="FINANCIAL_RESULT">FINANCIAL_RESULT</option>
                      <option value="TAX_RESULT">TAX_RESULT</option>
                      <option value="NON_OPERATING">NON_OPERATING</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={dec.signPolicy}
                      onChange={e => handleUpdateCategory(cat.physicalValue, { signPolicy: e.target.value as SignPolicy })}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="PRESERVE_SOURCE_SIGN">Preservar Sinal</option>
                      <option value="ABSOLUTE_VALUE_AS_INFLOW">Absoluto (+ Entrada)</option>
                      <option value="ABSOLUTE_VALUE_AS_OUTFLOW">Absoluto (- Saída)</option>
                      <option value="INVERT_SOURCE_SIGN">Inverter Sinal</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          {hasUnresolvedMaterial ? (
            <span className="text-red-400 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-4 h-4" /> Existem categorias materiais não resolvidas. Resolva-as para habilitar a confirmação.
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Todas as categorias materiais foram resolvidas. Pronto para confirmar.
            </span>
          )}
        </div>

        <button
          onClick={handleConfirmClassification}
          disabled={saving || hasUnresolvedMaterial}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors"
        >
          {saving ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />}
          CONFIRMAR CLASSIFICAÇÃO FINANCEIRA
        </button>
      </div>
    </div>
  );
};
