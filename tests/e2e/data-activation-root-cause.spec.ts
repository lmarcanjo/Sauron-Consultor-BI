import { test, expect } from '@playwright/test';

test.describe('CTO Data Activation Root Cause E2E Verification', () => {
  test('importa planilha, ativa com sucesso, propaga no dashboard e persiste no reload', async ({ page }) => {
    // 1. Navegar até o dashboard
    await page.goto('/');
    
    // Simulate Login / Workspace selection if onboarding screen is present
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
      // Ignorar se já estiver logado ou se não houver onboarding
    }

    // 2. Navegar para Importar Planilha no Central de Dados
    const dataCenterBtn = page.getByTestId('btn-open-data-center').first();
    await dataCenterBtn.waitFor({ state: 'attached', timeout: 5000 });
    await dataCenterBtn.click({ force: true });
    
    const importBtn = page.getByRole('button', { name: /Importar Planilha/i }).first();
    await importBtn.waitFor({ state: 'visible', timeout: 5000 });
    await importBtn.click();

    // 3. Registrar o tratamento de diálogos para aceitar o alert automático
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      console.log(`[PLAYWRIGHT DIALOG] ${alertMessage}`);
      await dialog.accept();
    });

    // Escutar console do navegador para capturar os logs de instrumentação
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.text()}`);
    });

    // 4. Selecionar o dataset demo "Concessionárias" do importador estruturado para simular faturamento real
    const demoBtn = page.getByText(/Concessionárias/i).first();
    await demoBtn.waitFor({ state: 'visible', timeout: 5000 });
    await demoBtn.click();

    // Passar pelos passos de parametrização do novo SimpleSpreadsheetImporter
    await page.getByRole('button', { name: /Confirmar Configuração/i }).click({ force: true });
    await page.getByRole('button', { name: /Ir para Ativar Fonte/i }).click({ force: true });
    
    // Finalizar e Ativar
    await page.getByRole('button', { name: /Finalizar e Ativar Fonte/i }).first().click({ force: true });

    // 5. Validar se o alert 'Planilha ativada com sucesso.' disparou
    // Aguardamos que o dialog tenha sido capturado
    await page.waitForTimeout(1000);
    expect(alertMessage).toContain('Planilha ativada com sucesso.');

    // 6. Verificar se os dados reais foram propagados no Command Center
    const dataCenterBtnDashboard = page.getByTestId('btn-open-data-center').first();
    await dataCenterBtnDashboard.waitFor({ state: 'attached', timeout: 5000 });
    await dataCenterBtnDashboard.click({ force: true });
    
    // Verificar se a planilha ativa é exibida com sucesso na gaveta
    await expect(page.getByText('dados_automotivo_vendas.xlsx')).toBeVisible();

    // Fechar gaveta
    await page.keyboard.press('Escape');

    // Garantir que não exibe o selo de demonstração/dados fictícios
    await expect(page.getByText('Demonstração')).not.toBeVisible();

    // 7. Forçar o reload da página para garantir integridade e persistência
    await page.reload();
    
    // Refazer login se necessário pós-reload
    try {
      const userBtn2 = page.getByText('Lennon Marcanjo').first();
      await userBtn2.waitFor({ state: 'visible', timeout: 5000 });
      await userBtn2.click();
      
      const orgBtn2 = page.getByText('Consultoria Arcanjo').first();
      await orgBtn2.waitFor({ state: 'visible', timeout: 5000 });
      await orgBtn2.click();
      
      const wsBtn2 = page.getByText('Workspace Grupo Topázio').first();
      await wsBtn2.waitFor({ state: 'visible', timeout: 5000 });
      await wsBtn2.click();
      
      const confirmBtn2 = page.getByRole('button', { name: /Entrar no Centro de Comando/i });
      await confirmBtn2.waitFor({ state: 'visible', timeout: 5000 });
      await confirmBtn2.click();
      
      await page.waitForFunction(() => document.body.innerText.includes('Consulting OS'), { timeout: 10000 });
    } catch (e) {
      // Ignorar se persistência reter sessão
    }

    // 8. Re-abrir a gaveta e conferir se os dados continuam ativados
    const dataCenterBtn2 = page.getByTestId('btn-open-data-center').first();
    await dataCenterBtn2.waitFor({ state: 'attached', timeout: 5000 });
    await dataCenterBtn2.click({ force: true });

    await expect(page.getByText('dados_automotivo_vendas.xlsx')).toBeVisible();

    // Fechar a gaveta e verificar ausência do modo demonstração
    await page.keyboard.press('Escape');
    await expect(page.getByText('Demonstração')).not.toBeVisible();
  });
});
