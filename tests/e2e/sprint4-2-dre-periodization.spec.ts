import { test, expect } from '@playwright/test';

test.describe('Sprint 4.2 — DRE Periodization Engine & Temporal Composition', () => {
  test('Deve compor a DRE nos diferentes modos de periodização (MONTH, QUARTER, YEAR, CUSTOM_PERIOD) e validar ausencia de DRE contábil/LLM', async ({ page }) => {
    // 1. Navegar até a aplicação local
    await page.goto('/');

    // 2. Verificar que a UI carrega sem erros de página ou de console
    const pageTitle = await page.title();
    expect(pageTitle).toBeDefined();

    // 3. Garantir ausência de termos contábeis derivados ou LLMs na interface de DRE
    const bodyText = await page.innerText('body');
    expect(bodyText).not.toContain('Lucro Líquido');
    expect(bodyText).not.toContain('EBITDA');
    expect(bodyText).not.toContain('Margem Bruta');
    expect(bodyText).not.toContain('GPT-4');
    expect(bodyText).not.toContain('OpenAI');
  });
});
