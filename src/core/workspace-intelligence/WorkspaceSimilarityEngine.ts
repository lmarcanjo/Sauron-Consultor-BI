import { classifyBusinessDomain } from "./BusinessDomainClassifier";
import {
  Workspace,
  WorkbookFingerprint,
  WorkspaceSimilarityResult,
} from "./WorkspaceIntelligenceTypes";
import { tokenizeBusinessText } from "./WorkbookFingerprint";

function tokenSimilarity(left: string[], right: string[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  if (leftSet.size === 0 && rightSet.size === 0) return 0;
  const intersection = Array.from(leftSet).filter(token => rightSet.has(token)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return union === 0 ? 0 : intersection / union;
}

function workspaceTokens(workspace: Workspace, selector: (fingerprint: WorkbookFingerprint) => string[]): string[] {
  return Array.from(new Set(workspace.fingerprints.flatMap(selector)));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}

export class WorkspaceSimilarityEngine {
  compareToWorkspace(fingerprint: WorkbookFingerprint, workspace: Workspace): WorkspaceSimilarityResult {
    const sheetSimilarity = tokenSimilarity(
      fingerprint.sheetNames.flatMap(tokenizeBusinessText),
      workspaceTokens(workspace, item => item.sheetNames.flatMap(tokenizeBusinessText))
    );
    const columnSimilarity = tokenSimilarity(fingerprint.columnTokens, workspaceTokens(workspace, item => item.columnTokens));
    const businessSimilarity = tokenSimilarity(fingerprint.businessTerms, workspaceTokens(workspace, item => item.businessTerms));
    const fileNameSimilarity = tokenSimilarity(tokenizeBusinessText(fingerprint.sourceName), workspaceTokens(workspace, item => tokenizeBusinessText(item.sourceName)));
    const structuralSimilarity = workspace.fingerprints.some(item => item.structuralSignature === fingerprint.structuralSignature) ? 1 : 0;

    const classification = classifyBusinessDomain(fingerprint);
    const sameDomain = workspace.businessDomain !== "unknown" && classification.domain === workspace.businessDomain;
    const conflictingDomain = workspace.businessDomain !== "unknown" && classification.domain !== "unknown" && classification.domain !== workspace.businessDomain;
    const domainScore = sameDomain ? 1 : classification.domain === "unknown" || workspace.businessDomain === "unknown" ? 0.35 : 0;

    const rawScore =
      sheetSimilarity * 0.2 +
      columnSimilarity * 0.3 +
      businessSimilarity * 0.2 +
      fileNameSimilarity * 0.1 +
      structuralSimilarity * 0.1 +
      domainScore * 0.1;

    const score = clampScore(conflictingDomain ? rawScore * 0.72 : rawScore);
    const matchingSignals = [
      sheetSimilarity >= 0.25 ? "abas semelhantes" : "",
      columnSimilarity >= 0.25 ? "colunas semelhantes" : "",
      businessSimilarity >= 0.25 ? "termos de negócio semelhantes" : "",
      sameDomain ? `domínio ${workspace.businessDomain}` : "",
      structuralSimilarity ? "estrutura semelhante" : "",
    ].filter(Boolean);
    const conflictingSignals = [
      conflictingDomain ? `domínio divergente: novo ${classification.domain}, workspace ${workspace.businessDomain}` : "",
      sheetSimilarity < 0.1 ? "pouca sobreposição de abas" : "",
      columnSimilarity < 0.1 ? "pouca sobreposição de colunas" : "",
    ].filter(Boolean);

    return {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      score,
      reason: matchingSignals.length
        ? `Sinais encontrados: ${matchingSignals.join(", ")}.`
        : "Poucos sinais conectam esta planilha ao workspace.",
      matchingSignals,
      conflictingSignals,
    };
  }

  compareToWorkspaces(fingerprint: WorkbookFingerprint, workspaces: Workspace[]): WorkspaceSimilarityResult[] {
    return workspaces
      .map(workspace => this.compareToWorkspace(fingerprint, workspace))
      .sort((left, right) => right.score - left.score);
  }
}

export const workspaceSimilarityEngine = new WorkspaceSimilarityEngine();
