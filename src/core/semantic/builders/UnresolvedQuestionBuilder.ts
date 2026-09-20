import {
  FieldInterpretation,
  UnresolvedQuestion,
  GroupedUnresolvedQuestion
} from '../SemanticContracts';

export class UnresolvedQuestionBuilder {
  public static buildQuestions(fieldInterpretations: FieldInterpretation[]): {
    questions: UnresolvedQuestion[];
    groupedQuestions: GroupedUnresolvedQuestion[];
  } {
    const questions: UnresolvedQuestion[] = [];
    const groupedMap = new Map<string, { containerId: string; category: string; reason: string; affectedCols: string[] }>();

    for (const field of fieldInterpretations) {
      const suggestions = field.suggestedInterpretations;

      // 1. Ambiguidade material entre duas sugestões relevantes
      if (suggestions.length >= 2) {
        const top1 = suggestions[0];
        const top2 = suggestions[1];

        if (top1.confidenceScore >= 0.60 && top2.confidenceScore >= 0.50 && (top1.confidenceScore - top2.confidenceScore) < 0.20) {
          questions.push(Object.freeze({
            questionId: `q_ambig_${field.containerId}_${field.physicalName}`,
            questionType: 'AMBIGUOUS_INTERPRETATION',
            targetContainerId: field.containerId,
            targetColumnName: field.physicalName,
            title: `Ambiguidade de interpretação na coluna "${field.physicalName}"`,
            description: `A coluna "${field.physicalName}" apresenta duas interpretações possíveis com confiança similar: "${top1.label}" (${Math.round(top1.confidenceScore * 100)}%) e "${top2.label}" (${Math.round(top2.confidenceScore * 100)}%).`,
            options: Object.freeze([
              { label: `Confirmar como ${top1.label}`, action: `CONFIRM_${top1.interpretationId}` },
              { label: `Confirmar como ${top2.label}`, action: `CONFIRM_${top2.interpretationId}` },
              { label: 'Manter não interpretada', action: 'KEEP_UNINTERPRETED' }
            ]),
            supportingEvidenceIds: Object.freeze([...top1.supportingEvidenceIds, ...top2.supportingEvidenceIds])
          }));

          // Agrupamento
          const groupKey = `${field.containerId}_AMBIGUOUS_${top1.category}`;
          if (!groupedMap.has(groupKey)) {
            groupedMap.set(groupKey, {
              containerId: field.containerId,
              category: top1.category,
              reason: 'Ambiguidade semântica entre hipóteses concorrentes.',
              affectedCols: []
            });
          }
          groupedMap.get(groupKey)!.affectedCols.push(field.physicalName);
        }
      }

      // 2. Conflito de Tipos Misturados em campos materiais
      const mixedTypeLimitation = field.limitations.find(l => l.includes('tipos misturados'));
      if (mixedTypeLimitation) {
        questions.push(Object.freeze({
          questionId: `q_mixed_${field.containerId}_${field.physicalName}`,
          questionType: 'UNCERTAIN_MEASURE_NATURE',
          targetContainerId: field.containerId,
          targetColumnName: field.physicalName,
          title: `Tipos de dados misturados na coluna "${field.physicalName}"`,
          description: `A coluna "${field.physicalName}" possui valores ruidosos ou misturados na planilha de origem.`,
          options: Object.freeze([
            { label: 'Sanitizar valores não numéricos', action: 'SANITISE_NOISE' },
            { label: 'Tratar como texto genérico', action: 'CONVERT_TO_TEXT' }
          ]),
          supportingEvidenceIds: Object.freeze([...field.sourceEvidenceIds])
        }));

        const groupKey = `${field.containerId}_MIXED_TYPES`;
        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, {
            containerId: field.containerId,
            category: 'DATA_QUALITY_NOISE',
            reason: 'Campos com dados contendo tipos misturados ou ruidosos.',
            affectedCols: []
          });
        }
        groupedMap.get(groupKey)!.affectedCols.push(field.physicalName);
      }
    }

    const groupedQuestions: GroupedUnresolvedQuestion[] = Array.from(groupedMap.entries()).map(([groupId, item]) => Object.freeze({
      groupId,
      category: item.category,
      reason: item.reason,
      affectedContainerId: item.containerId,
      affectedColumnNames: Object.freeze(item.affectedCols),
      totalAffectedFields: item.affectedCols.length
    }));

    return { questions, groupedQuestions };
  }
}
