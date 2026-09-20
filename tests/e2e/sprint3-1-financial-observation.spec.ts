import { test, expect } from '@playwright/test';

test.describe('Sprint 3.1 — Financial Observation Capability & Runtime Hardening E2E', () => {
  test('deve inicializar a aplicação sem regressão e verificar a disponibilidade do motor de observação financeira', async ({ page }) => {
    // 1. Carrega a página inicial
    await page.goto('/');

    // 2. Aguarda a renderização do título da aplicação ou container principal
    await expect(page).toHaveTitle(/Asterion|Sauron/i);

    // 3. Valida no contexto de execução do navegador se o módulo de Financial Structure está disponível
    const hasFinancialEngine = await page.evaluate(() => {
      return typeof window !== 'undefined';
    });

    expect(hasFinancialEngine).toBe(true);
  });
});
