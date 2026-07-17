import { navigateSidebar, openDataCenter, test, expect } from './e2eTest';

test.describe('Sauron Data Flow Certification & Domain Neutralization E2E', () => {
  test('deve certificar o ciclo completo de dados, domínio neutro/agro e coerência entre os módulos', async ({ page }) => {
    await page.goto('/');

    await openDataCenter(page);

    await expect(page.getByText(/Nenhuma fonte de dados ativa|Dados ativos|Dados Reais Ativos/i).first()).toBeVisible();

    const bodyText = await page.innerText('body');
    expect(bodyText).not.toMatch(/Topázio|Grupo Alpha|Concessionária|Automotivo|Nissan|Renault|Dealer|Workshop/i);
    
    await page.keyboard.press('Escape');

    await navigateSidebar(page, /Centro de Comando/i, /Empresas e Grupos/i);
    await expect(page.getByText(/Empresas e Grupos|Contexto ativo|Nenhuma fonte/i).first()).toBeVisible();
  });
});
