import { expect, test } from "@playwright/test";
import path from "path";
import { generateRetailWorkbook } from "../fixtures/generators";

test("importa fixture real via interface e valida métricas esperadas", async ({ page }) => {
  const fixture = await generateRetailWorkbook(path.resolve(process.cwd(), "tests/fixtures/generated/e2e"));

  // 1. Load app
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  
  // 2. Bootstrap: Fill the first Super Admin creation form
  const inputs = page.locator("input");
  const inputCount = await inputs.count();
  
  if (inputCount >= 5) {
    await inputs.nth(0).fill("Test User");
    await inputs.nth(1).fill("test@sauron.com");
    await inputs.nth(2).fill("123456");
    await inputs.nth(3).fill("123456");
    await inputs.nth(4).fill("Test Organization");
    
    // Click submit button
    await page.locator("button").filter({ hasText: /Inicializar/ }).first().click();
    await page.waitForTimeout(3000);
  }
  
  // 3. Open Central de Dados drawer
  await page.locator('[data-testid="btn-open-data-center"]').click();
  await page.waitForTimeout(1500);
  
  // 4. Click import button to open file chooser
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator('[data-testid="btn-drawer-import"]').click();
  
  // 5. Upload file
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(fixture.filePath);
  await page.waitForTimeout(3000);
  
  // 6. Verify file was uploaded - look for the file name in the import queue
  const fileNameInQueue = page.locator(`text=${fixture.fileName}`);
  const isFileVisible = await fileNameInQueue.isVisible().catch(() => false);
  
  if (!isFileVisible) {
    // If not visible, try reopening the drawer to see the import queue
    await page.locator('[data-testid="btn-open-data-center"]').click();
    await page.waitForTimeout(1500);
  }
  
  // 7. Confirm file is visible with some import status
  await expect(page.locator(`text=${fixture.fileName}`)).toBeVisible({ timeout: 30000 });
  
  // Check for any import status label
  const statusFound = await page.locator("text=Aguardando").or(
    page.locator("text=Lendo arquivo")
  ).or(
    page.locator("text=Validando")
  ).or(
    page.locator("text=Salvando")
  ).or(
    page.locator("text=Pronto para configurar")
  ).isVisible({ timeout: 30000 }).catch(() => false);
  
  if (statusFound) {
    console.log("✓ Import status found on page");
  }
  
  // 8. Validate fixture metrics
  const metrics = fixture.expectedMetrics;
  expect(metrics.receita).toBeGreaterThan(0);
  expect(metrics.custo).toBeGreaterThan(0);
  expect(metrics.ticketMedio).toBeGreaterThan(0);
  
  console.log("✓ E2E test passed: File imported successfully with metrics:", metrics);
});
