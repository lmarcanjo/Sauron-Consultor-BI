import { expect as baseExpect, test as baseTest, type Page } from '@playwright/test';

const allowedConsoleWarnings = [
  'React DevTools',
  'Download the React DevTools',
];

export const test = baseTest.extend<{
  consoleErrors: string[];
  consoleWarnings: string[];
  pageErrors: string[];
  requestFailures: string[];
}>({
  consoleErrors: async ({}, use) => {
    const errors: string[] = [];
    await use(errors);
  },
  consoleWarnings: async ({}, use) => {
    const warnings: string[] = [];
    await use(warnings);
  },
  pageErrors: async ({}, use) => {
    const errors: string[] = [];
    await use(errors);
  },
  requestFailures: async ({}, use) => {
    const failures: string[] = [];
    await use(failures);
  },
  page: async ({ page, consoleErrors, consoleWarnings, pageErrors, requestFailures }, use) => {
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        if (!text.includes('React DevTools')) {
          consoleErrors.push(`[ConsoleError] ${text}`);
        }
      }
      if (msg.type() === 'warning') {
        if (!allowedConsoleWarnings.some((allowed) => text.includes(allowed))) {
          consoleWarnings.push(`[ConsoleWarn] ${text}`);
        }
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(`[PageError] ${err.message}`);
    });

    page.on('response', (response) => {
      const status = response.status();
      const url = response.url();
      if (status >= 400 && !url.startsWith('data:') && !url.includes('favicon')) {
        requestFailures.push(`[ResponseFailed] ${response.request().method()} ${url} ${status} ${response.statusText()}`);
      }
    });

    page.on('requestfailed', (request) => {
      const failure = request.failure();
      const errorText = failure?.errorText || 'unknown';
      const url = request.url();
      if (
        !url.startsWith('data:') &&
        !url.includes('favicon') &&
        !errorText.includes('ERR_ABORTED') &&
        !errorText.includes('ERR_NETWORK_CHANGED')
      ) {
        requestFailures.push(`[RequestFailed] ${request.method()} ${url} ${errorText}`);
      }
    });

    await use(page);
  },
});

export const expect = baseExpect;
export type { Page };

export const RC1_USER = {
  name: 'Consultor RC1',
  email: 'consultor.rc1@sauron.local',
  password: 'SenhaRC1!',
  organization: 'Consultoria RC1',
};

function isWhiteScreenContent(text: string): boolean {
  return text.trim().length === 0;
}

async function assertNoWhiteScreen(page: Page): Promise<void> {
  if (page.url() === 'about:blank') {
    return;
  }

  const root = page.locator('#root');
  if ((await root.count()) === 0) {
    throw new Error('White screen detected: root element is missing.');
  }

  const rootText = await root.innerText().catch(() => '');
  if (isWhiteScreenContent(rootText)) {
    throw new Error('White screen detected: root element contains no visible text.');
  }

  const hasLayout =
    (await page.locator('main').count()) > 0 ||
    (await page.locator('aside, .sidebar, [class*="sidebar"]').count()) > 0 ||
    (await page.locator('text=Não foi possível carregar esta área').count()) > 0;

  if (!hasLayout) {
    throw new Error('White screen detected: layout containers not found in rendered page.');
  }
}

export async function ensureConsultantSession(page: Page): Promise<void> {
  if (page.url() === 'about:blank') {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.waitForLoadState('domcontentloaded').catch(() => undefined);
    const dataCenterButton = page.getByTestId('btn-open-data-center').first();
    if (await dataCenterButton.isVisible({ timeout: 1500 }).catch(() => false)) {
      return;
    }

    const firstAccess = page.locator("text=Inicializar Sauron").first();
    if (await firstAccess.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.fill("input[placeholder='Nome completo']", RC1_USER.name);
      await page.fill("input[placeholder='E-mail corporativo']", RC1_USER.email);
      await page.fill("input[placeholder='Senha secreta (mínimo 6 caracteres)']", RC1_USER.password);
      await page.fill("input[placeholder='Confirmar senha']", RC1_USER.password);
      await page.fill("input[placeholder='Nome da sua consultoria / organização']", RC1_USER.organization);
      await page.getByRole('button', { name: /Inicializar/i }).click();
    } else if (await page.locator("input[placeholder='E-mail']").isVisible({ timeout: 1500 }).catch(() => false)) {
      await page.fill("input[placeholder='E-mail']", RC1_USER.email);
      await page.fill("input[placeholder='Senha']", RC1_USER.password);
      await page.getByRole('button', { name: /Entrar no Sauron/i }).click();
    }

    if (await dataCenterButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      const acceptLgpd = page.getByRole('button', { name: /Aceitar Todos/i });
      if (await acceptLgpd.isVisible({ timeout: 1500 }).catch(() => false)) {
        await acceptLgpd.click().catch(() => undefined);
      }
      return;
    }

    if (attempt < 2) {
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => undefined);
    }
  }

  await baseExpect(page.getByTestId('btn-open-data-center').first()).toBeVisible({ timeout: 15000 });
  const acceptLgpd = page.getByRole('button', { name: /Aceitar Todos/i });
  if (await acceptLgpd.isVisible({ timeout: 1500 }).catch(() => false)) {
    await acceptLgpd.click().catch(() => undefined);
  }
}

