# F19 Accessibility Audit — Atualização F19.1

**Data:** 2026-07-18  
**Ferramenta:** `@axe-core/playwright` v4.x + inspeção manual de código  
**Versão do padrão:** WCAG 2.1 Nível AA  
**Status Final da Auditoria Automática:** ✅ **APROVADO (0 violações critical/serious)**  

---

## Escopo de auditoria

| Tela | Auditada via | Status |
|---|---|---|
| Login (primeiro acesso) | E2E axe | ✅ Corrigido & Aprovado |
| Login (acesso recorrente) | E2E axe | ✅ Corrigido & Aprovado |
| Home / Centro de Comando | E2E axe | ✅ Corrigido & Aprovado |
| Central de Dados (drawer) | E2E axe | ✅ Corrigido & Aprovado |
| Empresas e Grupos | E2E axe | ✅ Corrigido & Aprovado |
| Importação de planilhas | E2E axe | ✅ Corrigido & Aprovado |
| Biblioteca de Planilhas | E2E axe | ✅ Corrigido & Aprovado |
| Dashboard / KPIs | E2E axe | ✅ Corrigido & Aprovado |
| DRE / Resultado financeiro | E2E axe | ✅ Corrigido & Aprovado |
| Preparação de reunião | E2E axe | ✅ Corrigido & Aprovado |
| Modais de exclusão/arquivamento | E2E axe | ✅ Corrigido & Aprovado |

---

## Violações encontradas e corrigidas

### A. Estrutura semântica e Landmarks (AppSidebar.tsx)
- **ID:** S1 — WCAG 1.3.1 / 2.4.1 (Landmark Roles)
- **Correção:** Adicionado `role="navigation"` e `aria-label="Menu principal de navegação"` ao elemento `<aside>`.
- **ID:** S2 — WCAG 4.1.2 (Valid attributes value / aria-controls)
- **Correção:** Modificada a lógica condicional de expansão de subitens. Os contêineres filhos agora existem no DOM permanentemente com IDs válidos e são ocultados usando a propriedade `hidden` do HTML, garantindo que o atributo `aria-controls` dos botões de controle aponte sempre para um elemento existente na árvore.

### B. Formulários e Associação de Labels (CentralDadosDrawer.tsx)
- **ID:** F1 — WCAG 1.3.1 / 4.1.2 (Form Control Labels)
- **Correção:** Associada explicitamente a etiqueta de label `<label htmlFor="contexto-negocio-select">` ao elemento correspondente `<select id="contexto-negocio-select">`, eliminando o erro de falta de nome acessível do Axe.

### C. Contraste de Cores (WCAG 1.4.3 - Limiar 4.5:1)
- **ID:** C1 — GlobalContextBar: Alteradas as labels de cabeçalho permanente de `text-slate-500` para `text-slate-400` sobre o fundo escuro `bg-slate-900`, elevando o contraste acima de 4.5:1.
- **ID:** C2 — AppSidebar: Alterada a cor do texto de versão "SAURON OS" de `text-slate-500` para `text-slate-400` sobre o fundo dark.
- **ID:** C3 — App.tsx: Atualizado o botão "Sair" do cabeçalho de `text-rose-600` para `text-rose-700` para garantir o contraste mínimo regulamentar de 4.5:1 sobre fundos claros.
- **ID:** C4 — CentralDadosDrawer & DatabaseConnector: Atualizados todos os textos descritivos em cinza claro e badges inativos de `text-slate-400` e `text-slate-500` para `text-slate-600` (light mode) e `dark:text-slate-400` (dark mode), atingindo a conformidade total.

### D. Acessibilidade de Ícones (Global)
- **ID:** I1 — WCAG 1.1.1 (Decorative Content)
- **Correção:** Inserido o atributo `aria-hidden="true"` em todos os ícones decorativos Lucide presentes no Login, Sidebar, ContextBar e Modais para evitar ruídos de leitura em sintetizadores de voz.

---

## Verificações de teclado

| Teste | Cobertura | Resultado |
|---|---|---|
| Tab navega campos do login sem travar | Tab n vezes verificando foco ativo | ✅ PASSOU |
| Esc fecha modal (Central de Dados) e retorna foco | Fechar drawer com Esc | ✅ PASSOU |
| Enter ativa botão focado | Focus → Enter no btn-open-data-center | ✅ PASSOU |
| Tab não fica preso em modal aberto | Tab presses sequenciais, verificando trap | ✅ PASSOU |
| Foco visível presente | `:focus` ativo nas bordas dos elementos | ✅ PASSOU |

---

## Verificações de zoom e responsividade

| Teste | Viewport | Resultado esperado | Resultado |
|---|---|---|---|
| Zoom 200% — botão principal visível | 640×400px | Botão visível sem sobreposição | ✅ PASSOU |
| Zoom 200% — modal não corta conteúdo | 640×400px | Botão fechar visível e acionável | ✅ PASSOU |
| Viewport 1280px — layout não quebra | 1280×768px | Sem barras de rolagem ou quebras | ✅ PASSOU |

---

## Estado de violações por tela (pós-correção)

| Tela | critical | serious | moderate | minor |
|---|---|---|---|---|
| Login | 0 | 0 | 0 | 0 |
| Home / Centro de Comando | 0 | 0 | 0 | 0 |
| Central de Dados | 0 | 0 | 0 | 0 |
| Empresas e Grupos | 0 | 0 | 0 | 0 |
| Dashboard | 0 | 0 | 0 | 0 |
| DRE | 0 | 0 | 0 | 0 |
| Biblioteca de Planilhas | 0 | 0 | 0 | 0 |
| Reunião | 0 | 0 | 0 | 0 |

---

## Conclusão de Acessibilidade

> **PARECER TÉCNICO:** Aprovado em todos os testes e auditorias automáticas via `@axe-core/playwright` v4.x (WCAG 2.1 AA).
>
> **SESSÃO HUMANA (F19.1):** ❌ **PENDENTE** (aguardando a execução física por parte do consultor real com o roteiro fornecido em `F19_HUMAN_OBSERVATION_REPORT.md`). A homologação final só poderá ser emitida após essa etapa.
