# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-reality-certification.spec.ts >> Sauron User Reality Certification - E2E Comprehensive Test Flow
- Location: tests/e2e/user-reality-certification.spec.ts:10:1

# Error details

```
TimeoutError: page.waitForSelector: Timeout 45000ms exceeded.
Call log:
  - waiting for locator('input') to be visible

```

# Test source

```ts
  1   | /**
  2   |  * @license
  3   |  * SPDX-License-Identifier: Apache-2.0
  4   |  */
  5   | 
  6   | import { test, expect } from '@playwright/test';
  7   | import * as path from 'path';
  8   | import * as fs from 'fs';
  9   | 
  10  | test('Sauron User Reality Certification - E2E Comprehensive Test Flow', async ({ page }) => {
  11  |   // Increase timeout to 90 seconds to allow for Vite cold start and transpile time
  12  |   test.setTimeout(90000);
  13  | 
  14  |   // Setup auto-accept for all dialogs (confirms/alerts)
  15  |   page.on('dialog', async (dialog) => {
  16  |     await dialog.accept();
  17  |   });
  18  | 
  19  |   // Navigate to root
  20  |   await page.goto('/');
  21  | 
  22  |   // Wait for the UI to be fully compiled and rendered by waiting for any input field
> 23  |   await page.waitForSelector("input", { timeout: 45000 });
      |              ^ TimeoutError: page.waitForSelector: Timeout 45000ms exceeded.
  24  | 
  25  |   const isFirstAccess = await page.locator("text=Criar primeiro Super Admin").count() > 0;
  26  | 
  27  |   if (isFirstAccess) {
  28  |     await page.fill("input[placeholder='Nome completo']", "Super Admin E2E");
  29  |     await page.fill("input[placeholder='E-mail corporativo']", "superadmin@sauron.com.br");
  30  |     await page.fill("input[placeholder='Senha secreta (mínimo 6 caracteres)']", "SenhaSuperSecreta123");
  31  |     await page.fill("input[placeholder='Confirmar senha']", "SenhaSuperSecreta123");
  32  |     await page.fill("input[placeholder='Nome da sua consultoria / organização']", "Consultoria Alpha E2E");
  33  |     await page.click("button:has-text('Inicializar Super Admin & Iniciar')");
  34  |   } else {
  35  |     await page.fill("input[placeholder='E-mail']", "superadmin@sauron.com.br");
  36  |     await page.fill("input[placeholder='Senha']", "SenhaSuperSecreta123");
  37  |     await page.click("button:has-text('Entrar no Sauron')");
  38  |   }
  39  | 
  40  |   // Wait for load and navigation to dashboard
  41  |   await page.waitForTimeout(3000);
  42  | 
  43  |   // Expand sidebar groups to reveal navigation items
  44  |   const cmdGroup = page.locator('button:has-text("Centro de Comando")').first();
  45  |   if (await cmdGroup.isVisible()) {
  46  |     await cmdGroup.click();
  47  |     await page.waitForTimeout(200);
  48  |   }
  49  | 
  50  |   const clientGroup = page.locator('button:has-text("Conhecer Cliente")').first();
  51  |   if (await clientGroup.isVisible()) {
  52  |     await clientGroup.click();
  53  |     await page.waitForTimeout(200);
  54  |   }
  55  | 
  56  |   const dataGroup = page.locator('button:has-text("Conectar Dados")').first();
  57  |   if (await dataGroup.isVisible()) {
  58  |     await dataGroup.click();
  59  |     await page.waitForTimeout(200);
  60  |   }
  61  | 
  62  |   // 2. Open Enterprise Center
  63  |   const openEntBtn = page.locator('text=Enterprise Center').first();
  64  |   await expect(openEntBtn).toBeVisible();
  65  |   await openEntBtn.click();
  66  |   await page.waitForTimeout(500);
  67  | 
  68  |   // Register a new Group
  69  |   await page.click('text=Grupo Empresarial');
  70  |   await page.fill('input[name="name"]', 'Grupo Teste E2E');
  71  |   await page.selectOption('select[name="segment"]', 'agribusiness');
  72  |   await page.click('button:has-text("Salvar")');
  73  |   await page.waitForTimeout(500);
  74  | 
  75  |   // Verify group is now active
  76  |   await expect(page.locator('text=Grupo Teste E2E')).toBeVisible();
  77  | 
  78  |   // Register a Company under it
  79  |   await page.click('button[title="Cadastrar Nova Empresa"]');
  80  |   await page.fill('input[name="name"]', 'Empresa Filha E2E');
  81  |   await page.selectOption('select[name="segment"]', 'agribusiness');
  82  |   await page.selectOption('select[name="type"]', 'Empresa');
  83  |   await page.click('button:has-text("Salvar")');
  84  |   await page.waitForTimeout(500);
  85  | 
  86  |   // Verify company selected
  87  |   await expect(page.locator('select')).toContainText('Grupo Teste E2E');
  88  | 
  89  |   // 3. Open Data center and test preference history toggle
  90  |   const openDataBtn = page.locator('text=Central de Dados').first();
  91  |   await openDataBtn.click();
  92  |   await page.waitForTimeout(500);
  93  | 
  94  |   // Check history checkbox is visible in context bar and toggle it on
  95  |   const historyCheckbox = page.locator('#display-history-checkbox');
  96  |   await expect(historyCheckbox).toBeVisible();
  97  |   
  98  |   // By default, it is unchecked. Let's check it
  99  |   await historyCheckbox.check();
  100 |   
  101 |   // Timeline tab should now be visible in CentralDados
  102 |   await expect(page.locator('text=Timeline Empresarial')).toBeVisible();
  103 |   
  104 |   // Toggle history back off
  105 |   await historyCheckbox.uncheck();
  106 |   
  107 |   // Timeline tab should disappear
  108 |   await expect(page.locator('text=Timeline Empresarial')).not.toBeVisible();
  109 | 
  110 |   // 4. Batch multi-file import queue
  111 |   // Create mock CSV files
  112 |   const csv1 = "ID,Mês,Receita,Custo\n1,2026-01-01,10000,4000\n2,2026-02-01,12000,5000";
  113 |   const csv2 = "ID,Mês,Receita,Custo\n1,2026-01-01,20000,8000\n2,2026-02-01,22000,9000";
  114 |   
  115 |   const path1 = path.join(__dirname, 'batch_test_1.csv');
  116 |   const path2 = path.join(__dirname, 'batch_test_2.csv');
  117 |   fs.writeFileSync(path1, csv1);
  118 |   fs.writeFileSync(path2, csv2);
  119 | 
  120 |   try {
  121 |     // Open Import tab in Data Center
  122 |     await page.click('button:has-text("Importar Planilha")');
  123 |     await expect(page.locator('text=Arraste seu arquivo de planilha ou clique para selecionar')).toBeVisible();
```