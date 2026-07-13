import { classifyBusinessDomain } from "./BusinessDomainClassifier";
import {
  ImportDecision,
  ImportDecisionOption,
  Workspace,
  WorkbookFingerprint,
  WorkspaceSimilarityResult,
} from "./WorkspaceIntelligenceTypes";
import { workspaceSimilarityEngine } from "./WorkspaceSimilarityEngine";

interface BuildImportDecisionInput {
  fingerprint: WorkbookFingerprint;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
}

function confidence(value: number): number {
  return Math.max(0, Math.min(0.99, Number(value.toFixed(2))));
}

function buildOptions(
  workspaces: Workspace[],
  currentWorkspace: Workspace | null,
  similarities: WorkspaceSimilarityResult[]
): ImportDecisionOption[] {
  const options: ImportDecisionOption[] = [];
  if (currentWorkspace) {
    options.push({
      action: "attach_to_current_workspace",
      label: "Continuar neste workspace",
      workspaceId: currentWorkspace.id,
      workspaceName: currentWorkspace.name,
      reason: "Vincula o workbook ao contexto atualmente selecionado.",
    });
  }

  options.push({
    action: "create_new_workspace",
    label: "Criar novo workspace",
    reason: "Cria um contexto separado para evitar mistura entre empresas ou segmentos.",
  });

  similarities
    .filter(result => result.workspaceId !== currentWorkspace?.id)
    .slice(0, 3)
    .forEach(result => {
      options.push({
        action: "choose_existing_workspace",
        label: `Escolher ${result.workspaceName}`,
        workspaceId: result.workspaceId,
        workspaceName: result.workspaceName,
        reason: result.reason,
      });
    });

  if (workspaces.length > 0) {
    options.push({
      action: "open_temporarily",
      label: "Abrir temporariamente",
      reason: "Abre a planilha sem anexar ao workspace atual.",
    });
  }

  return options;
}

export class ImportDecisionEngine {
  buildDecision(input: BuildImportDecisionInput): ImportDecision {
    const domain = classifyBusinessDomain(input.fingerprint);
    const similarities = workspaceSimilarityEngine.compareToWorkspaces(input.fingerprint, input.workspaces);
    const currentSimilarity = input.currentWorkspace
      ? similarities.find(result => result.workspaceId === input.currentWorkspace?.id)
      : null;
    const bestSimilarity = similarities[0] || null;
    const bestOtherSimilarity = similarities.find(result => result.workspaceId !== input.currentWorkspace?.id) || null;
    const warnings: string[] = [];

    if (input.workspaces.length === 0) {
      return {
        recommendedAction: "create_new_workspace",
        confidence: 0.95,
        reason: "Primeira planilha do projeto. O Sauron deve criar o primeiro workspace automaticamente.",
        options: buildOptions(input.workspaces, input.currentWorkspace, similarities),
        warnings,
        fingerprint: input.fingerprint,
        domain,
        similarities,
        currentWorkspaceId: input.currentWorkspace?.id,
      };
    }

    const hasDomainConflict =
      !!input.currentWorkspace &&
      input.currentWorkspace.businessDomain !== "unknown" &&
      domain.domain !== "unknown" &&
      input.currentWorkspace.businessDomain !== domain.domain;

    if (hasDomainConflict) {
      warnings.push("O domínio provável da nova planilha é diferente do workspace atual.");
      return {
        recommendedAction: "create_new_workspace",
        confidence: 0.9,
        reason: "A planilha parece pertencer a outro segmento. Criar um novo workspace evita mistura de contextos.",
        options: buildOptions(input.workspaces, input.currentWorkspace, similarities),
        warnings,
        fingerprint: input.fingerprint,
        domain,
        similarities,
        currentWorkspaceId: input.currentWorkspace?.id,
      };
    }

    if (
      bestOtherSimilarity &&
      currentSimilarity &&
      bestOtherSimilarity.score > currentSimilarity.score + 0.12 &&
      bestOtherSimilarity.score > 0.55
    ) {
      return {
        recommendedAction: "choose_existing_workspace",
        confidence: confidence(bestOtherSimilarity.score),
        reason: `Outro workspace parece mais compatível: ${bestOtherSimilarity.workspaceName}.`,
        options: buildOptions(input.workspaces, input.currentWorkspace, similarities),
        warnings,
        fingerprint: input.fingerprint,
        domain,
        similarities,
        currentWorkspaceId: input.currentWorkspace?.id,
      };
    }

    if (currentSimilarity && currentSimilarity.score > 0.75) {
      return {
        recommendedAction: "attach_to_current_workspace",
        confidence: confidence(currentSimilarity.score),
        reason: "A planilha tem alta similaridade com o workspace atual.",
        options: buildOptions(input.workspaces, input.currentWorkspace, similarities),
        warnings,
        fingerprint: input.fingerprint,
        domain,
        similarities,
        currentWorkspaceId: input.currentWorkspace?.id,
      };
    }

    if (domain.confidence < 0.35 && (!bestSimilarity || bestSimilarity.score < 0.55)) {
      warnings.push("Baixa confiança na classificação do domínio. O consultor precisa escolher o contexto.");
      return {
        recommendedAction: "open_temporarily",
        confidence: 0.4,
        reason: "Não há sinais suficientes para anexar automaticamente a um workspace.",
        options: buildOptions(input.workspaces, input.currentWorkspace, similarities),
        warnings,
        fingerprint: input.fingerprint,
        domain,
        similarities,
        currentWorkspaceId: input.currentWorkspace?.id,
      };
    }

    return {
      recommendedAction: domain.domain === "unknown" ? "open_temporarily" : "create_new_workspace",
      confidence: confidence(Math.max(domain.confidence, bestSimilarity?.score || 0.5)),
      reason: "A planilha tem sinais próprios, mas não há similaridade alta o bastante com o workspace atual.",
      options: buildOptions(input.workspaces, input.currentWorkspace, similarities),
      warnings,
      fingerprint: input.fingerprint,
      domain,
      similarities,
      currentWorkspaceId: input.currentWorkspace?.id,
    };
  }
}

export const importDecisionEngine = new ImportDecisionEngine();
