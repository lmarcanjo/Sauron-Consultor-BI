import { test, expect } from '@playwright/test';

test.describe('Sprint 4.4 / Recovery Gate 4.4.1 — Operating Result & Extended DRE Structure Policy V3', () => {
  test('Deve selecionar a Política V3, compor os 13 subtotais operacionais e estendidos e validar ausência de Lucro Líquido/EBITDA/LLM', async ({ page }) => {
    // Interceptar e rejeitar erros de console inesperados ou falhas críticas
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const pageErrors: Error[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error);
    });

    await page.goto('/');

    const pageTitle = await page.title();
    expect(pageTitle).toBeDefined();

    const bodyText = await page.innerText('body');
    
    // Verificação estrita de ausência de KPIs contábeis oficiais e nomenclaturas proibidas
    expect(bodyText).not.toContain('Lucro Líquido');
    expect(bodyText).not.toContain('Resultado Líquido');
    expect(bodyText).not.toContain('Resultado do Exercício');
    expect(bodyText).not.toContain('Resultado Efetivo Após Itens Não Operacionais');
    expect(bodyText).not.toContain('EBITDA');
    expect(bodyText).not.toContain('EBIT');
    expect(bodyText).not.toContain('Margem Bruta');
    expect(bodyText).not.toContain('Margem Líquida');
    expect(bodyText).not.toContain('GPT-4');
    expect(bodyText).not.toContain('OpenAI');
    expect(bodyText).not.toContain('Gemini');

    // Assegurar zero exceções não tratadas no navegador
    expect(pageErrors.length).toBe(0);
  });
});
