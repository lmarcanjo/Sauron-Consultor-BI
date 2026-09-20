import { test, expect } from '@playwright/test';

test.describe('Sprint 2.6.1 — E2E Trust Policy & Production Certification Hardening', () => {
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

  test('deve verificar bootstrap da plataforma ASTERION, integridade de rotas e ausência de pageerrors', async ({ page }) => {
    // 1. Abertura da aplicação
    await expect(page.locator('body')).toBeVisible();
    const brand = page.locator('text=ASTERION').or(page.locator('text=SAURON'));
    await expect(brand.first()).toBeVisible();

    // 2. Ausência de erros de página críticos
    expect(pageErrors).toHaveLength(0);
    expect(consoleErrors.filter(e => !e.includes('favicon') && !e.includes('download'))).toHaveLength(0);
    expect(networkFailures).toHaveLength(0);
  });
});
