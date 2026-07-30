# SAURON SX DESIGN FREEZE — SYSTEM LAYOUT (01/10)
## docs/releases/v0.7/design-freeze/01_LAYOUT_SYSTEM.md

Este documento especifica o sistema de grids, containers e regras de layout responsivo adotado para a plataforma Sauron a partir da Release v0.7. Ele estabelece os limites de visualização de tela para Notebooks, Desktops e Tablets, garantindo perfeita legibilidade e consistência na sala de reunião.

---

### 1. Grid Principal e Estrutura Geral (Shell)
O Sauron SX opera sob uma estrutura de tela dividida em 3 blocos principais:
- **Menu Lateral Reutilizável (Sidebar Nav)**: Largura fixa de `240px` (`w-60` no Tailwind) em resoluções Desktop e Notebook. Pode ser colapsada para ícones (`64px` / `w-16`) para liberar espaço de exibição.
- **Cabeçalho Executivo (Header)**: Altura fixa de `64px` (`h-16`) que flutua no topo do conteúdo principal, mantendo o controle do projeto ativo, filtros globais e o status da linhagem de dados.
- **Área Útil de Trabalho (Main Stage Canvas)**: Ocupa o restante da tela, expandindo-se dinamicamente. Possui uma limitação de largura máxima de `1440px` (`max-w-7xl` ou `max-w-screen-2xl`) com centralização automática (`mx-auto`) para evitar estiramento horizontal excessivo de gráficos em telas Ultra-Wide.

---

### 2. Espaçamentos Consistentes (Spacing Rhythm)
Adotamos o sistema de múltiplos de 4 (escala de espaçamento padrão do Tailwind) para garantir harmonia espacial:
- **Padding de Stage**: `p-6` (`24px`) ou `p-8` (`32px`) para dar espaço de respiração.
- **Margem de Cards**: `gap-6` (`24px`) em layouts grid de dois ou três elementos.
- **Espaçamento de Itens Internos**: `p-4` (`16px`) para preenchimento de tabelas e listas de indicadores.

---

### 3. Breakpoints e Adaptações de Tela

#### Desktop (Grande Projeção - 1920px ou mais)
- O menu lateral é mantido aberto por padrão.
- O Stage opera com grids de 3 colunas para KPIs e visualizações de anomalias simultâneas.
- Foco absoluto em dashboards panorâmicos de alta densidade executiva.

#### Notebook (Tela de Campo - 1366px a 1440px)
- O menu lateral pode ser colapsado automaticamente para o modo "Apenas Ícones" (`64px`) se o usuário entrar em abas analíticas complexas.
- O Stage se adapta para grids de 2 colunas para manter a legibilidade das tabelas de DRE.

#### Tablet (Visita de Campo - 1024px)
- O menu lateral é ocultado inteiramente, transformando-se em uma gaveta flutuante acionada por um botão de hambúrguer discreto no cabeçalho.
- O Stage passa a ser de coluna única vertical com rolagem suave.
- Alvos de toque (touch targets) de todos os botões e filtros são expandidos para, no mínimo, `44px` de área de colisão clicável.

---

### 4. Containers e Proteções de Overflow
- **Proibido Overflow de Tela**: A interface principal não deve apresentar rolagem dupla (scrollbars concorrentes). Scrollbars de tabelas densas ou históricos de auditoria de logs de importação devem ser contidos localmente usando propriedades CSS (`overflow-y-auto max-h-[400px]`).
- **Cards Finitos**: Cards financeiros operam com altura autogerida, impedindo que gráficos amadores espremam rótulos ou truncagem de textos de indicadores críticos.