export async function openDataCenter(page: Page): Promise<void> {
  await ensureConsultantSession(page);
  const sourceScreen = page.locator("main").getByText(/Fontes persistidas do projeto|Saúde da fonte/i).first();
  if (await sourceScreen.isVisible({ timeout: 500 }).catch(() => false)) {
    return;
  }

  await page.keyboard.press('Escape').catch(() => undefined);
  const button = page.locator('header [data-testid="btn-open-data-center"]').first();
  await baseExpect(button).toBeVisible({ timeout: 10000 });
  await button.click({ force: true });
  await baseExpect(page.locator("main").getByText(/Fontes persistidas do projeto|Saúde da fonte/i).first()).toBeVisible({ timeout: 10000 });
}

export async function closeBlockingPanels(page: Page): Promise<void> {
  await page.keyboard.press('Escape').catch(() => undefined);
  const closeButtons = page.getByRole('button', { name: /fechar|close/i });
  if (await closeButtons.first().isVisible({ timeout: 500 }).catch(() => false)) {
    await closeButtons.first().click({ force: true }).catch(() => undefined);
  }
}

export async function navigateSidebar(page: Page, groupName: string | RegExp, itemName: string | RegExp): Promise<void> {
  await ensureConsultantSession(page);
  await closeBlockingPanels(page);

  const sidebar = page.locator('aside').first();
  await baseExpect(sidebar).toBeVisible({ timeout: 10000 });

  const item = sidebar.getByRole('button', { name: itemName }).last();
  const group = sidebar.getByRole('button', { name: groupName }).first();
  await baseExpect(group).toBeVisible({ timeout: 10000 });
  if ((await group.getAttribute('aria-expanded')) !== 'true') {
    await group.click({ force: true });
  }

  await baseExpect(item).toBeVisible({ timeout: 10000 });
  await item.click({ force: true });
}

const REPORT_ERROR_TYPES = [
  'Unhandled Promise',
  'React Error',
  'TypeError',
  'ReferenceError',
  'Network Error',
];

function normalizeErrorMessage(message: string): string {
  return message.replace(/\s+/g, ' ').trim();
}

function buildErrorSummary(consoleErrors: string[], consoleWarnings: string[], pageErrors: string[], requestFailures: string[]): string {
  const lines: string[] = [];
  if (pageErrors.length) {
    lines.push('Page errors:');
    pageErrors.forEach((e) => lines.push(`  ${normalizeErrorMessage(e)}`));
  }
  if (consoleErrors.length) {
    lines.push('Console errors:');
    consoleErrors.forEach((e) => lines.push(`  ${normalizeErrorMessage(e)}`));
  }
  if (consoleWarnings.length) {
    lines.push('Console warnings:');
    consoleWarnings.forEach((e) => lines.push(`  ${normalizeErrorMessage(e)}`));
  }
  if (requestFailures.length) {
    lines.push('Request failures:');
    requestFailures.forEach((e) => lines.push(`  ${normalizeErrorMessage(e)}`));
  }
  return lines.join('\n');
}

// Automatic validation after each test
const originalTest = test;
originalTest.afterEach(async ({ consoleErrors, consoleWarnings, pageErrors, requestFailures, page }, testInfo) => {
  const errors = [...pageErrors, ...consoleErrors, ...consoleWarnings, ...requestFailures];
  if (errors.length > 0) {
    console.error('Detected E2E errors/warnings/failures:');
    console.error(buildErrorSummary(consoleErrors, consoleWarnings, pageErrors, requestFailures));
    baseExpect(errors, `${testInfo.title} failed due to console/page/request issues`).toEqual([]);
  }

  if ((testInfo.status === 'passed' || errors.length === 0) && page.url() !== 'about:blank') {
    await assertNoWhiteScreen(page);
  }
});
