# SAURON DESIGN LANGUAGE — FOUNDATIONS

Este documento estabelece as bases fundamentais do **Sauron Design Language (SDL)**. Ele orienta todas as decisões de interface da plataforma, garantindo consistência visual, silêncio visual e inteligência no suporte às decisões de consultoria estratégica de alto nível.

---

## 1. PRINCÍPIOS DE DESIGN (CORE TENETS)

O Sauron não é um ERP genérico, nem um dashboard de BI tradicional. Ele é uma plataforma operacional de consultoria executiva premium. Nossas interfaces refletem os seguintes princípios:

### A. Silêncio Visual e Foco Narrativo
• **Menos Ruído, Mais Clareza**: Elementos secundários, bordas excessivas e variações tipográficas redundantes devem ser eliminados. O espaço negativo é um elemento de design ativo, não um vazio a ser preenchido.
• **Fluxo Cognitivo Natural**: As telas devem ser organizadas para contar uma história clara sobre o desempenho do negócio do cliente, guiando o olhar do consultor e do executivo aos dados críticos de forma ordenada.

### B. Confiança e Rigor Profissional
• **Honestidade Arquitetural**: Nunca simule infraestrutura, logs fakes ou termos grandiloquentes sem necessidade real. O rigor vem da precisão matemática e da clareza informativa.
• **Acabamento Premium**: Os cantos arredondados, gradientes sutis e bordas finas ultra-minimalistas criam uma sensação de sofisticação e precisão suíça.

### C. Consistência e Previsibilidade
• **Reuso Sistemático**: Nenhum botão, input, tabela ou card deve possuir variações arbitrárias de estilo. Se houver variação, deve servir a uma função clara e documentada.
• **Segurança em Tempo Real**: O usuário deve ter certeza imediata se os dados expostos são em tempo real, importados de planilha ou consolidados do banco corporativo.

---

## 2. ESCOPO E ESTRUTURA DOS TOKENS

Os tokens do SDL estão concentrados em `/src/design-system/index.ts` e são divididos em:
1. **Typography**: Pares tipográficos otimizados para legibilidade e ênfase exata.
2. **Spacing**: Escala harmônica baseada em múltiplos de 4px e 8px.
3. **Elevation**: Sombras finas e bordas de contenção tátil.
4. **Radius**: Curvaturas suaves e modernas.
5. **Animations**: Transições fluidas de baixa latência (< 250ms).
6. **Badge & Button Builders**: Construtores de classes unificadas.

---

## 3. ANTI-PATTERNS DE FUNDAÇÃO (O QUE NÃO FAZER)
• **❌ Larping Técnico**: Adicionar termos como `PORT: 3000` ou status artificiais como `● ONLINE` nos cabeçalhos apenas para preencher espaço.
• **❌ Cores em Excesso**: Utilizar gradientes coloridos excessivos que disputem a atenção com as cores semânticas dos gráficos (verde/vermelho para metas).
• **❌ Componentes Soltos**: Customizar classes de botões diretamente nos arquivos de visualização com valores arbitrários (ex: `rounded-[14px]` ou `bg-blue-453`).
