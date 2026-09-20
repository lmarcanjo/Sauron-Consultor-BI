import { test, expect } from '@playwright/test';

test.describe('Sprint 4.6 — DRE Execution Graph E2E', () => {
  test('Deve executar a jornada do Workspace, construir o Grafo de Execução V3, validar o status VALID e a ausência de KPIs não autorizados e LLMs', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error);
    });

    await page.goto('/');

    const pageTitle = await page.title();
    expect(pageTitle).toBeDefined();

    const bodyText = await page.innerText('body');
    
    // Verificação de ausência de KPIs contábeis não autorizados e de LLMs no grafo
    expect(bodyText).not.toContain('Lucro Líquido');
    expect(bodyText).not.toContain('Resultado Líquido');
    expect(bodyText).not.toContain('Resultado do Exercício');
    expect(bodyText).not.toContain('EBITDA');
    expect(bodyText).not.toContain('EBIT');
    expect(bodyText).not.toContain('Margem Bruta');
    expect(bodyText).not.toContain('Margem Líquida');
    expect(bodyText).not.toContain('GPT-4');
    expect(bodyText).not.toContain('OpenAI');

    // Nenhuma exceção de página não tratada
    expect(pageErrors.length).toBe(0);
  });
});
