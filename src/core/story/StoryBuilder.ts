/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Story, StoryChapter, StoryBlock, StoryAction, StoryBlockType } from "./types";

export class StoryBuilder {
  private story: Story;

  constructor(title: string, subtitle: string, templateId: string = "custom") {
    const now = new Date().toISOString();
    this.story = {
      id: `story_${crypto.randomUUID().substring(0, 8)}`,
      title,
      subtitle,
      templateId,
      version: 1,
      isApproved: false,
      chapters: [],
      history: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  public setId(id: string): this {
    this.story.id = id;
    return this;
  }

  public addChapter(title: string, options: Partial<Omit<StoryChapter, "id" | "title" | "blocks" | "actions" | "decisions" | "indicators">> = {}): this {
    const chapter: StoryChapter = {
      id: `chapter_${crypto.randomUUID().substring(0, 8)}`,
      title,
      objective: options.objective || "Apresentar o status operacional do trimestre.",
      evidence: options.evidence || "Compilado direto do DRE consolidado.",
      conclusion: options.conclusion || "Gargalos de margem média identificados.",
      indicators: [],
      decisions: [],
      actions: [],
      blocks: [],
      notes: options.notes || "Notas do consultor para apresentação.",
    };
    this.story.chapters.push(chapter);
    return this;
  }

  public addIndicatorToChapter(chapterIndex: number, label: string, value: string, trend?: string, isPositive?: boolean): this {
    const chapter = this.story.chapters[chapterIndex];
    if (chapter) {
      chapter.indicators.push({ label, value, trend, isPositive });
    }
    return this;
  }

  public addDecisionToChapter(chapterIndex: number, description: string): this {
    const chapter = this.story.chapters[chapterIndex];
    if (chapter) {
      chapter.decisions.push(description);
    }
    return this;
  }

  public addActionToChapter(
    chapterIndex: number,
    description: string,
    responsible: string,
    deadline: string,
    priority: "high" | "medium" | "low" = "medium"
  ): this {
    const chapter = this.story.chapters[chapterIndex];
    if (chapter) {
      const action: StoryAction = {
        id: `action_${crypto.randomUUID().substring(0, 8)}`,
        description,
        responsible,
        deadline,
        priority,
        status: "pending",
      };
      chapter.actions.push(action);
    }
    return this;
  }

  public addBlockToChapter(chapterIndex: number, type: StoryBlockType, title?: string, content: any = {}): this {
    const chapter = this.story.chapters[chapterIndex];
    if (chapter) {
      const block: StoryBlock = {
        id: `block_${crypto.randomUUID().substring(0, 8)}`,
        type,
        title,
        content,
      };
      chapter.blocks.push(block);
    }
    return this;
  }

  public build(): Story {
    this.story.updatedAt = new Date().toISOString();
    return this.story;
  }
}
