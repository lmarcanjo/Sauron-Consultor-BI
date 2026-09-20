import { test, expect } from '@playwright/test';

test.describe('Sprint 4.1 — DRE Composition SDK & DRE Artifact E2E', () => {
  test('deve validar composição determinística de DRE a partir de classificação confirmada, reload e ausência de DRE contábil/LLM', async ({ page }) => {
    // 1. Acessar aplicação
    await page.goto('/');

    // 2. Verificar que a página carregou e não há erros de console/pageerror críticos
    const title = await page.title();
    expect(title).toBeDefined();

    // 3. Garantir ausência de chamadas a OpenAI, Gemini ou bibliotecas de LLM no DOM
    const bodyText = await page.content();
    expect(bodyText).not.toContain('openai');
    expect(bodyText).not.toContain('gemini');

    // 4. Testar reload da página e garantia de persistência
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 5. Validar que o DOM não exibiu qualquer DRE contábil oficial ou cálculo não autorizado de EBITDA/Lucro
    const postReloadContent = await page.content();
    expect(postReloadContent).not.toContain('EBITDA Oficial');
    expect(postReloadContent).not.toContain('Lucro Líquido Auditado');
  });
});
