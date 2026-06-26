# SAURON SX — COMPONENT LIBRARY (v0.7)
## Biblioteca Oficial de Componentes Reutilizáveis

Este documento define e cataloga os componentes visuais e analíticos padronizados que formam as interfaces de usuário da plataforma Sauron. Todos os componentes devem seguir estritamente as regras de estilo de Tailwind CSS e usar a iconografia exclusiva da biblioteca `lucide-react`.

---

### 1. Componentes Analíticos e Financeiros (Cards & Visualizers)

#### KPI Card (Card de Indicador de Desempenho)
*   **Descrição**: Exibe um indicador financeiro isolado (e.g., Faturamento, EBITDA, Margem).
*   **Props Necessárias**: `title`, `value`, `previousValue`, `trendDirection` (up, down, stable), `lineageHash`.
*   **Design**: Tipografia refinada, valor principal destacado em display (Space Grotesk), percentual de variação de tendência lateral discreto com contraste de cor sem poluição visual.

#### Trend Card (Card de Análise de Tendência)
*   **Descrição**: Mostra a evolução histórica de um indicador ao longo dos últimos meses.
*   **Props Necessárias**: `title`, `chartData` (array de meses e valores), `forecastValue`.
*   **Design**: Gráfico de linha sutil (D3/Recharts) sem eixos pesados ou poluição de margem. Foco na trajetória da linha.

#### Anomaly Alarm Widget (Alerta de Anomalias)
*   **Descrição**: Banner informativo destacando um desvio detectado.
*   **Props Necessárias**: `indicatorName`, `deviationPercent`, `severity` (alta, média), `explanationText`.
*   **Design**: Fundo cinza profundo com barra lateral vermelha ou amarela discreta. Ícone de alerta `AlertTriangle` em cor de destaque.

#### Benchmark Rank Bar (Barra de Comparação Comparativa)
*   **Descrição**: Gráfico de barras horizontais empilhadas comparando a performance de filiais.
*   **Props Necessárias**: `items` (array de nomes de filiais e valores), `highlightedItem` (filial do foco ativo).
*   **Design**: Barras limpas em tons de cinza grafite, destacando em azul profundo a filial em foco.

---

### 2. Componentes de Ingestão e Governança

#### Lineage Badge (Selo de Linhagem e Auditoria)
*   **Descrição**: Badge indicador de que o dado visualizado passou pela esteira de auditoria.
*   **Props Necessárias**: `batchId`, `ingestedAt`, `checksum`.
*   **Design**: Pequeno selo circular cinza com ícone `ShieldCheck` verde discreto. Ao passar o mouse (hover), exibe um tooltip com a linhagem e o hash completo.

#### Audit Log Panel (Histórico de Cargas)
*   **Descrição**: Painel de visualização de auditoria de logs de importação.
*   **Props Necessárias**: `logs` (array de eventos e usuários).
*   **Design**: Tipografia mono (JetBrains Mono), estilo terminal simplificado de alta legibilidade corporativa.

---

### 3. Componentes do Presentation Studio

#### Story Block (Miniatura de Slide)
*   **Descrição**: Bloco manipulável por drag-and-drop na linha do tempo do Story Builder.
*   **Props Necessárias**: `slideId`, `slideTitle`, `slideType` (KPI, DRE, Anomaly), `isSelected`.
*   **Design**: Borda suave arredondada com sombra fina. Linha azul de destaque quando selecionado para edição.

#### Meeting Controller / Drawer (Ata Síncrona)
*   **Descrição**: Gaveta colapsável lateral direita que registra anotações em tempo real.
*   **Props Necessárias**: `activeMeetingId`, `onSaveAction`, `onClose`.
*   **Design**: Fundo neutro limpo, inputs de formulário estruturados com targets confortáveis de clique e foco.
