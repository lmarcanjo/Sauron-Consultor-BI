import { classifyBusinessDomain, workspaceIntelligenceEngine } from "../workspace-intelligence";
import { getDefaultProjectId, listModuleMappings, saveModuleMapping } from "../data/moduleMapping";
import { buildModuleSuggestions } from "./ModuleSuggestionEngine";
import {
  ApplySmartConfigurationOptions,
  ApplySmartConfigurationResult,
  ModuleMappingSuggestion,
  SmartConfigurationContext,
  SmartConfigurationPlan,
} from "./SmartConfigurationTypes";
import {
  recordAcceptedSuggestions,
  recordIgnoredSuggestions,
} from "./WorkspaceMappingMemory";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildPlanId(datasetId: string, suggestionIds: string[]): string {
  return `smart-config:${datasetId}:${suggestionIds.sort().join("::")}`;
}

function resolveWorkspaceId(context: SmartConfigurationContext): string | undefined {
  return context.workspaceId || workspaceIntelligenceEngine.getCurrentIntelligentWorkspace()?.id;
}

function canApplySuggestion(
  suggestion: ModuleMappingSuggestion,
  options: ApplySmartConfigurationOptions,
): boolean {
  if (options.modules && !options.modules.includes(suggestion.moduleName)) return false;
  if (!options.includeReviewOnly && suggestion.status === "review_only") return false;
  return suggestion.confidence >= (options.minConfidence ?? 0.58);
}

export async function buildSmartConfigurationPlan(context: SmartConfigurationContext): Promise<SmartConfigurationPlan> {
  const fingerprint = context.fingerprint || workspaceIntelligenceEngine.createWorkbookFingerprint(
    context.activeDataset,
    context.workbookId,
  );
  const workspaceId = resolveWorkspaceId(context);
  const domain = classifyBusinessDomain(fingerprint);
  const projectId = context.projectId || getDefaultProjectId(context.activeDataset);
  const existingMappedModules = new Set(
    listModuleMappings(context.activeDataset.datasetId, projectId).map(mapping => mapping.moduleName)
  );
  const suggestions = (await buildModuleSuggestions({
    ...context,
    fingerprint,
    workspaceId,
    projectId,
  })).filter(suggestion => !existingMappedModules.has(suggestion.moduleName));
  const overallConfidence = Number(average(suggestions.map(suggestion => suggestion.confidence)).toFixed(2));
  const reviewRequired = suggestions.some(suggestion => suggestion.status === "review_only") || overallConfidence < 0.58;

  return {
    id: buildPlanId(context.activeDataset.datasetId, suggestions.map(suggestion => suggestion.id)),
    datasetId: context.activeDataset.datasetId,
    projectId,
    workbookId: context.workbookId || fingerprint.workbookId,
    workspaceId,
    domain,
    fingerprint,
    suggestions,
    overallConfidence,
    reviewRequired,
    warnings: reviewRequired ? ["Existem sugestões que precisam de revisão do consultor antes de uso definitivo."] : [],
    generatedAt: new Date().toISOString(),
  };
}

export function applySmartConfigurationPlan(
  plan: SmartConfigurationPlan,
  options: ApplySmartConfigurationOptions = {},
): ApplySmartConfigurationResult {
  const appliedSuggestions: ModuleMappingSuggestion[] = [];
  const skippedSuggestions: ModuleMappingSuggestion[] = [];
  const appliedMappings = plan.suggestions.flatMap(suggestion => {
    if (!canApplySuggestion(suggestion, options)) {
      skippedSuggestions.push(suggestion);
      return [];
    }

    const mapping = saveModuleMapping({
      projectId: plan.projectId,
      datasetId: plan.datasetId,
      moduleName: suggestion.moduleName,
      sheetName: suggestion.sheetName,
      selectedColumns: suggestion.selectedColumns,
      semanticRoles: suggestion.semanticRoles,
    });
    appliedSuggestions.push(suggestion);
    return [mapping];
  });

  recordAcceptedSuggestions(plan.workspaceId, appliedSuggestions, appliedMappings);

  return {
    appliedMappings,
    skippedSuggestions,
    acceptedSuggestionIds: appliedSuggestions.map(suggestion => suggestion.id),
  };
}

export function ignoreSmartConfigurationPlan(plan: SmartConfigurationPlan, suggestionIds = plan.suggestions.map(suggestion => suggestion.id)): void {
  recordIgnoredSuggestions(plan.workspaceId, suggestionIds);
}
