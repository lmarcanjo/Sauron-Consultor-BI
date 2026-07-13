/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, expect, Page } from "@playwright/test";

// Helper para certificar a ausência de tela branca
async function assertNoWhiteScreen(page: Page, stepLabel: string) {
  const root = page.locator("#root");
  await expect(root).toBeVisible({ timeout: 5000 });
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

    // 2. Identifica Onboarding de primeiro Super Admin ou tela de Login Normal
    const isFirstAccess = await page.locator("text=Criar primeiro Super Admin").count() > 0;

    if (isFirstAccess) {
      // Registrar primeiro Super Admin
      await page.fill("input[placeholder='Nome completo']", "Super Admin E2E");
      await page.fill("input[placeholder='E-mail corporativo']", "superadmin@sauron.com.br");
      await page.fill("input[placeholder='Senha secreta (mínimo 6 caracteres)']", "SenhaSuperSecreta123");
      await page.fill("input[placeholder='Confirmar senha']", "SenhaSuperSecreta123");
      await page.fill("input[placeholder='Nome da sua consultoria / organização']", "Consultoria Alpha E2E");
      
      await page.click("button:has-text('Inicializar Super Admin & Iniciar')");
    } else {
      // Efetua login normal
      await page.fill("input[placeholder='E-mail']", "superadmin@sauron.com.br");
      await page.fill("input[placeholder='Senha']", "SenhaSuperSecreta123");
      await page.click("button:has-text('Entrar no Sauron')");
    }

    // Aguarda o carregamento do workspace principal
    await page.waitForTimeout(2000);
    await assertNoWhiteScreen(page, "Painel Principal pós login");

    // Mapeamento dos botões de abas na sidebar que queremos testar
    // (Utilizando seletores flexíveis baseados em texto e IDs)
    const tabsToNavigate = [
      { name: "Executive Center", selector: "text=Enterprise Center" },
      { name: "Centro de Comando", selector: "text=Centro de Comando" },
      { name: "Gêmeo Digital", selector: "text=Gêmeo Digital" },
      { name: "Projetos de Consultoria", selector: "text=Projetos de Consultoria" },
      { name: "Central de Dados", selector: "text=Central de Dados" },
      { name: "Biblioteca de Workbooks", selector: "text=Biblioteca de Workbooks" },
      { name: "Diagnóstico Executivo", selector: "text=Diagnóstico Executivo" },
      { name: "KPIs & DRE", selector: "text=KPIs & DRE" },
      { name: "Anomalias", selector: "text=Anomalias" },
      { name: "Recomendações", selector: "text=Recomendações" },
      { name: "Dossiês", selector: "text=Dossiês" },
      { name: "Narrativa Executiva", selector: "text=Narrativa Executiva" },
      { name: "Decks", selector: "text=Decks" },
      { name: "Templates", selector: "text=Templates" },
      { name: "Preparação da Reunião", selector: "text=Preparação da Reunião" },
      { name: "Sessão Executiva", selector: "text=Sessão Executiva" },
      { name: "Ata & Decisões", selector: "text=Ata & Decisões" },
      { name: "Notas", selector: "text=Notas" },
      { name: "Plano Executivo", selector: "text=Plano Executivo" },
      { name: "Responsáveis & Prazos", selector: "text=Responsáveis & Prazos" },
      { name: "People Intelligence", selector: "text=People Intelligence" },
      { name: "Histórico", selector: "text=Histórico" },
      { name: "Comparativos", selector: "text=Comparativos" },
      { name: "Evolução", selector: "text=Evolução" },
      { name: "Configurações", selector: "text=Configurações" }
    ];

    for (const tab of tabsToNavigate) {
      console.log(`Navegando para aba: ${tab.name}`);
      const btn = page.locator(tab.selector).first();
      
      // Se o botão for visível, clica e valida
      if (await btn.count() > 0 && await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(400); // tempo de transição da aba
        await assertNoWhiteScreen(page, `Aba: ${tab.name}`);
      } else {
        console.warn(`Aba ${tab.name} não visível ou oculta sob menu suspenso.`);
      }
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
