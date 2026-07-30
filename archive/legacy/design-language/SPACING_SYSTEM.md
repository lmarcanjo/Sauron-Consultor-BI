# SAURON DESIGN LANGUAGE — SPACING SYSTEM

Para eliminar espaçamentos arbitrários e garantir ritmo visual consistente em todas as resoluções de tela, o **Sauron OS** adota uma grade harmônica baseada em múltiplos estritos de **4px**.

---

## 1. ESCALA DE ESPAÇAMENTO OFICIAL (SDL 2)

Todas as margens, preenchimentos (paddings) e espaçamentos internos (gaps) devem obrigatoriamente utilizar um dos valores abaixo:

| Pixel | Token Tailwind | Uso Recomendado |
| :--- | :--- | :--- |
| **4px** | `1` / `p-1` | Micro-ajustes de ícones, espaçamentos internos muito pequenos. |
| **8px** | `2` / `p-2` | Gaps entre botões de toolbar, rótulo e input de formulários. |
| **12px** | `3` / `p-3` | Margens internas de itens de lista ou tabelas compactas. |
| **16px** | `4` / `p-4` | Padding padrão de cabeçalhos de cards e menus laterais. |
| **24px** | `6` / `p-6` | Padding interno de cards complexos e espaçamento de grades. |
| **32px** | `8` / `p-8` | Margens externas de seções amplas de relatórios. |
| **48px** | `12` / `p-12` | Espaçamento vertical entre grandes blocos de narrativa. |
| **64px** | `16` / `p-16` | Margem superior de telas cheias de apresentação executiva. |

---

## 2. REGRAS DE GRID E FLUIDEZ (RESPONSIVIDADE)

• **Gaps de Grade**: Use sempre `gap-4` ou `gap-6` ao definir grades de cards (`grid-cols-1 md:grid-cols-3 gap-6`). Nunca use gaps ímpares ou arbitrários como `gap-[15px]`.
• **Contenção Máxima**: Para evitar que o conteúdo se estenda infinitamente em monitores ultrawide de salas de reunião, toda página de trabalho deve possuir uma classe limitadora:
  ```html
  <div className="w-full max-w-7xl mx-auto px-6">
  ```

---

## 3. ANTI-PATTERNS (O QUE NÃO FAZER)
• **❌ Arbitrar Medidas**: Usar classes de margem customizada do tipo `mt-[17px]`, `px-[21px]`, `pl-7` ou `pb-9`.
• **❌ Espaçamento Idêntico Infinito**: Usar o mesmo espaçamento `p-4` para todos os elementos, tornando o layout "quadrado" e monótono. Alterne paddings para criar hierarquia de profundidade.
