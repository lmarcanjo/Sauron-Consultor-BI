/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { closeBlockingPanels, ensureConsultantSession, navigateSidebar, test, expect, Page } from "./e2eTest";

// Helper para certificar a ausência de tela branca
async function assertNoWhiteScreen(page: Page, stepLabel: string) {
  const root = page.locator("#root");
  await expect(root).toBeAttached({ timeout: 15000 });
  await expect.poll(async () => {
    const content = await root.innerText().catch(() => "");
    return content.trim().length;
  }, { timeout: 15000, message: `White screen detected on step: ${stepLabel}` }).toBeGreaterThan(0);
  const content = await root.innerText();
  
  // O root não deve estar vazio ou contendo apenas quebras
  expect(content.trim().length, `White screen detected on step: ${stepLabel}`).toBeGreaterThan(0);
  
  // O main ou sidebar ou contêiner de erro do fallback de boundary deve existir
  const main = page.locator("main");
  const sidebar = page.locator("aside, .sidebar, [class*='sidebar']");
  const errorBoundaryFallback = page.locator("text=Não foi possível carregar esta área");
  
  const hasSidebarOrError = (await sidebar.count()) > 0 || (await errorBoundaryFallback.count()) > 0 || (await main.count()) > 0;
  expect(hasSidebarOrError, `No layout containers found on step: ${stepLabel}`).toBe(true);
}

test.describe("Sauron OS — Full Navigation Runtime Certification", () => {
  let consoleErrors: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on("pageerror", (err) => {
      consoleErrors.push(`[PageError] ${err.message}\nStack: ${err.stack}`);
    });
    page.on("console", (msg) => {
      const text = msg.text();
      if (msg.type() === "error" && !text.includes("React DevTools")) {
        consoleErrors.push(`[ConsoleError] ${text}`);
      }
    });
  });

  test("Cenário 1 a 7 — Onboarding, Login, Navegação de Abas e Coerência de Contexto", async ({ page }) => {
    // 1. Acessa Sauron
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await assertNoWhiteScreen(page, "Boot inicial");

    await ensureConsultantSession(page);
    await assertNoWhiteScreen(page, "Painel Principal pós login");

    const tabsToNavigate = [
      { group: /Centro de Comando/i, item: /Empresas e Grupos/i, name: "Empresas e Grupos" },
      { group: /Centro de Comando/i, item: /Centro de Comando/i, name: "Centro de Comando" },
      { group: /Conhecer Cliente/i, item: /Projetos de Consultoria/i, name: "Projetos de Consultoria" },
      { group: /Fontes/i, item: /Fontes de Dados/i, name: "Fontes de Dados" },
      { group: /Análise/i, item: /Análise da fonte/i, name: "Análise da fonte" },
      { group: /Análise/i, item: /Visão Executiva/i, name: "Visão Executiva" },
      { group: /Decisão/i, item: /Apresentações/i, name: "Apresentações" },
      { group: /Reunião/i, item: /Preparação da Reunião/i, name: "Preparação da Reunião" },
      { group: /Reunião/i, item: /Sessão Executiva/i, name: "Sessão Executiva" },
      { group: /Reunião/i, item: /Ata e Decisões/i, name: "Ata e Decisões" },
      { group: /Acompanhamento/i, item: /Plano Executivo/i, name: "Plano Executivo" },
      { group: /Acompanhamento/i, item: /Histórico/i, name: "Histórico" },
      { group: /Acompanhamento/i, item: /Evolução/i, name: "Evolução" },
      { group: /Administração/i, item: /Configurações/i, name: "Configurações" }
    ];

    for (const tab of tabsToNavigate) {
      console.log(`Navegando para aba: ${tab.name}`);
      await navigateSidebar(page, tab.group, tab.item);
      await page.waitForTimeout(250);
      await assertNoWhiteScreen(page, `Aba: ${tab.name}`);
      await closeBlockingPanels(page);
    }

    // 5. Executa logout e confirma o redirecionamento
    const logoutBtn = page.locator("text=Sair", { hasText: "Sair" }).first();
    if (await logoutBtn.count() > 0 && await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator("input[placeholder='E-mail']")).toBeVisible();
    }

    // 6. Confirma ausência total de exceções no console
    if (consoleErrors.length > 0) {
      console.error("Erros detectados no console durante o teste de navegação:");
      console.error(consoleErrors.join("\n"));
    }
    expect(consoleErrors).toEqual([]);
  });
});
