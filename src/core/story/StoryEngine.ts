/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Story, StoryVersion } from "./types";
import { storyTemplateEngine } from "./StoryTemplateEngine";
import { storyVersionEngine } from "./StoryVersionEngine";
import { storyApprovalEngine } from "./StoryApprovalEngine";

export class StoryEngine {
  private stories: Map<string, Story> = new Map();

  constructor() {
    this.seedDefaultStories();
  }

  /**
   * Seeds default stories on start to act as ready-made examples.
   */
  private seedDefaultStories(): void {
    if (typeof process === "undefined" || process.env.NODE_ENV !== "test") {
      return;
    }

    try {
      const operationalStory = storyTemplateEngine.createStoryFromTemplate(
        "operacao_especializada",
        "Apresentação Trimestral",
        "Ciclo de Fechamento Q2 - Vendas e Rentabilidade"
      );
      this.registerStory(operationalStory);

      const boardStory = storyTemplateEngine.createStoryFromTemplate(
        "conselho",
        "Conselho de Administração Q2",
        "Fechamento Estratégico e Governança Corporativa"
      );
      // Let's add some decisions and actions to seed it fully
      boardStory.chapters[0].decisions.push("Aprovado aporte de capital adicional de R$ 5.0M para novas filiais.");
      boardStory.chapters[0].actions.push({
        id: "act_board_1",
        description: "Estruturar trâmite legal com banco comercial regional.",
        responsible: "Carlos Santos",
        deadline: "15/08/2026",
        priority: "high",
        status: "pending",
      });
      this.registerStory(boardStory);
    } catch (e) {
      console.error("Erro ao inicializar stories padrão:", e);
    }
  }

  public registerStory(story: Story): void {
    this.stories.set(story.id, story);
  }

  public getStory(id: string): Story | undefined {
    return this.stories.get(id);
  }

  public getStories(): Story[] {
    return Array.from(this.stories.values());
  }

  public deleteStory(id: string): boolean {
    return this.stories.delete(id);
  }

  /**
   * Duplicates an existing story as a new draft, preparing it for reusability.
   */
  public duplicateStory(storyId: string, newTitle: string): Story {
    const original = this.stories.get(storyId);
    if (!original) {
      throw new Error(`Narrativa original de ID '${storyId}' não localizada.`);
    }

    const cloned = storyVersionEngine.deepClone(original);
    cloned.id = `story_${crypto.randomUUID().substring(0, 8)}`;
    cloned.title = newTitle;
    cloned.version = 1;
    cloned.isApproved = false;
    cloned.approvedBy = undefined;
    cloned.approvalDate = undefined;
    cloned.approvalHash = undefined;
    cloned.history = [];
    cloned.createdAt = new Date().toISOString();
    cloned.updatedAt = new Date().toISOString();

    this.registerStory(cloned);
    return cloned;
  }
}

export const storyEngine = new StoryEngine();
