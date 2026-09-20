import { DREArtifact, DRESubtotal } from './DRECompositionContracts';

export interface SubtotalValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

export class DRESubtotalProvenanceValidator {
  public static validate(artifact: DREArtifact): SubtotalValidationResult {
    const errors: string[] = [];

    if (!artifact) {
      return { isValid: false, errors: ['DREArtifact é obrigatório.'] };
    }

    const lineIdSet = new Set(artifact.lines.map(l => l.lineId));
    const subtotalIdSet = new Set(artifact.subtotals.map(s => s.subtotalId));

    // 1. Verificar duplicidade de output subtotalCode por período (DUPLICATE_SUBTOTAL_OUTPUT)
    const seenSubtotalCodesByPeriod = new Set<string>();
    for (const sub of artifact.subtotals) {
      const key = `${sub.periodId}:${sub.subtotalCode}`;
      if (seenSubtotalCodesByPeriod.has(key)) {
        errors.push(`DUPLICATE_SUBTOTAL_OUTPUT: Múltiplas fórmulas gerando o mesmo subtotalCode '${sub.subtotalCode}' para o período '${sub.periodId}'.`);
      }
      seenSubtotalCodesByPeriod.add(key);
    }

    // 2. Verificar dependências por período, correspondência de moeda e ciclo topológico
    const subtotalMapById = new Map<string, DRESubtotal>(artifact.subtotals.map(s => [s.subtotalId, s]));
    
    for (const sub of artifact.subtotals) {
      if (!sub.formulaId || !sub.formulaVersion) {
        errors.push(`Subtotal ${sub.subtotalId} (${sub.subtotalCode}) não possui formulaId ou formulaVersion.`);
      }

      for (const lineId of sub.inputLineIds) {
        if (!lineIdSet.has(lineId)) {
          errors.push(`MISSING_LINE_DEPENDENCY: Subtotal ${sub.subtotalId} referencia linha inexistente ${lineId}.`);
        }
      }

      for (const inputSubId of sub.inputSubtotalIds) {
        if (!subtotalIdSet.has(inputSubId)) {
          errors.push(`MISSING_SUBTOTAL_DEPENDENCY: Subtotal ${sub.subtotalId} (${sub.subtotalCode}) referencia subtotal inexistente ${inputSubId}.`);
        } else {
          const parentSub = subtotalMapById.get(inputSubId);
          if (parentSub) {
            if (parentSub.periodId !== sub.periodId) {
              errors.push(`PERIOD_MISMATCH: Subtotal ${sub.subtotalId} (${sub.periodId}) referencia subtotal ${parentSub.subtotalId} de período diferente (${parentSub.periodId}).`);
            }
            if (parentSub.currencyCode !== sub.currencyCode) {
              errors.push(`CURRENCY_MISMATCH: Subtotal ${sub.subtotalId} (${sub.currencyCode}) referencia subtotal ${parentSub.subtotalId} de moeda diferente (${parentSub.currencyCode}).`);
            }
          }
        }
      }

      if (!sub.provenance || !sub.provenance.inputLineCodes) {
        errors.push(`Subtotal ${sub.subtotalId} não possui registro de proveniência de linha.`);
      }

      if (sub.provenance?.signSemantics !== 'SIGNED_VALUE_MODEL') {
        errors.push(`Subtotal ${sub.subtotalId} não possui convenção SIGNED_VALUE_MODEL válida.`);
      }

      if (!sub.provenance?.expression) {
        errors.push(`Subtotal ${sub.subtotalId} não possui expressão matemática auditável.`);
      }
    }

    // 3. Detecção de Ciclos de Dependência (CIRCULAR_SUBTOTAL_DEPENDENCY) via DFS
    const graph = new Map<string, string[]>();
    for (const sub of artifact.subtotals) {
      graph.set(sub.subtotalId, [...sub.inputSubtotalIds]);
    }

    const visited = new Map<string, 'VISITING' | 'VISITED'>();

    function dfs(nodeId: string, path: string[]) {
      visited.set(nodeId, 'VISITING');
      const deps = graph.get(nodeId) || [];
      for (const depId of deps) {
        const state = visited.get(depId);
        if (state === 'VISITING') {
          const cyclePath = [...path, nodeId, depId].join(' -> ');
          errors.push(`CIRCULAR_SUBTOTAL_DEPENDENCY: Ciclo detectado na árvore de subtotais: ${cyclePath}`);
        } else if (state !== 'VISITED') {
          dfs(depId, [...path, nodeId]);
        }
      }
      visited.set(nodeId, 'VISITED');
    }

    for (const sub of artifact.subtotals) {
      if (!visited.has(sub.subtotalId)) {
        dfs(sub.subtotalId, []);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
