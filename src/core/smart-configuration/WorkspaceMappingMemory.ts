import {
  WORKSPACE_REGISTRY_STORAGE_KEY,
  workspaceIntelligenceEngine,
  Workspace,
  WorkspaceRegistryState,
} from "../workspace-intelligence";
import { ModuleFieldMapping, ModuleName } from "../data/moduleMapping";
import {
  ModuleMappingSuggestion,
  WorkspaceModuleMappingMemory,
} from "./SmartConfigurationTypes";

function canUseLocalStorage(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function readRegistry(): WorkspaceRegistryState {
  const current = workspaceIntelligenceEngine.getWorkspaceRegistry();
  if (!canUseLocalStorage()) return current;

  try {
    const raw = localStorage.getItem(WORKSPACE_REGISTRY_STORAGE_KEY);
    return raw ? { ...current, ...JSON.parse(raw) } : current;
  } catch {
    return current;
  }
}

function writeRegistry(registry: WorkspaceRegistryState): void {
  const next: WorkspaceRegistryState = {
    ...registry,
    updatedAt: new Date().toISOString(),
  };
  if (canUseLocalStorage()) {
    localStorage.setItem(WORKSPACE_REGISTRY_STORAGE_KEY, JSON.stringify(next));
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("SAURON_WORKSPACE_REGISTRY_UPDATED", { detail: next }));
  }
}

function getWorkspace(workspaceId?: string): Workspace | null {
  const registry = readRegistry();
  const id = workspaceId || registry.currentWorkspaceId;
  return id ? registry.workspaces[id] || null : null;
}

function updateWorkspace(workspaceId: string, update: (workspace: Workspace) => Workspace): Workspace | null {
  const registry = readRegistry();
  const current = registry.workspaces[workspaceId];
  if (!current) return null;
  const next = update(current);
  registry.workspaces[workspaceId] = next;
  registry.currentWorkspaceId = workspaceId;
  writeRegistry(registry);
  return next;
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

function mappingToMemory(mapping: ModuleFieldMapping, suggestionId?: string): WorkspaceModuleMappingMemory {
  return {
    moduleName: mapping.moduleName,
    sheetName: mapping.sheetName,
    selectedColumns: mapping.selectedColumns,
    semanticRoles: mapping.semanticRoles,
    sourceSuggestionId: suggestionId,
    updatedAt: new Date().toISOString(),
  };
}

export function getCurrentWorkspaceMappingMemory(): Record<string, WorkspaceModuleMappingMemory> {
  const workspace = getWorkspace();
  return (workspace?.lastMappingsByModule || {}) as Record<string, WorkspaceModuleMappingMemory>;
}

export function getWorkspaceModuleMemory(workspaceId: string | undefined, moduleName: ModuleName): WorkspaceModuleMappingMemory | null {
  const workspace = getWorkspace(workspaceId);
  return (workspace?.lastMappingsByModule?.[moduleName] as WorkspaceModuleMappingMemory | undefined) || null;
}

export function isSuggestionIgnored(workspaceId: string | undefined, suggestionId: string): boolean {
  const workspace = getWorkspace(workspaceId);
  return !!workspace?.ignoredSuggestions?.includes(suggestionId);
}

export function recordAcceptedSuggestions(
  workspaceId: string | undefined,
  suggestions: ModuleMappingSuggestion[],
  mappings: ModuleFieldMapping[],
): void {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return;

  const suggestionByModule = new Map(suggestions.map(suggestion => [suggestion.moduleName, suggestion]));
  updateWorkspace(workspace.id, current => {
    const nextMemory = { ...(current.lastMappingsByModule || {}) };
    mappings.forEach(mapping => {
      const suggestion = suggestionByModule.get(mapping.moduleName);
      nextMemory[mapping.moduleName] = mappingToMemory(mapping, suggestion?.id);
    });

    const acceptedIds = unique([
      ...(current.acceptedSuggestions || []),
      ...suggestions.map(suggestion => suggestion.id),
    ]);
    const acceptedSet = new Set(acceptedIds);

    return {
      ...current,
      lastMappingsByModule: nextMemory,
      acceptedSuggestions: acceptedIds,
      ignoredSuggestions: (current.ignoredSuggestions || []).filter(id => !acceptedSet.has(id)),
      updatedAt: new Date().toISOString(),
    };
  });
}

export function recordIgnoredSuggestions(workspaceId: string | undefined, suggestionIds: string[]): void {
  const workspace = getWorkspace(workspaceId);
  if (!workspace || suggestionIds.length === 0) return;

  updateWorkspace(workspace.id, current => {
    const accepted = new Set(current.acceptedSuggestions || []);
    return {
      ...current,
      ignoredSuggestions: unique([
        ...(current.ignoredSuggestions || []),
        ...suggestionIds.filter(id => !accepted.has(id)),
      ]),
      updatedAt: new Date().toISOString(),
    };
  });
}
