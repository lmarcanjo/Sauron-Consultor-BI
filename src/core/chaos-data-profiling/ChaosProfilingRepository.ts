import type { ChaosSourceProfile, DatasetView, SuggestionStatus } from "./ChaosDataTypes";

export interface ChaosConsultantDecision {
  decisionId: string;
  profileId: string;
  sourceId: string;
  targetType: "BLOCK" | "COLUMN" | "SUGGESTION";
  targetId: string;
  action: SuggestionStatus | "DISPLAY_LABEL";
  displayLabel?: string;
  actorId: string;
  updatedAt: string;
}

import type { ZcxProposal } from "./ZcxTypes";

interface ChaosProfilingState {
  profiles: Record<string, ChaosSourceProfile>;
  latestProfileBySource: Record<string, string>;
  decisions: Record<string, ChaosConsultantDecision>;
  views: Record<string, DatasetView>;
  proposals: Record<string, ZcxProposal>;
}

const STORAGE_KEY = "sauron_chaos_profiling_repository_v1";
const memoryState: ChaosProfilingState = { profiles: {}, latestProfileBySource: {}, decisions: {}, views: {}, proposals: {} };
const listeners = new Set<() => void>();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function canUseStorage(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function emptyState(): ChaosProfilingState {
  return { profiles: {}, latestProfileBySource: {}, decisions: {}, views: {}, proposals: {} };
}

function readState(): ChaosProfilingState {
  if (!canUseStorage()) return clone(memoryState);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
  } catch {
    return emptyState();
  }
}

function writeState(next: ChaosProfilingState): void {
  const safe = clone(next);
  memoryState.profiles = safe.profiles;
  memoryState.latestProfileBySource = safe.latestProfileBySource;
  memoryState.decisions = safe.decisions;
  memoryState.views = safe.views;
  if (canUseStorage()) localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  listeners.forEach(listener => listener());
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("SAURON_CHAOS_PROFILING_UPDATED"));
}

export class ChaosProfilingRepository {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  async saveProfile(profile: ChaosSourceProfile): Promise<void> {
    const state = readState();
    state.profiles[profile.profileId] = clone(profile);
    state.latestProfileBySource[profile.sourceId] = profile.profileId;
    writeState(state);
  }

  async getProfile(sourceId: string): Promise<ChaosSourceProfile | null> {
    const state = readState();
    const profileId = state.latestProfileBySource[sourceId];
    return profileId && state.profiles[profileId] ? clone(state.profiles[profileId]) : null;
  }

  async getProfileById(profileId: string): Promise<ChaosSourceProfile | null> {
    const profile = readState().profiles[profileId];
    return profile ? clone(profile) : null;
  }

  async listProfiles(sourceId?: string): Promise<ChaosSourceProfile[]> {
    const profiles = Object.values(readState().profiles);
    return clone(sourceId ? profiles.filter(profile => profile.sourceId === sourceId) : profiles);
  }

  async saveDecision(decision: ChaosConsultantDecision): Promise<void> {
    const state = readState();
    state.decisions[decision.decisionId] = clone(decision);
    writeState(state);
  }

  async listDecisions(profileId: string): Promise<ChaosConsultantDecision[]> {
    return clone(Object.values(readState().decisions).filter(decision => decision.profileId === profileId));
  }

  async updateBlockStatus(profileId: string, blockId: string, status: SuggestionStatus, actorId: string): Promise<ChaosSourceProfile | null> {
    const state = readState();
    const current = state.profiles[profileId];
    if (!current) return null;
    const updated = clone(current);
    updated.detectedBlocks = updated.detectedBlocks.map(block => block.blockId === blockId ? { ...block, status } : block);
    updated.updatedAt = new Date().toISOString();
    state.profiles[profileId] = updated;
    state.latestProfileBySource[updated.sourceId] = updated.profileId;
    const decision: ChaosConsultantDecision = {
      decisionId: `decision_${profileId}_${blockId}_${Date.now()}`,
      profileId,
      sourceId: updated.sourceId,
      targetType: "BLOCK",
      targetId: blockId,
      action: status,
      actorId,
      updatedAt: updated.updatedAt,
    };
    state.decisions[decision.decisionId] = decision;
    writeState(state);
    return clone(updated);
  }

  async updateSuggestionStatus(profileId: string, suggestionId: string, status: SuggestionStatus, actorId: string, displayLabel?: string): Promise<ChaosSourceProfile | null> {
    const state = readState();
    const current = state.profiles[profileId];
    if (!current) return null;
    const updated = clone(current);
    updated.semanticSuggestions = updated.semanticSuggestions.map(suggestion => suggestion.id === suggestionId ? { ...suggestion, status, suggestedLabel: displayLabel || suggestion.suggestedLabel } : suggestion);
    updated.updatedAt = new Date().toISOString();
    state.profiles[profileId] = updated;
    state.latestProfileBySource[updated.sourceId] = updated.profileId;
    const decision: ChaosConsultantDecision = {
      decisionId: `decision_${profileId}_${suggestionId}_${Date.now()}`,
      profileId,
      sourceId: updated.sourceId,
      targetType: "SUGGESTION",
      targetId: suggestionId,
      action: displayLabel ? "DISPLAY_LABEL" : status,
      displayLabel,
      actorId,
      updatedAt: updated.updatedAt,
    };
    state.decisions[decision.decisionId] = decision;
    writeState(state);
    return clone(updated);
  }

  async saveView(view: DatasetView): Promise<void> {
    const state = readState();
    state.views[view.datasetViewId] = clone(view);
    writeState(state);
  }

  async getView(datasetViewId: string): Promise<DatasetView | null> {
    const view = readState().views[datasetViewId];
    return view ? clone(view) : null;
  }

  async listViews(sourceId?: string): Promise<DatasetView[]> {
    const views = Object.values(readState().views);
    return clone(sourceId ? views.filter(view => view.sourceId === sourceId) : views);
  }

  async getLatestDraft(sourceId: string): Promise<DatasetView | null> {
    const views = await this.listViews(sourceId);
    return views.filter(view => view.status === "DRAFT").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] || null;
  }

  async getConfirmedView(sourceId: string): Promise<DatasetView | null> {
    const views = await this.listViews(sourceId);
    return views.filter(view => view.status === "CONFIRMED").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] || null;
  }

  /** Synchronous read for shell readiness; persistence remains owned here. */
  getConfirmedViewSync(sourceId: string): DatasetView | null {
    const views = Object.values(readState().views);
    return clone(views
      .filter(view => view.sourceId === sourceId && view.status === "CONFIRMED")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] || null);
  }

  async saveProposal(proposal: ZcxProposal): Promise<void> {
    const state = readState();
    if (!state.proposals) state.proposals = {};
    state.proposals[proposal.proposalId] = clone(proposal);
    writeState(state);
  }

  async getProposal(proposalId: string): Promise<ZcxProposal | null> {
    const proposals = readState().proposals || {};
    const proposal = proposals[proposalId];
    return proposal ? clone(proposal) : null;
  }

  async getLatestProposal(sourceId: string): Promise<ZcxProposal | null> {
    const proposals = Object.values(readState().proposals || {});
    return clone(proposals
      .filter(p => p.sourceId === sourceId && p.status !== "SUPERSEDED")
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0] || null);
  }

  clear(): void {
    writeState(emptyState());
    if (canUseStorage()) localStorage.removeItem(STORAGE_KEY);
  }
}

export const chaosProfilingRepository = new ChaosProfilingRepository();
