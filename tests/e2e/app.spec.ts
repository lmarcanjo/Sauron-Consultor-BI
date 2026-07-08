import { test, expect } from '@playwright/test';

test('App should load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Sauron OS')).toBeVisible();
});

test('Mock Data status check works', async ({ page }) => {
  await page.goto('/');
  // Deve exibir o estado vazio real na tela ou o switch para mock
  await expect(page.locator('text=Dados')).toBeVisible();
});

test('Meeting mode toggle works', async ({ page }) => {
  await page.goto('/');
  // Using explicit buttons from sidebar
  await page.click('button:has-text("Modo Reunião")');
  await expect(page.locator('text=Assistente e Notas da Reunião')).toBeVisible();
});

test('DRE screen contains data table and charts', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("DRE Inteligente Gerencial")');
  await expect(page.locator('text=Demonstrativo de Resultados')).toBeVisible();
  // Validando a presenca da nova tabela pedida (DRE Completo)
  await expect(page.locator('text=Tabela Analítica Documental (DRE Completo)')).toBeVisible();
  await expect(page.locator('text=Evolução de Resultado')).toBeVisible();
});

test('Apresentacoes: construtor e minispoiler', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Apresentações")');
  await expect(page.locator('text=Construtor de Apresentações')).toBeVisible();
  await expect(page.locator('text=ADICIONAR SLIDE DA BIBLIOTECA')).toBeVisible();

  // Check the minispolier/deck container
  await expect(page.locator('text=Slides (3)')).toBeVisible();

  // Create new slide
  await page.click('button:has-text("DRE Gráfico")');
  await expect(page.locator('text=Slides (4)')).toBeVisible();

  // Test clone slide
  await page.click('button:has-text("DUPLICAR SLIDE (CLONE)")');
  await expect(page.locator('text=Slides (5)')).toBeVisible();
});

test('Relatorios biblioteca test', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Relatórios Corporativos")');
  await expect(page.locator('text=Biblioteca de Relatórios')).toBeVisible();
  await expect(page.locator('text=Resultado Comercial')).toBeVisible();
});

