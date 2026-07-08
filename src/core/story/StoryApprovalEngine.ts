/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Story } from "./types";
import { storyVersionEngine } from "./StoryVersionEngine";

export class StoryApprovalEngine {
  /**
   * Deterministic simple hashing algorithm to seal content mathematically.
   */
  public generateDeterministicHash(story: Story): string {
    const serializedPayload = JSON.stringify({
      title: story.title,
      subtitle: story.subtitle,
      chaptersCount: story.chapters.length,
      chapters: story.chapters.map((ch) => ({
        title: ch.title,
        objective: ch.objective,
        decisionsCount: ch.decisions.length,
        actionsCount: ch.actions.length,
        indicatorsCount: ch.indicators.length,
        blocksCount: ch.blocks.length,
      })),
    });

    let hash = 0;
    for (let i = 0; i < serializedPayload.length; i++) {
      const char = serializedPayload.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }

    return `SOP-SEAL-${Math.abs(hash).toString(16).toUpperCase()}-${story.version}`;
  }

  /**
   * Approves a story, seals it with a hash, bumps the version index, and freezes changes.
   */
  public approve(story: Story, approvedBy: string): Story {
    if (story.isApproved) {
      throw new Error("Esta narrativa executiva já está selada e aprovada.");
    }

    const hash = this.generateDeterministicHash(story);
    story.isApproved = true;
    story.approvedBy = approvedBy;
    story.approvalDate = new Date().toISOString();
    story.approvalHash = hash;

    // Create deep snapshot for the history timeline
    const snapshot = storyVersionEngine.createSnapshot(story, approvedBy, hash);
    story.history.push(snapshot);

    console.log(`[Sauron Audit] STORY_APPROVED - Narrative '${story.title}' (ID: ${story.id}) approved by ${approvedBy}. Hash: ${hash}`);

    return story;
  }

  /**
   * Unfreezes (re-opens) a story for editing as a new draft, bumping the active version.
   */
  public reopenAsDraft(story: Story): Story {
    story.isApproved = false;
    story.approvedBy = undefined;
    story.approvalDate = undefined;
    story.approvalHash = undefined;
    story.version += 1;
    story.updatedAt = new Date().toISOString();
    return story;
  }
}

export const storyApprovalEngine = new StoryApprovalEngine();
