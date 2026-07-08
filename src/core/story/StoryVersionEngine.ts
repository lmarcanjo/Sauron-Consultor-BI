/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Story, StoryVersion } from "./types";

export class StoryVersionEngine {
  /**
   * Helper to deep clone an object to prevent reference leakage.
   */
  public deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Creates a historical snapshot of the current story state and appends it to the history list.
   */
  public createSnapshot(story: Story, author: string, hash: string): StoryVersion {
    const snapshot: StoryVersion = {
      version: story.version,
      timestamp: new Date().toISOString(),
      author,
      hash,
      chapters: this.deepClone(story.chapters),
      title: story.title,
      subtitle: story.subtitle,
    };
    return snapshot;
  }

  /**
   * Restores a past story version from history, bumping the main story version.
   */
  public restoreVersion(story: Story, targetVersionNumber: number, author: string): Story {
    const historical = story.history.find((v) => v.version === targetVersionNumber);
    if (!historical) {
      throw new Error(`Versão ${targetVersionNumber} não foi localizada no histórico desta narrativa.`);
    }

    // Capture current as snapshot first before restoring so we don't lose active edits
    const currentHash = `hash_restore_backup_${crypto.randomUUID().substring(0, 5)}`;
    const backupSnapshot = this.createSnapshot(story, author, currentHash);
    story.history.push(backupSnapshot);

    // Restore state
    story.title = historical.title;
    story.subtitle = historical.subtitle;
    story.chapters = this.deepClone(historical.chapters);
    story.isApproved = false; // Restored state starts as draft
    story.version = Math.max(...story.history.map((h) => h.version), story.version) + 1;
    story.updatedAt = new Date().toISOString();

    return story;
  }
}

export const storyVersionEngine = new StoryVersionEngine();
