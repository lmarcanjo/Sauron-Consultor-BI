import React, { useState } from 'react';
import { FieldInterpretation } from '../core/semantic/SemanticContracts';
import { FieldSemanticDecision, FieldDecisionType, CustomInterpretationPayload } from '../core/semantic/confirmation/SemanticConfirmationContracts';

interface FieldSemanticReviewCardProps {
  field: FieldInterpretation;
  decision?: FieldSemanticDecision;
  onRecordDecision: (
    columnId: string,
    decisionType: FieldDecisionType,
    options?: {
      selectedInterpretationId?: string;
      consultantLabel?: string;
      customPayload?: CustomInterpretationPayload;
      justification?: string;
    }
  ) => Promise<void>;
}

export const FieldSemanticReviewCard: React.FC<FieldSemanticReviewCardProps> = ({
  field,
  decision,
  onRecordDecision
}) => {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customCategory, setCustomCategory] = useState('UNINTERPRETED');
  const [customJustification, setCustomJustification] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const topHypothesis = field.suggestedInterpretations[0];

  const handleSaveCustom = async () => {
    if (!customLabel.trim()) {
      setCustomError('A label consultiva personalizada é obrigatória.');
      return;
    }
    setCustomError(null);
    setIsSaving(true);
    try {
      await onRecordDecision(field.columnId, 'CUSTOM_INTERPRETATION', {
        consultantLabel: customLabel.trim(),
        customPayload: {
          label: customLabel.trim(),
          category: customCategory,
          justification: customJustification.trim() || undefined,
          isManual: true
        }
      });
      setShowCustomForm(false);
    } catch (err: any) {
      setCustomError(err?.message || 'Falha ao salvar interpretação personalizada.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentDecisionType = decision?.decision;

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 font-sans shadow-sm" data-testid={`field-review-card-${field.physicalName}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700">
            {field.physicalName}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">({field.observedType})</span>
        </div>

        {currentDecisionType && (
          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
            currentDecisionType === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
            currentDecisionType === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
            currentDecisionType === 'KEEP_ORIGINAL' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' :
            currentDecisionType === 'CUSTOM_INTERPRETATION' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
            'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}>
            {currentDecisionType === 'CONFIRMED' ? 'Confirmado' :
             currentDecisionType === 'REJECTED' ? 'Rejeitado' :
             currentDecisionType === 'KEEP_ORIGINAL' ? 'Manter Nome Original' :
             currentDecisionType === 'CUSTOM_INTERPRETATION' ? 'Interpretação do Consultor' :
             'Decisão Adiada'}
          </span>
        )}
      </div>

      {topHypothesis ? (
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-slate-200">{topHypothesis.label}</span>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
              {Math.round(topHypothesis.confidenceScore * 100)}% ({topHypothesis.confidenceBand})
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{topHypothesis.explanation}</p>
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic">Nenhuma hipótese semântica sugerida pelo motor.</p>
      )}

      {/* Evidências e Limitações */}
      {field.limitations && field.limitations.length > 0 && (
        <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
          <span className="font-bold uppercase text-[9px]">Limitações / Contradições:</span>
          {field.limitations.map((lim, idx) => (
            <p key={idx}>• {lim}</p>
          ))}
        </div>
      )}

      {/* Formulário de Interpretação Personalizada */}
      {showCustomForm && (
        <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-2 text-xs">
          <span className="font-bold text-indigo-900 dark:text-indigo-200 block text-[11px] uppercase">
            Informar Interpretação Personalizada do Consultor
          </span>
          {customError && <p className="text-red-600 text-[11px] font-semibold">{customError}</p>}
          <input
            type="text"
            value={customLabel}
            onChange={e => setCustomLabel(e.target.value)}
            placeholder="Nome consultivo / Significado (ex: Receita Bruta Ajustada)"
            className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
          />
          <input
            type="text"
            value={customJustification}
            onChange={e => setCustomJustification(e.target.value)}
            placeholder="Justificativa da interpretação (opcional)"
            className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowCustomForm(false)}
              className="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] font-bold"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveCustom}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold"
            >
              {isSaving ? 'Salvando...' : 'Salvar Decisão'}
            </button>
          </div>
        </div>
      )}

      {/* Botões de Ação por Campo */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {topHypothesis && (
          <button
            type="button"
            onClick={() => onRecordDecision(field.columnId, 'CONFIRMED', { selectedInterpretationId: topHypothesis.interpretationId })}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
          >
            Confirmar Sugestão
          </button>
        )}

        <button
          type="button"
          onClick={() => onRecordDecision(field.columnId, 'REJECTED')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-950 text-slate-700 dark:text-slate-300 hover:text-red-700 text-[10px] font-bold cursor-pointer"
        >
          Rejeitar
        </button>

        <button
          type="button"
          onClick={() => onRecordDecision(field.columnId, 'KEEP_ORIGINAL')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer"
        >
          Manter Nome Original
        </button>

        <button
          type="button"
          onClick={() => setShowCustomForm(curr => !curr)}
          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold cursor-pointer"
        >
          Interpretação Própria
        </button>

        <button
          type="button"
          onClick={() => onRecordDecision(field.columnId, 'DEFERRED')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-500 dark:text-slate-400 text-[10px] font-bold cursor-pointer"
        >
          Decidir Depois
        </button>
      </div>
    </div>
  );
};
