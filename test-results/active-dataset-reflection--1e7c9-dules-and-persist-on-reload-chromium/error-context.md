# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: active-dataset-reflection.spec.ts >> Active Dataset Reflection Hotfix Verification Suite >> verifies that imported datasets reflect correctly in all modules and persist on reload
- Location: tests/e2e/active-dataset-reflection.spec.ts:4:3

# Error details

```
TimeoutError: locator.waitFor: Timeout 5000ms exceeded.
Call log:
  - waiting for getByText(/Concessionárias/i).first() to be visible

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: S
        - generic [ref=e8]:
          - generic [ref=e9]: Sauron OS
          - generic [ref=e10]: Consulting OS
      - button [ref=e11] [cursor=pointer]:
        - img [ref=e12]
    - generic [ref=e14]:
      - button "Projetos" [ref=e16] [cursor=pointer]:
        - img [ref=e17]
        - generic [ref=e20]: Projetos
      - button "Centro de Comando" [ref=e22] [cursor=pointer]:
        - img [ref=e23]
        - generic [ref=e25]: Centro de Comando
      - button "Conectar Dados" [ref=e27] [cursor=pointer]:
        - img [ref=e28]
        - generic [ref=e32]: Conectar Dados
      - button "Diagnóstico" [ref=e34] [cursor=pointer]:
        - img [ref=e35]
        - generic [ref=e39]: Diagnóstico
      - button "Sessões" [ref=e41] [cursor=pointer]:
        - img [ref=e42]
        - generic [ref=e45]: Sessões
      - button "Planos" [ref=e47] [cursor=pointer]:
        - img [ref=e48]
        - generic [ref=e51]: Planos
      - button "Pessoas" [ref=e53] [cursor=pointer]:
        - img [ref=e54]
        - generic [ref=e59]: Pessoas
      - button "Administração" [ref=e61] [cursor=pointer]:
        - img [ref=e62]
        - generic [ref=e65]: Administração
      - button "SDL Studio" [ref=e67] [cursor=pointer]:
        - img [ref=e68]
        - generic [ref=e72]: SDL Studio
    - generic [ref=e73]: SAURON OS v0.6.8
  - generic [ref=e74]:
    - generic [ref=e76]:
      - generic [ref=e77]:
        - button "Consultoria Arcanjo" [ref=e79] [cursor=pointer]:
          - img [ref=e80]
          - generic [ref=e83]: Consultoria Arcanjo
          - img [ref=e84]
        - img [ref=e86]
        - button "Sem Caso Selecionado" [ref=e89] [cursor=pointer]:
          - img [ref=e90]
          - generic [ref=e93]: Sem Caso Selecionado
          - img [ref=e94]
        - img [ref=e96]
        - button "Unidade / Geral" [ref=e99] [cursor=pointer]:
          - img [ref=e100]
          - generic [ref=e102]: Unidade / Geral
          - img [ref=e103]
        - img [ref=e105]
        - button "Junho/2026" [ref=e108] [cursor=pointer]:
          - img [ref=e109]
          - generic [ref=e111]: Junho/2026
          - img [ref=e112]
      - generic [ref=e114]:
        - button "Buscar... Ctrl+K" [ref=e115]:
          - img [ref=e116]
          - generic [ref=e119]: Buscar...
          - generic [ref=e120]: Ctrl+K
        - button "Criar" [ref=e122] [cursor=pointer]:
          - img [ref=e123]
          - generic [ref=e124]: Criar
          - img [ref=e125]
        - button "L Lennon Marcanjo (Super) Super Admin" [ref=e128] [cursor=pointer]:
          - generic [ref=e129]: L
          - generic [ref=e130]: Lennon Marcanjo (Super)
          - generic [ref=e131]: Super Admin
          - img [ref=e132]
    - banner [ref=e134]:
      - generic [ref=e135]:
        - generic [ref=e136]:
          - generic [ref=e137]:
            - generic [ref=e138]: Sauron OS
            - generic [ref=e139]: Enterprise Consulting Operating System
          - generic [ref=e140]:
            - heading "Visão Consolidada Corporativa" [level=1] [ref=e141]:
              - img [ref=e142]
              - generic [ref=e145]: Visão Consolidada Corporativa
            - generic [ref=e146]:
              - img [ref=e147]
              - text: Configuração
            - generic [ref=e149]: DADOS REAIS
        - generic [ref=e151]:
          - button "Central de Dados" [ref=e152] [cursor=pointer]:
            - img [ref=e153]
            - generic [ref=e157]: Central de Dados
          - button "Filtros ativos (5)" [ref=e158] [cursor=pointer]:
            - img [ref=e159]
            - generic [ref=e160]: Filtros ativos (5)
          - button "Ativar Modo Escuro" [ref=e161] [cursor=pointer]:
            - img [ref=e162]
          - generic [ref=e164]:
            - generic "Lennon Marcanjo (Super)" [ref=e166]
            - button "Sair" [ref=e167] [cursor=pointer]:
              - img [ref=e168]
              - generic [ref=e171]: Sair
    - main [ref=e172]:
      - generic [ref=e173]:
        - generic [ref=e174]:
          - generic [ref=e175]: CLIENTE
          - generic [ref=e176]: Grupo Comercial Alpha
          - generic [ref=e177]: •
          - generic [ref=e178]: "Marcas: Nissan, Renault, Seminovos"
          - generic [ref=e179]: •
          - generic [ref=e180]: "CNPJs: 2 ativos"
        - generic [ref=e181]:
          - generic [ref=e182]:
            - img [ref=e183]
            - generic [ref=e184]: "Filtros:"
            - button "5 ativos" [ref=e185] [cursor=pointer]
          - generic [ref=e186]:
            - img [ref=e187]
            - generic [ref=e191]: "Ingestão:"
            - generic [ref=e192]: Planilhas
          - generic [ref=e193]:
            - img [ref=e194]
            - generic [ref=e197]: "Org:"
            - generic "Consultoria Arcanjo" [ref=e198]
      - generic [ref=e199]:
        - generic [ref=e200]:
          - heading "importacao" [level=2] [ref=e201]
          - paragraph [ref=e202]: Visão corporativa de painéis interativos.
        - generic [ref=e203]:
          - button "Gerenciar Filtros" [ref=e204] [cursor=pointer]:
            - img [ref=e205]
            - text: Gerenciar Filtros
          - button "Filtros Ativos (5)" [ref=e206] [cursor=pointer]:
            - img [ref=e207]
            - text: Filtros Ativos (5)
      - generic [ref=e208]:
        - generic [ref=e209]:
          - button "Dados Reais Conectados" [ref=e210] [cursor=pointer]: Dados Reais Conectados
          - generic [ref=e212]: •
          - generic [ref=e213]: "Filtros Ativos (5) • Fonte: Planilha (Carregada)"
        - button "Central de Dados →" [ref=e214] [cursor=pointer]:
          - img [ref=e215]
          - generic [ref=e219]: Central de Dados →
      - generic [ref=e222]:
        - generic [ref=e223]:
          - img [ref=e225]
          - generic [ref=e229]:
            - generic [ref=e230]:
              - generic [ref=e231]:
                - img [ref=e233]
                - heading "Central de Conexões e Dados" [level=1] [ref=e238]
              - paragraph [ref=e239]: Consolidador Corporativo de faturamentos e governança. Configure livremente fontes de planilhas locais, túneis de conexão VPN seguros, parâmetros de filtros e restrições de permissões para os usuários finais.
            - generic [ref=e240]:
              - generic [ref=e241]:
                - text: Origem de Dados Ativa
                - generic [ref=e242]:
                  - generic [ref=e245]: SPREADSHEET_DATA
                  - generic [ref=e246]: 0 Linhas
              - generic [ref=e248]:
                - generic [ref=e249]: "Canal Conectado:"
                - generic [ref=e250]: Planilhas Consolidadas Reais
        - generic [ref=e251]:
          - generic [ref=e252]:
            - generic [ref=e253]: Módulos de Configuração
            - button "Fontes de Dados Status e Planilhas Ativas" [ref=e254] [cursor=pointer]:
              - img [ref=e255]
              - generic [ref=e259]:
                - paragraph [ref=e260]: Fontes de Dados
                - paragraph [ref=e261]: Status e Planilhas Ativas
            - button "Importar Planilha Nova Carga Simples" [ref=e262] [cursor=pointer]:
              - img [ref=e263]
              - generic [ref=e266]:
                - paragraph [ref=e267]: Importar Planilha
                - paragraph [ref=e268]: Nova Carga Simples
            - button "Bancos de Dados Conexões Ativas" [ref=e269] [cursor=pointer]:
              - img [ref=e270]
              - generic [ref=e273]:
                - paragraph [ref=e274]: Bancos de Dados
                - paragraph [ref=e275]: Conexões Ativas
            - button "VPN / Segurança Túneis do Cliente" [ref=e276] [cursor=pointer]:
              - img [ref=e277]
              - generic [ref=e279]:
                - paragraph [ref=e280]: VPN / Segurança
                - paragraph [ref=e281]: Túneis do Cliente
            - button "Filtros do Cliente Variáveis de Controle" [ref=e282] [cursor=pointer]:
              - img [ref=e283]
              - generic [ref=e285]:
                - paragraph [ref=e286]: Filtros do Cliente
                - paragraph [ref=e287]: Variáveis de Controle
            - button "Permissões Níveis de Governança" [ref=e288] [cursor=pointer]:
              - img [ref=e289]
              - generic [ref=e292]:
                - paragraph [ref=e293]: Permissões
                - paragraph [ref=e294]: Níveis de Governança
            - button "Histórico Logs e Snapshots" [ref=e295] [cursor=pointer]:
              - img [ref=e296]
              - generic [ref=e299]:
                - paragraph [ref=e300]: Histórico
                - paragraph [ref=e301]: Logs e Snapshots
          - generic [ref=e304]:
            - generic [ref=e305]:
              - generic [ref=e306]:
                - heading "Carga e Importação Direta de Planilhas" [level=1] [ref=e307]:
                  - img [ref=e308]
                  - text: Carga e Importação Direta de Planilhas
                - paragraph [ref=e311]: Selecione uma planilha de faturamento real (Excel ou CSV) para visualizar os dados e integrá-la instantaneamente.
              - button "Cancelar" [ref=e313] [cursor=pointer]
            - generic [ref=e314] [cursor=pointer]:
              - img [ref=e316]
              - heading "Arraste seu arquivo de planilha ou clique para selecionar" [level=3] [ref=e319]
              - paragraph [ref=e320]: Suporta formatos **CSV** e **Excel (.xlsx, .xls)**. Não há limite de tamanho artificial; seus dados são salvos com segurança no navegador via IndexedDB.
              - generic [ref=e321]:
                - generic [ref=e322]: Preserva todas as linhas e colunas
                - generic [ref=e323]: Não exige nenhum mapeamento obrigatório
    - contentinfo [ref=e324]:
      - paragraph [ref=e325]: Sauron © 2026
      - paragraph [ref=e326]: Ambiente corporativo de alta confiabilidade operacional e rastreabilidade financeira auditada.
  - button "Configurar LGPD" [ref=e328]:
    - img [ref=e329]
    - generic [ref=e332]: Configurar LGPD
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Active Dataset Reflection Hotfix Verification Suite', () => {
  4   |   test('verifies that imported datasets reflect correctly in all modules and persist on reload', async ({ page }) => {
  5   |     const consoleLogs: string[] = [];
  6   |     page.on('console', msg => {
  7   |       const txt = msg.text();
  8   |       consoleLogs.push(txt);
  9   |       console.log('E2E BROWSER CONSOLE:', txt);
  10  |     });
  11  | 
  12  |     // 1. Abrir app sem dados
  13  |     await page.goto('/');
  14  | 
  15  |     // Handle initial login screen
  16  |     try {
  17  |       const userBtn = page.getByText('Lennon Marcanjo');
  18  |       await userBtn.waitFor({ state: 'visible', timeout: 5000 });
  19  |       await userBtn.click();
  20  |       
  21  |       const orgBtn = page.getByText('Consultoria Arcanjo').first();
  22  |       await orgBtn.waitFor({ state: 'visible', timeout: 5000 });
  23  |       await orgBtn.click();
  24  |       
  25  |       const wsBtn = page.getByText('Workspace Grupo Topázio').first();
  26  |       await wsBtn.waitFor({ state: 'visible', timeout: 5000 });
  27  |       await wsBtn.click();
  28  |       
  29  |       const confirmBtn = page.getByRole('button', { name: /Entrar no Centro de Comando/i });
  30  |       await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
  31  |       await confirmBtn.click();
  32  |       
  33  |       await page.waitForFunction(() => document.body.innerText.includes('Consulting OS'), { timeout: 10000 });
  34  |     } catch (e) {
  35  |       // Already logged in or no login required
  36  |     }
  37  | 
  38  |     // Dismiss LGPD if it appears
  39  |     try {
  40  |       const lgpdBtn = page.getByRole('button', { name: /Aceitar Todos/i });
  41  |       await lgpdBtn.click({ timeout: 2000 });
  42  |     } catch (e) {
  43  |       // Ignore if not present
  44  |     }
  45  | 
  46  |     // 2. Confirmar que não há mock na Central de Dados / fonte ativa padrão se não houver carregado
  47  |     const dataCenterBtn = page.getByTestId('btn-open-data-center').first();
  48  |     await dataCenterBtn.waitFor({ state: 'attached', timeout: 5000 });
  49  |     await dataCenterBtn.click({ force: true });
  50  | 
  51  |     // Close Central de Dados
  52  |     await page.keyboard.press('Escape');
  53  | 
  54  |     // 3. Abrir Importador e importar planilha/CSV
  55  |     await dataCenterBtn.click({ force: true });
  56  |     
  57  |     const importBtn = page.getByRole('button', { name: /Importar Planilha/i }).first();
  58  |     await importBtn.waitFor({ state: 'visible', timeout: 5000 });
  59  |     await importBtn.click();
  60  | 
  61  |     // Use Demo dataset instead of real file upload which can fail due to workers in e2e test
  62  |     const demoBtn = page.getByText(/Concessionárias/i).first();
> 63  |     await demoBtn.waitFor({ state: 'visible', timeout: 5000 });
      |                   ^ TimeoutError: locator.waitFor: Timeout 5000ms exceeded.
  64  |     await demoBtn.click();
  65  | 
  66  |     // Accept alerts if any
  67  |     page.on('dialog', dialog => dialog.accept());
  68  | 
  69  |     // 4. Ativar fonte (confirmar mapeamento e ativar)
  70  |     await page.getByRole('button', { name: /Confirmar Configuração/i }).click({ force: true });
  71  |     await page.getByRole('button', { name: /Ir para Ativar Fonte/i }).click({ force: true });
  72  |     await page.getByRole('button', { name: /Finalizar e Ativar Fonte/i }).first().click({ force: true });
  73  | 
  74  |     // Wait a brief moment for events to propagate
  75  |     await page.waitForTimeout(1500);
  76  | 
  77  |     // 5. Capturar logs e confirmar eventos emitidos e recebidos
  78  |     const hasDatasetActivated = consoleLogs.some(l => l.includes('DATASET_ACTIVATED_EMITTED'));
  79  |     const hasAppDatasetReceived = consoleLogs.some(l => l.includes('APP_DATASET_EVENT_RECEIVED'));
  80  |     const hasAppDatasetUpdated = consoleLogs.some(l => l.includes('APP_ACTIVE_DATASET_UPDATED'));
  81  |     
  82  |     console.log('VERIFY LOGS - DATASET_ACTIVATED_EMITTED:', hasDatasetActivated);
  83  |     console.log('VERIFY LOGS - APP_DATASET_EVENT_RECEIVED:', hasAppDatasetReceived);
  84  |     console.log('VERIFY LOGS - APP_ACTIVE_DATASET_UPDATED:', hasAppDatasetUpdated);
  85  | 
  86  |     // 9. Abrir Central de Dados de novo e confirmar fonte ativa com rowCount real
  87  |     const dataCenterBtn2 = page.getByTestId('btn-open-data-center').first();
  88  |     await dataCenterBtn2.waitFor({ state: 'attached', timeout: 5000 });
  89  |     await dataCenterBtn2.click({ force: true });
  90  |     
  91  |     // Check if the source label exists and is correct
  92  |     await expect(page.getByText('dados_automotivo_vendas.xlsx')).toBeVisible();
  93  | 
  94  |     // Close Central de Dados
  95  |     await page.keyboard.press('Escape');
  96  | 
  97  |     // 11. Abrir Dashboard e confirmar que não mostra mock data
  98  |     await page.getByText('Dashboard').first().click({ force: true });
  99  |     await expect(page.getByText('Demonstração')).not.toBeVisible();
  100 | 
  101 |     // 13. Abrir Pessoas e confirmar dados reais ou configuração pendente
  102 |     const pessoasTabBtn = page.getByText('Pessoas').first();
  103 |     if (await pessoasTabBtn.isVisible()) {
  104 |       await pessoasTabBtn.click({ force: true });
  105 |       // Verify pending config or real list
  106 |       const isPending = await page.getByText('Configuração Pendente').isVisible();
  107 |       const hasReal = await page.getByText('colaboradores').isVisible() || await page.getByText('vendedores').isVisible();
  108 |       expect(isPending || hasReal).toBe(true);
  109 |     }
  110 | 
  111 |     // 15. Abrir Financeiro e confirmar dados reais ou configuração pendente
  112 |     const financeiroTabBtn = page.getByText('Financeiro').first();
  113 |     if (await financeiroTabBtn.isVisible()) {
  114 |       await financeiroTabBtn.click({ force: true });
  115 |       // Verify pending config or real list
  116 |       const isPendingFin = await page.getByText('Configuração Pendente').isVisible();
  117 |       const hasRealFin = await page.getByText('amortização').isVisible();
  118 |       expect(isPendingFin || hasRealFin).toBe(true);
  119 |     }
  120 | 
  121 |     // 17. Recarregar página
  122 |     await page.reload();
  123 | 
  124 |     // Handle login again
  125 |     try {
  126 |       const userBtn2 = page.getByText('Lennon Marcanjo').first();
  127 |       await userBtn2.waitFor({ state: 'visible', timeout: 5000 });
  128 |       await userBtn2.click();
  129 |       
  130 |       const orgBtn2 = page.getByText('Consultoria Arcanjo').first();
  131 |       await orgBtn2.waitFor({ state: 'visible', timeout: 5000 });
  132 |       await orgBtn2.click();
  133 |       
  134 |       const wsBtn2 = page.getByText('Workspace Grupo Topázio').first();
  135 |       await wsBtn2.waitFor({ state: 'visible', timeout: 5000 });
  136 |       await wsBtn2.click();
  137 |       
  138 |       const confirmBtn2 = page.getByRole('button', { name: /Entrar no Centro de Comando/i });
  139 |       await confirmBtn2.waitFor({ state: 'visible', timeout: 5000 });
  140 |       await confirmBtn2.click();
  141 |       
  142 |       await page.waitForFunction(() => document.body.innerText.includes('Consulting OS'), { timeout: 10000 });
  143 |     } catch (e) {
  144 |       // Ignore
  145 |     }
  146 | 
  147 |     // 18. Confirmar dataset reidratado
  148 |     const dataCenterBtn3 = page.getByTestId('btn-open-data-center').first();
  149 |     await dataCenterBtn3.waitFor({ state: 'attached', timeout: 5000 });
  150 |     await dataCenterBtn3.click({ force: true });
  151 |     await expect(page.getByText('dados_automotivo_vendas.xlsx')).toBeVisible();
  152 |     await page.keyboard.press('Escape');
  153 | 
  154 |     // 19. Confirmar mock não voltou
  155 |     await expect(page.getByText('Demonstração')).not.toBeVisible();
  156 |   });
  157 | });
  158 | 
```