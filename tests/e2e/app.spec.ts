import { ensureConsultantSession, navigateSidebar, test, expect } from './e2eTest';

test('App should load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Sauron OS')).toBeVisible();
});

test('Estado sem fonte ativa é claro e não exibe demo', async ({ page }) => {
  await page.goto('/');
  await ensureConsultantSession(page);
  await expect(page.getByText(/SEM FONTE ATIVA|Nenhuma fonte de dados ativa/i).first()).toBeVisible();
  await expect(page.getByText(/MOCK DATA|Demonstração/i)).not.toBeVisible();
});

test('Sessão Executiva abre sem tela quebrada', async ({ page }) => {
  await page.goto('/');
  await navigateSidebar(page, /Conduzir Sessão/i, /Sessão Executiva/i);
  await expect(page.getByText(/Sessão Executiva|Modo Reunião|Assistente/i).first()).toBeVisible();
});

test('KPIs e DRE abre com estado real ou configuração pendente', async ({ page }) => {
  await page.goto('/');
  await navigateSidebar(page, /Diagnosticar Negócio/i, /KPIs & DRE/i);
  await expect(page.getByText(/Configuração pendente|Nenhuma fonte de dados ativa|Fonte real ativa|KPIs/i).first()).toBeVisible();
  await expect(page.getByText(/Grupo Alpha|Topázio|MOCK DATA/i)).not.toBeVisible();
});

test('Decks abre sem depender de dados fictícios', async ({ page }) => {
  await page.goto('/');
  await navigateSidebar(page, /Preparar Decisão/i, /Decks|Apresentações/i);
  await expect(page.getByText(/Apresenta|Deck|Construtor/i).first()).toBeVisible();
  await expect(page.getByText(/Grupo Alpha|Topázio|MOCK DATA/i)).not.toBeVisible();
});

test('Dossiês abre com linguagem de consultoria', async ({ page }) => {
  await page.goto('/');
  await navigateSidebar(page, /Diagnosticar Negócio/i, /Dossiês|Relatórios/i);
  await expect(page.getByText(/Dossi|Relatório|Nenhuma fonte/i).first()).toBeVisible();
  await expect(page.getByText(/Grupo Alpha|Topázio|MOCK DATA/i)).not.toBeVisible();
});
