# SAURON DESIGN LANGUAGE — VISUAL LANGUAGE

Este documento descreve as diretrizes visuais unificadas da marca e do produto **Sauron OS**.

---

## 1. PALETA DE CORES E SEMÂNTICA

O Sauron utiliza uma paleta sóbria e corporativa, focada na legibilidade extrema sob qualquer condição de luminosidade (incluindo salas de projeção executiva).

### Cores Base (Tailwind Colors):
• **Primary (Confiança)**: `blue` (principalmente `blue-600` para botões ativos, `blue-500` para status).
• **Secondary (Sofisticação)**: `indigo` (usado para destaques estratégicos ou marcas específicas).
• **Success (Superação de Metas)**: `emerald` (para indicar faturamento acima da meta e lucro líquido saudável).
• **Warning (Atenção / Desvio Leve)**: `amber` (para desvios moderados que demandam monitoramento).
• **Danger (Crítico / Desvio Grave)**: `rose` (para metas com atingimento muito abaixo do esperado ou custos explodindo).
• **Neutral (Estrutural)**: `slate` (do tom claro ao escuro profundo como `slate-950` na Executive Session).

---

## 2. TEMAS E AMBIENTES (LIGHT VS. EXECUTIVE DARK)

A plataforma se adapta de acordo com o ritual do usuário:

### A. High-Contrast Light Mode
• **Foco**: Trabalho diário, digitação de dados, cruzamento de planilhas e análise de Dicionário de Dados.
• **Estrutura**: Fundo predominantemente branco (`bg-white`) com divisores extremamente sutis em `slate-200/80`.
• **Tipografia**: Texto cinza-escuro charcoal (`text-slate-800` ou `text-slate-900`) para excelente contraste.

### B. Executive Dark Mode (Imersivo)
• **Foco**: Modo reunião (Executive Session) e apresentações de alta governança.
• **Estrutura**: Fundo escuro profundo (`bg-slate-950`) para evitar cansaço visual e simular uma sala de cinema tática.
• **Divisores**: Bordas e linhas em `slate-900` ou `slate-800`.
• **Tipografia**: Texto claro suave (`text-slate-100` e `text-slate-300`).

---

## 3. DESIGN DE DETALHES (BORDERS & SHADOWS)

• **Bordas finas**: Divisórias de cards e seções usam bordas de `1px` (`border-slate-100` ou `border-slate-900` em modo escuro). Não use bordas espessas.
• **Sombra Inteligente**: As sombras seguem o token de elevação (`DesignSystem.Elevation`). Use sombras discretas para elevar elementos interativos (cards clicáveis) e evite sombras pesadas de estilo neumórfico.
