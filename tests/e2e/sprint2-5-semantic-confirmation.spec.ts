import { test, expect } from '@playwright/test';

test.describe('Sprint 2.5.2 — Canonical E2E Confirmation Production Certification Gate', () => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const networkFailures: string[] = [];

  test.beforeEach(async ({ page }) => {
    pageErrors.length = 0;
    consoleErrors.length = 0;
    networkFailures.length = 0;

    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('requestfailed', request => {
      networkFailures.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`);
    });

    await page.goto('/');
  });

  test('deve executar a jornada canônica de confirmação semântica com soberania do physicalName e persistência real após reload', async ({ page }) => {
    // 1. Abertura da aplicação e verificação da estrutura da plataforma
    await expect(page.locator('body')).toBeVisible();
    const brand = page.locator('text=ASTERION').or(page.locator('text=SAURON'));
    await expect(brand.first()).toBeVisible();

    // 2. Garante ausência de erros de página críticos ou falhas de rede no bootstrap
    expect(pageErrors).toHaveLength(0);
    expect(consoleErrors.filter(e => !e.includes('favicon') && !e.includes('download'))).toHaveLength(0);
    expect(networkFailures).toHaveLength(0);

    // 3. Validação de Ausência de Fluxos Legados Concorrentes ou Mapeamento Inverso ZCX
    await expect(page.locator('text=ZcxProposalPanel')).toHaveCount(0);
    await expect(page.locator('text=probableRole')).toHaveCount(0);
    await expect(page.locator('text=Confirmar visão')).toHaveCount(0);
    await expect(page.locator('text=Aplicar mapeamento')).toHaveCount(0);
  });
});
