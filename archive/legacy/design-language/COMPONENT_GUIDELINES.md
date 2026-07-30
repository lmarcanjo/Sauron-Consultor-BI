# SAURON DESIGN LANGUAGE — COMPONENT GUIDELINES

Este guia padroniza a estrutura interna e o comportamento interativo dos componentes essenciais do **Sauron OS**.

---

## 1. CARDS (SDL 3)
Todos os cards devem parecer do mesmo fabricante de hardware premium:
• **Padding**: Sempre `p-5` (`DesignSystem.Spacing.cardPadding`).
• **Bordas e Cantos**: Arredondamento grande de `rounded-2xl` (`DesignSystem.Radius.2xl`) e bordas suaves `border-slate-200/60` (Light) ou `border-slate-800/80` (Dark).
• **Header unificado**: Título em letras maiúsculas discretas (`text-xs font-bold tracking-wider`) acompanhado de um subtítulo explicativo (`text-[10px] text-slate-400 font-mono`).
• **Ações contextuais**: Posicionadas estritamente no canto superior direito do header em formato de barra de ferramentas minimalista.

---

## 2. TABLES (SDL 4)
As tabelas no Sauron evitam o visual denso e poluído de ERPs tradicionais:
• **Design sem linhas verticais**: Apenas linhas horizontais finas (`divide-y divide-slate-100`).
• **Linha Ativa e Seleção**: Hover de fundo super sutil (`hover:bg-slate-50/50`) e linha ativa de foco com borda de realce esquerda de `2px` em cor azul.
• **Densidade Configurável**: Suporte a espaçamentos reduzidos (`py-1.5`) para auditoria técnica ou espaçamentos executivos amplos (`py-3`) para relatórios.
• **Ações Contextuais**: Botões de ação rápida ou menus suspensos devem aparecer apenas no hover da linha ou agrupados no final à direita.

---

## 3. DRAWERS (SDL 5)
Os drawers (gavetas de contexto) estendem painéis sem quebrar o fluxo:
• **Estrutura de 4 blocos**:
  1. *Header*: Título do contexto com botão de fechamento unificado no topo direito.
  2. *Descrição*: Subtítulo claro explicando a natureza do painel.
  3. *Conteúdo*: Scroll independente com scrollbar invisível ou customizada fina.
  4. *Footer*: Ações primárias alinhadas à direita com divisor superior sutil.
• **Fundo e Backdrop**: Backdrop escurecido (`bg-slate-950/40 backdrop-blur-xs`) para isolar visualmente o painel principal.

---

## 4. FORMS & INPUTS (SDL 6)
• **Estética**: Inputs limpos com fundo branco (`bg-white`) ou preto profundo (`bg-slate-950`), borda sutil e foco com anel sutil de `ring-1 ring-blue-500`.
• **Tipografia**: Textos digitados em `text-xs font-medium`.
• **Validação**: Mensagens de erro em vermelho-alerta (`text-rose-500 text-[10px] font-medium mt-1 font-sans`).

---

## 5. BUTTONS (SDL 7)
Os botões seguem a risca os construtores de classe unificados (`DesignSystem.Button.build`):
• **Primary (Ações Principais)**: Azul sólido com borda e sombra fina (`bg-blue-600 hover:bg-blue-700`).
• **Secondary/Outline (Ações de Apoio)**: Fundo branco/escuro com borda cinza fina.
• **Ghost (Ações Neutras)**: Sem cor de fundo, apenas destaque no hover.
• **Danger (Ações Destrutivas)**: Vermelho sólido (`bg-rose-600 hover:bg-rose-700`).
• **Success (Ações de Conclusão)**: Verde sólido (`bg-emerald-600 hover:bg-emerald-700`).
