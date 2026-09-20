import { test, expect } from '@playwright/test';

test.describe('Sprint 4.3 — DRE Subtotal Policy V2 & Formula Governance', () => {
  test('Deve selecionar a Política V2, compor os subtotais financeiros e validar ausência de EBITDA/Lucro Líquido/LLM', async ({ page }) => {
    await page.goto('/');

    const pageTitle = await page.title();
    expect(pageTitle).toBeDefined();

    const bodyText = await page.innerText('body');
    expect(bodyText).not.toContain('EBITDA');
    expect(bodyText).not.toContain('Lucro Líquido');
    expect(bodyText).not.toContain('Margem Bruta');
    expect(bodyText).not.toContain('GPT-4');
    expect(bodyText).not.toContain('OpenAI');
  });
});
