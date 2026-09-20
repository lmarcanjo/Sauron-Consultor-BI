import { expect, navigateSidebar, type Page } from "./e2eTest";

export interface CanonicalJourneyContext {
  clientName: string;
  engagementName: string;
  groupName: string;
  companyName: string;
  unitName: string;
}

function overlayWithTitle(page: Page, title: string) {
  return page.locator("div.fixed.inset-0").filter({ hasText: title }).last();
}

export async function createCanonicalClientEngagementStructure(
  page: Page,
  suffix: string
): Promise<CanonicalJourneyContext> {
  const context: CanonicalJourneyContext = {
    clientName: `Cliente Recovery ${suffix}`,
    engagementName: `Engajamento Recovery ${suffix}`,
    groupName: `Grupo Recovery ${suffix}`,
    companyName: `Empresa Recovery ${suffix}`,
    unitName: `Unidade Recovery ${suffix}`,
  };

  await navigateSidebar(page, /Cliente/i, /Empresas e Grupos/i);
  await page.getByRole("button", { name: /Gerenciar Clientes/i }).click();
  const clientModal = overlayWithTitle(page, "Gestão de Clientes");
  await expect(clientModal).toBeVisible();
  await clientModal.locator("input[placeholder='Ex: ACME Indústria S.A.']").fill(context.clientName);
  await clientModal.locator("input[placeholder='Ex: 00.000.000/0001-00']").fill(`REC-${Date.now()}`);
  await clientModal.getByRole("button", { name: /Cadastrar Cliente/i }).click();
  await expect(clientModal.getByText(context.clientName, { exact: true })).toBeVisible({ timeout: 15000 });
  await clientModal.getByRole("button").first().click();
  await expect(clientModal).toHaveCount(0);

  await page.getByRole("button", { name: /Iniciar Novo Engajamento/i }).click();
  const engagementModal = overlayWithTitle(page, "Gestão de Engajamentos");
  await expect(engagementModal).toBeVisible();
  const clientSelect = engagementModal.locator("select").first();
  const clientOption = clientSelect.locator("option").filter({ hasText: context.clientName }).first();
  await expect(clientOption).toHaveCount(1, { timeout: 15000 });
  const clientValue = await clientOption.getAttribute("value");
  await clientSelect.selectOption(clientValue || "");
  await engagementModal.locator("input[placeholder='Ex: Reestruturação Operacional 2026']").fill(context.engagementName);
  await engagementModal.getByRole("button", { name: /Criar Engajamento/i }).click();
  await expect(page.getByTestId("engagement-organization-panel")).toBeVisible({ timeout: 15000 });

  const scopeForm = page.getByTestId("organizational-scope-form");
  await scopeForm.getByLabel("Tipo de estrutura").selectOption("Grupo");
  await scopeForm.getByLabel("Nome da estrutura").fill(context.groupName);
  await scopeForm.getByRole("button", { name: /Salvar estrutura/i }).click();
  await expect(page.getByTestId("organizational-scope-list")).toContainText(context.groupName);

  await scopeForm.getByLabel("Tipo de estrutura").selectOption("Empresa");
  await scopeForm.getByLabel("Grupo Econômico").selectOption({ label: context.groupName });
  await scopeForm.getByLabel("Nome da estrutura").fill(context.companyName);
  await scopeForm.getByRole("button", { name: /Salvar estrutura/i }).click();
  await expect(page.getByTestId("organizational-scope-list")).toContainText(context.companyName);

  await scopeForm.getByLabel("Tipo de estrutura").selectOption("Unidade");
  await scopeForm.getByLabel("Empresa").selectOption({ label: context.companyName });
  await scopeForm.getByLabel("Nome da estrutura").fill(context.unitName);
  await scopeForm.getByRole("button", { name: /Salvar estrutura/i }).click();
  await expect(page.getByTestId("organizational-scope-list")).toContainText(context.unitName);

  return context;
}

export async function importSpreadsheetThroughUi(page: Page, filePath: string, fileName: string): Promise<void> {
  await navigateSidebar(page, /Fontes/i, /Fontes de Dados/i);
  await page.getByRole("button", { name: /^Importar Planilha$/i }).first().click();
  const importer = page.locator("#simple-spreadsheet-importer");
  await expect(importer).toBeVisible({ timeout: 15000 });
  await importer.locator("input[type='file']").first().setInputFiles(filePath);
  await expect(importer).toContainText(fileName, { timeout: 30000 });
  await expect(importer).toContainText(/Pronto para (importar|configurar)/i, { timeout: 30000 });
  await importer.locator("#btn-importar-todos").click();
  await expect(importer).toHaveCount(0, { timeout: 60000 });
  await expect(page.getByText(/Dados Conectados|DADOS REAIS|Dados ativos/i).first()).toBeVisible({ timeout: 15000 });
}

export async function openPreliminaryAnalysis(page: Page): Promise<void> {
  await navigateSidebar(page, /Análise/i, /Análise da fonte/i);
  const analyzeButton = page.getByTestId("chaos-analyze");
  await expect(analyzeButton).toBeVisible({ timeout: 30000 });
  await analyzeButton.click();
  await expect(page.getByText(/Estrutura mapeada|Análise e proposta ZCX/i).first()).toBeVisible({ timeout: 60000 });
}
