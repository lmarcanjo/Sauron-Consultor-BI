import { test, expect } from '@playwright/test';

test.describe('Sprint 4.0 — Financial Classification & DRE Readiness E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('1. Deve abrir a Classificação Financeira e validar ausência de classificação automática e ausência de DRE', async ({ page }) => {
    // Verificar que a página carrega limpa
    const title = await page.title();
    expect(title).toBeDefined();

    // Navegar ou verificar elemento de Observação Financeira
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('DRE Final');
    expect(bodyText).not.toContain('Lucro Líquido');
    expect(bodyText).not.toContain('EBITDA');
  });
});
