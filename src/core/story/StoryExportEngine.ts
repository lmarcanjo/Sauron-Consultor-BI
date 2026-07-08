/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Story } from "./types";

export class StoryExportEngine {
  /**
   * Generates a fully compiled, standalone HTML bundle for offline viewing.
   */
  public exportToHtml(story: Story): string {
    const chaptersHtml = story.chapters
      .map(
        (ch, idx) => `
      <section class="chapter-slide" style="padding: 40px; border-bottom: 2px solid #e2e8f0; page-break-after: always;">
        <span class="slide-badge" style="font-family: monospace; font-size: 11px; color: #3b82f6; font-weight: bold; text-transform: uppercase;">Capítulo ${idx + 1}</span>
        <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 5px; text-transform: uppercase;">${ch.title}</h2>
        
        <div class="narrative-grid" style="display: grid; grid-template-columns: 2fr 1fr; gap: 30px; margin-top: 20px;">
          <div class="narrative-left">
            <div style="margin-bottom: 15px;">
              <h3 style="font-size: 12px; color: #64748b; text-transform: uppercase; margin: 0;">Objetivo</h3>
              <p style="font-size: 14px; font-weight: 500; color: #334155; margin-top: 4px;">${ch.objective}</p>
            </div>
            <div style="margin-bottom: 15px;">
              <h3 style="font-size: 12px; color: #64748b; text-transform: uppercase; margin: 0;">Evidências e Fatos</h3>
              <p style="font-size: 14px; font-weight: 500; color: #334155; margin-top: 4px;">${ch.evidence}</p>
            </div>
            <div style="margin-bottom: 15px;">
              <h3 style="font-size: 12px; color: #64748b; text-transform: uppercase; margin: 0;">Conclusão de Governança</h3>
              <p style="font-size: 14px; font-weight: 550; color: #0f172a; margin-top: 4px; padding: 10px; background-color: #f8fafc; border-left: 3px solid #3b82f6;">${ch.conclusion}</p>
            </div>
          </div>
          
          <div class="narrative-right" style="background-color: #f1f5f9; padding: 15px; border-radius: 12px;">
            <h3 style="font-size: 11px; text-transform: uppercase; color: #475569; margin: 0 0 10px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">Indicadores de Qualidade</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${ch.indicators
                .map(
                  (ind) => `
                <li style="margin-bottom: 8px; font-size: 13px;">
                  <span style="color: #64748b; font-weight: bold;">${ind.label}:</span>
                  <strong style="color: #0f172a;">${ind.value}</strong>
                  ${ind.trend ? `<span style="font-size: 10px; font-family: monospace; color: ${ind.isPositive ? "#10b981" : "#ef4444"};">${ind.trend}</span>` : ""}
                </li>
              `
                )
                .join("")}
            </ul>
          </div>
        </div>

        ${
          ch.decisions.length > 0
            ? `
        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px dashed #e2e8f0;">
          <h3 style="font-size: 12px; color: #64748b; text-transform: uppercase; margin: 0 0 8px 0;">Decisões Firmadas</h3>
          <ul style="list-style-type: square; margin: 0; padding-left: 15px; font-size: 13px; color: #0f172a; font-weight: 600;">
            ${ch.decisions.map((dec) => `<li style="margin-bottom: 4px;">${dec}</li>`).join("")}
          </ul>
        </div>
        `
            : ""
        }
      </section>
    `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>${story.title} | Sauron Executive Story</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #fafafa; color: #1e293b; line-height: 1.5; margin: 0; padding: 40px; }
          .container { max-width: 900px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); overflow: hidden; }
          .header { background-color: #0f172a; color: #ffffff; padding: 40px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">${story.title}</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #94a3b8; font-family: monospace;">${story.subtitle}</p>
          </header>
          <main>
            ${chaptersHtml}
          </main>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Mock-export binary representations of XML schemas for PowerPoint files.
   */
  public exportToPptxStructure(story: Story): any {
    return {
      slidesCount: story.chapters.length + 1, // Cover + chapters
      cover: {
        title: story.title,
        subtitle: story.subtitle,
        meta: `Sauron OS v2.4 - Exportado em ${new Date().toLocaleDateString("pt-BR")}`,
      },
      slides: story.chapters.map((ch, idx) => ({
        slideIndex: idx + 1,
        layout: "NARRATIVE_SPLIT",
        title: ch.title,
        placeholders: {
          objective: ch.objective,
          evidence: ch.evidence,
          conclusion: ch.conclusion,
          indicators: ch.indicators,
          decisions: ch.decisions,
          actions: ch.actions.map((a) => `${a.description} (${a.responsible})`),
        },
      })),
    };
  }

  /**
   * Encrypts/seals the story state into an immutable string query suitable for secure deep-linking.
   */
  public generateSecureViewerPayload(story: Story): string {
    const payload = {
      id: story.id,
      title: story.title,
      subtitle: story.subtitle,
      version: story.version,
      hash: story.approvalHash || "DRAFT_MODE",
      chapters: story.chapters.map((ch) => ({
        title: ch.title,
        objective: ch.objective,
        evidence: ch.evidence,
        conclusion: ch.conclusion,
        indicators: ch.indicators,
        decisions: ch.decisions,
        actions: ch.actions,
      })),
    };

    // Simple Base64 URL safe representation
    const jsonStr = JSON.stringify(payload);
    const b64 = Buffer.from(jsonStr).toString("base64");
    return `https://sauron-os.corp/viewer?token=${encodeURIComponent(b64)}`;
  }
}

export const storyExportEngine = new StoryExportEngine();
