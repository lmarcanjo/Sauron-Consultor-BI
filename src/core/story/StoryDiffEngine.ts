/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Story, StoryDiffResult, StoryChapter, StoryVersion } from "./types";

export class StoryDiffEngine {
  /**
   * Compares two specific versions of a story.
   */
  public diffVersions(story: Story, versionFromNum: number, versionToNum: number): StoryDiffResult {
    const fromVersion = story.history.find((v) => v.version === versionFromNum);
    const toVersion = story.history.find((v) => v.version === versionToNum);

    if (!fromVersion || !toVersion) {
      throw new Error(`Incapaz de computar diff: Versões de origem (${versionFromNum}) ou destino (${versionToNum}) não localizadas.`);
    }

    return this.diff(fromVersion, toVersion);
  }

  /**
   * General diff function comparing two story snapshots (or versions).
   */
  public diff(fromSnapshot: { title: string; subtitle: string; version: number; chapters: StoryChapter[] }, toSnapshot: { title: string; subtitle: string; version: number; chapters: StoryChapter[] }): StoryDiffResult {
    const addedChapters: string[] = [];
    const removedChapters: string[] = [];
    const modifiedChapters: StoryDiffResult["modifiedChapters"] = [];

    const fromChaptersMap = new Map(fromSnapshot.chapters.map((ch) => [ch.id, ch]));
    const toChaptersMap = new Map(toSnapshot.chapters.map((ch) => [ch.id, ch]));

    // Find added & modified
    toSnapshot.chapters.forEach((toCh) => {
      const fromCh = fromChaptersMap.get(toCh.id);
      if (!fromCh) {
        addedChapters.push(toCh.title);
      } else {
        const objectiveChanged = fromCh.objective !== toCh.objective;
        const evidenceChanged = fromCh.evidence !== toCh.evidence;
        const conclusionChanged = fromCh.conclusion !== toCh.conclusion;

        // Decisions diff
        const fromDecisions = new Set(fromCh.decisions);
        const toDecisions = new Set(toCh.decisions);
        const addedDecisions = toCh.decisions.filter((d) => !fromDecisions.has(d));
        const removedDecisions = fromCh.decisions.filter((d) => !toDecisions.has(d));

        // Actions diff
        const fromActionsMap = new Map(fromCh.actions.map((a) => [a.description, a]));
        const toActionsMap = new Map(toCh.actions.map((a) => [a.description, a]));
        const addedActions = toCh.actions.filter((a) => !fromActionsMap.has(a.description)).map((a) => a.description);
        const removedActions = fromCh.actions.filter((a) => !toActionsMap.has(a.description)).map((a) => a.description);

        // Blocks diff (compare by block type/title)
        const fromBlocksKeys = new Set(fromCh.blocks.map((b) => `${b.type}:${b.title || ""}`));
        const toBlocksKeys = new Set(toCh.blocks.map((b) => `${b.type}:${b.title || ""}`));
        const addedBlocks = toCh.blocks
          .filter((b) => !fromBlocksKeys.has(`${b.type}:${b.title || ""}`))
          .map((b) => b.title || b.type);
        const removedBlocks = fromCh.blocks
          .filter((b) => !toBlocksKeys.has(`${b.type}:${b.title || ""}`))
          .map((b) => b.title || b.type);

        const hasChanges =
          objectiveChanged ||
          evidenceChanged ||
          conclusionChanged ||
          addedDecisions.length > 0 ||
          removedDecisions.length > 0 ||
          addedActions.length > 0 ||
          removedActions.length > 0 ||
          addedBlocks.length > 0 ||
          removedBlocks.length > 0;

        if (hasChanges) {
          modifiedChapters.push({
            chapterId: toCh.id,
            title: toCh.title,
            objectiveChanged,
            evidenceChanged,
            conclusionChanged,
            addedDecisions,
            removedDecisions,
            addedActions,
            removedActions,
            addedBlocks,
            removedBlocks,
          });
        }
      }
    });

    // Find removed
    fromSnapshot.chapters.forEach((fromCh) => {
      if (!toChaptersMap.has(fromCh.id)) {
        removedChapters.push(fromCh.title);
      }
    });

    return {
      titleChanged: fromSnapshot.title !== toSnapshot.title,
      subtitleChanged: fromSnapshot.subtitle !== toSnapshot.subtitle,
      versionFrom: fromSnapshot.version,
      versionTo: toSnapshot.version,
      addedChapters,
      removedChapters,
      modifiedChapters,
    };
  }
}

export const storyDiffEngine = new StoryDiffEngine();
