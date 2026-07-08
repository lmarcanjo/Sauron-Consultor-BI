# SAURON DESIGN LANGUAGE — ACCESSIBILITY

Para garantir conformidade de nível corporativo e usabilidade excepcional por membros de conselhos executivos de qualquer faixa etária, o **Sauron OS** implementa práticas estritas de acessibilidade (A11y).

---

## 1. CONTRASTE DE CORES (SDL 14)

• **Texto Primário**: O contraste de cores para todo texto de leitura deve atingir o padrão mínimo WCAG AA (proporção mínima de 4.5:1).
  - No modo claro, use no mínimo `text-slate-800` para contraste perfeito contra `bg-white` ou `bg-slate-50`.
  - No modo escuro (Executive Dark), use `text-slate-100` ou `text-slate-200` contra fundos `bg-slate-950` ou `bg-slate-900`.
• **Status Visuais**: Qualquer indicação de status por cores (verde para meta, vermelho para perda) deve obrigatoriamente vir acompanhada de texto explícito (rótulo descritivo) ou ícone semântico correspondente para não excluir daltonistas.

---

## 2. NAVEGAÇÃO POR TECLADO E FOCO (FOCUS STATES)

• **Tab Indexing**: Elementos interativos (inputs, selects, botões, itens de menu) devem respeitar a ordem lógica natural de leitura por tabulação do navegador.
• **Focus Visible**: Todos os elementos interativos devem exibir um anel de foco bem definido quando navegados via teclado. Use utilitários Tailwind como `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none`.

---

## 3. COMPATIBILIDADE COM LEITORES DE TELA (ARIA ATRIBUTES)

• **Imagens e Gráficos**: Elementos meramente ilustrativos devem usar `aria-hidden="true"`. Ícones e gráficos essenciais de dados devem fornecer textos descritivos alternativos (`alt=""` ou `aria-label=""`).
• **Modals e Drawers**: Gavetas abertas devem receber foco programático imediato e interceptar fechamento ao pressionar a tecla `Escape`.
