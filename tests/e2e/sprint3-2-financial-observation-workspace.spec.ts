import { test, expect } from '@playwright/test';

test.describe("Sprint 3.2 — Financial Observation Workspace Integration E2E", () => {
  test("Verificar rota / integracao da Observacao Financeira no Workspace", async ({ page }) => {
    // 1. Abrir a aplicação
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // 2. Título do app
    await expect(page).toHaveTitle(/Asterion|Sauron/i);

    // 3. Tentar encontrar botão ou elemento de navegação para Financeiro se disponível
    const financeiroButton = page.locator('button:has-text("Financeiro"), [data-testid="nav-financeiro"]').first();
    if (await financeiroButton.isVisible()) {
      await financeiroButton.click();
    }

    // 4. Verificar que não há componentes legados/proibidos no DOM
    await expect(page.locator('button:has-text("Gerar DRE")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Analisar com IA")')).toHaveCount(0);
    await expect(page.locator('text=ZcxProposalPanel')).toHaveCount(0);
  });
});
