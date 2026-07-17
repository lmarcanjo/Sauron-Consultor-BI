/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { StoryBuilder } from "./StoryBuilder";
import { storyTemplateEngine } from "./StoryTemplateEngine";
import { storyVersionEngine } from "./StoryVersionEngine";
import { storyApprovalEngine } from "./StoryApprovalEngine";
import { storyDiffEngine } from "./StoryDiffEngine";
import { storyPresentationEngine } from "./StoryPresentationEngine";
import { storyExportEngine } from "./StoryExportEngine";
import { storyEngine } from "./StoryEngine";

describe("Sauron Executive Story Suite", () => {
  it("StoryBuilder programmatically constructs stories correctly", () => {
    const story = new StoryBuilder("Planejamento Trimestral", "Q3 Performance", "custom")
      .addChapter("Faturamento", { objective: "Análise de faturamento" })
      .addIndicatorToChapter(0, "Meta Batida", "Sim")
      .addDecisionToChapter(0, "Aprovação de verba extra")
      .addActionToChapter(0, "Submeter DRE", "Carlos", "12/07/2026", "high")
      .addBlockToChapter(0, "kpi", "Faturamento", { value: "R$ 1.5M" })
      .build();

    expect(story.title).toBe("Planejamento Trimestral");
    expect(story.chapters.length).toBe(1);
    expect(story.chapters[0].title).toBe("Faturamento");
    expect(story.chapters[0].indicators[0].label).toBe("Meta Batida");
    expect(story.chapters[0].decisions[0]).toBe("Aprovação de verba extra");
    expect(story.chapters[0].actions[0].description).toBe("Submeter DRE");
    expect(story.chapters[0].actions[0].priority).toBe("high");
    expect(story.chapters[0].blocks[0].type).toBe("kpi");
  });

  it("StoryTemplateEngine creates structured stories from official templates", () => {
    const story = storyTemplateEngine.createStoryFromTemplate(
      "conselho",
      "Conselho Q2",
      "Fechamento Estratégico"
    );

    expect(story.templateId).toBe("conselho");
    expect(story.chapters.length).toBe(2);
    expect(story.chapters[0].title).toBe("Resultados Macro & EBITDA");
    expect(story.chapters[0].indicators.length).toBe(0);
    expect(story.chapters[1].title).toBe("Governança e ESG");
  });

  it("StoryApprovalEngine seals, hashes and freezes approved stories", () => {
    const story = storyTemplateEngine.createStoryFromTemplate(
      "financeiro",
      "Análise de Custos",
      "DRE Q2"
    );

    expect(story.isApproved).toBe(false);

    const approvedStory = storyApprovalEngine.approve(story, "Carlos Diretor");
    expect(approvedStory.isApproved).toBe(true);
    expect(approvedStory.approvedBy).toBe("Carlos Diretor");
    expect(approvedStory.approvalHash).toContain("SOP-SEAL-");
    expect(approvedStory.history.length).toBe(1);
    expect(approvedStory.history[0].version).toBe(1);

    // Prevent direct edits
    expect(() => storyApprovalEngine.approve(approvedStory, "Outro")).toThrow();
  });

  it("StoryVersionEngine tracks story history and restores past versions", () => {
    const story = storyTemplateEngine.createStoryFromTemplate(
      "comercial",
      "Funil Comercial",
      "Metas de Vendas"
    );

    const originalHash = "HASH_V1";
    const snapshot = storyVersionEngine.createSnapshot(story, "Consultor Alpha", originalHash);
    story.history.push(snapshot);

    // Modify active story
    story.title = "Funil Comercial Modificado";
    story.chapters[0].title = "Capítulo Modificado";
    story.version = 2;

    // Restore to version 1
    const restored = storyVersionEngine.restoreVersion(story, 1, "Carlos");
    expect(restored.title).toBe("Funil Comercial");
    expect(restored.chapters[0].title).toBe("Funil e Taxas de Conversão");
    expect(restored.version).toBe(3); // restoration bumped version
    expect(restored.history.length).toBe(2); // contains both original snapshot and the restore backup
  });

  it("StoryDiffEngine tracks delta changes between two snapshots", () => {
    const v1 = {
      title: "Story Original",
      subtitle: "Sub V1",
      version: 1,
      chapters: [
        {
          id: "ch1",
          title: "Vendas",
          objective: "Obj 1",
          evidence: "Evidência 1",
          conclusion: "Conc 1",
          indicators: [],
          decisions: ["Decisão Antiga"],
          actions: [],
          blocks: [],
        },
      ],
    };

    const v2 = {
      title: "Story Editado",
      subtitle: "Sub V1",
      version: 2,
      chapters: [
        {
          id: "ch1",
          title: "Vendas",
          objective: "Obj Novo", // Objective modified
          evidence: "Evidência 1",
          conclusion: "Conc 1",
          indicators: [],
          decisions: ["Decisão Antiga", "Decisão Nova"], // Added decision
          actions: [],
          blocks: [],
        },
        {
          id: "ch2",
          title: "Novo Capítulo", // Added chapter
          objective: "Obj 2",
          evidence: "Evidência 2",
          conclusion: "Conc 2",
          indicators: [],
          decisions: [],
          actions: [],
          blocks: [],
        },
      ],
    };

    const result = storyDiffEngine.diff(v1, v2);

    expect(result.titleChanged).toBe(true);
    expect(result.subtitleChanged).toBe(false);
    expect(result.addedChapters).toContain("Novo Capítulo");
    expect(result.modifiedChapters.length).toBe(1);
    expect(result.modifiedChapters[0].objectiveChanged).toBe(true);
    expect(result.modifiedChapters[0].addedDecisions).toContain("Decisão Nova");
  });

  it("StoryPresentationEngine records active session times and replay logs", () => {
    const session = storyPresentationEngine.startSession("story_abc");
    expect(session.storyId).toBe("story_abc");
    expect(session.events.length).toBe(1);
    expect(session.events[0].eventType).toBe("chapter_view");

    storyPresentationEngine.tick(session, 0, 10); // 10 seconds on chapter 0
    storyPresentationEngine.changeChapter(session, 0, 1);
    storyPresentationEngine.recordDecision(session, 1, "Nova Estratégia de Margem");
    storyPresentationEngine.recordAction(session, 1, "Executar DRE", "Carlos", "15/08");
    storyPresentationEngine.recordComment(session, 1, "Comentário importante", "CEO");

    expect(session.durationSeconds).toBe(10);
    expect(session.chapterTimes[0]).toBe(10);

    const ended = storyPresentationEngine.endSession(session);
    expect(ended.endTime).toBeDefined();
    expect(ended.events.length).toBe(5);
  });

  it("StoryExportEngine outputs correct offline bundles and deep-link tokens", () => {
    const story = storyTemplateEngine.createStoryFromTemplate(
      "financeiro",
      "DRE Geral",
      "Status de Despesas"
    );

    const html = storyExportEngine.exportToHtml(story);
    expect(html).toContain("DRE Geral");
    expect(html).toContain("Capítulo 1");

    const structure = storyExportEngine.exportToPptxStructure(story);
    expect(structure.slidesCount).toBe(2);
    expect(structure.slides[0].title).toBe("DRE Consolidado do Período");

    const tokenUrl = storyExportEngine.generateSecureViewerPayload(story);
    expect(tokenUrl).toContain("https://sauron-os.corp/viewer?token=");
  });

  it("StoryEngine registers, lists and duplicates stories", () => {
    const initialCount = storyEngine.getStories().length;
    expect(initialCount).toBeGreaterThan(0);

    const randomStory = storyTemplateEngine.createStoryFromTemplate(
      "operacoes",
      "Giro de Showroom",
      "Pós-Venda"
    );
    storyEngine.registerStory(randomStory);
    expect(storyEngine.getStories().length).toBe(initialCount + 1);

    const duplicated = storyEngine.duplicateStory(randomStory.id, "Giro Duplicado");
    expect(duplicated.title).toBe("Giro Duplicado");
    expect(storyEngine.getStories().length).toBe(initialCount + 2);
  });
});
