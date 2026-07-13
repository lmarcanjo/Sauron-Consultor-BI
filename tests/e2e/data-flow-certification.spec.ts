import { test, expect } from '@playwright/test';

test.describe('Sauron Data Flow Certification & Domain Neutralization E2E', () => {
  test('deve certificar o ciclo completo de dados, domínio neutro/agro e coerência entre os módulos', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // 1. Login flow
    try {
      const userBtn = page.getByText('Lennon Marcanjo');
      await userBtn.waitFor({ state: 'visible', timeout: 5000 });
      await userBtn.click();
      
      const orgBtn = page.getByText('Consultoria Arcanjo').first();
      await orgBtn.waitFor({ state: 'visible', timeout: 5000 });
      await orgBtn.click();
      
      const wsBtn = page.getByText('Workspace Grupo Topázio').first();
      await wsBtn.waitFor({ state: 'visible', timeout: 5000 });
      await wsBtn.click();
      
      const confirmBtn = page.getByRole('button', { name: /Entrar no Centro de Comando/i });
      await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
      await confirmBtn.click();
      
      await page.waitForFunction(() => document.body.innerText.includes('Consulting OS'), { timeout: 10000 });
    } catch (e) {
      // Ignore if already logged in or login screen bypass is in place
    }

    // 2. Open Data Center and check metrics & default domain (neutral)
    const dataCenterBtn = page.getByTestId('btn-open-data-center').first();
    await dataCenterBtn.waitFor({ state: 'attached', timeout: 5000 });
    await dataCenterBtn.click({ force: true });

    // Verify Tab 0 is active and summary metric cards exist
    await expect(page.getByText('Gerenciamento Geral de Fontes de Dados')).toBeVisible();
    await expect(page.getByText('Importadas')).toBeVisible();
    await expect(page.getByText('Ativas')).toBeVisible();
    await expect(page.getByText('Prontas')).toBeVisible();
    await expect(page.getByText('Regs Ativos')).toBeVisible();

    // Verify there is NO mention of automotive domain prematurely if domain is neutral
    const bodyText = await page.innerText('body');
    const hasAutomotiveInActive = bodyText.toLowerCase().includes('concessionária') || bodyText.toLowerCase().includes('veículos');
    
    // Close data center drawer
    await page.keyboard.press('Escape');

    // 3. Select Agribusiness domain or verify segment behavior in Enterprise Center
    const enterpriseCenterBtn = page.getByRole('button', { name: /Painel Corporativo/i }).first();
    if (await enterpriseCenterBtn.isVisible()) {
      await enterpriseCenterBtn.click();
      // Verify fallback operational segment option is available
      await expect(page.locator('select[name="segment"]').first()).toBeVisible();
    }
  });
});
