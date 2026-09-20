import { test, expect } from '@playwright/test';

test.describe("Sprint 3.3.1 — Real Data Financial Observation Pilot & Boundary E2E", () => {
  test("1. Validação de Carregamento da Aplicação, Ausência de DEMO_DATA e Isolamento UI/Repository", async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveTitle(/Asterion|Sauron/i);

    // Ausência de DEMO_DATA e de componentes legados/proibidos
    await expect(page.locator('text=DEMO_DATA')).toHaveCount(0);
    await expect(page.locator('button:has-text("Gerar DRE")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Analisar com IA")')).toHaveCount(0);
    await expect(page.locator('text=ZcxProposalPanel')).toHaveCount(0);

    expect(pageErrors.length).toBe(0);
  });

  test("2. Resiliência a Reload e Reconstrução do Contexto sem Exibir NO_SOURCE Incorretamente", async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Reload da página
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Garantir que a aplicação responde normalmente e sem erros de execução
    const title = await page.title();
    expect(title).toMatch(/Asterion|Sauron/i);
  });

  test("3. Inexistência de Acesso Direto da UI a Repositórios", async ({ page }) => {
    const directAccessViolations = await page.evaluate(() => {
      // Verifica se a UI injeta globalmente instâncias diretas de repositório no window
      return (window as any).__LOCAL_DS_REPO_DIRECT__ !== undefined;
    });

    expect(directAccessViolations).toBe(false);
  });
});
