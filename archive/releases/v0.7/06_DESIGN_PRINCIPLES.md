# SAURON SX — DESIGN PRINCIPLES (v0.7)
## Diretrizes de Identidade Visual e Princípios de Design Executivo

Este documento estabelece as diretrizes estéticas que orientam todas as decisões de interface da plataforma Sauron. Nosso design é planejado para transmitir seriedade, segurança técnica e alta sofisticação corporativa (estilo Enterprise Premium).

---

### 1. Paleta de Cores Oficial

Adotamos uma paleta de cores extremamente enxuta, pautada em contrastes limpos e confortáveis para apresentações de salas de reunião:

| Amostra Visual | Nome da Cor | Código HEX | Utilização e Semântica de Interface |
| :--- | :--- | :--- | :--- |
| **Fundo Principal** | Deep Charcoal | `#0F172A` | Fundo imersivo escuro (Modo Reunião e visualizadores) |
| **Fundo Secundário** | Slate Slate | `#1E293B` | Fundo de cards, painéis e elementos secundários |
| **Texto de Destaque** | Pristine White | `#F8FAFC` | Títulos principais, valores de KPIs grandes |
| **Texto Secundário** | Cool Gray | `#94A3B8` | Notas explicativas, legendas e textos de apoio |
| **Destaque Azul** | Royal Marine | `#3B82F6` | Botões de ação primária, seleção de slides |
| **Sucesso / Ação** | Emerald Success | `#10B981` | Tendências de alta positiva, linhagem confirmada |
| **Alerta / Crítico** | Crimson Alert | `#EF4444` | Alertas de anomalias e desvios de alta gravidade |

---

### 2. Princípios de Organização Espacial

*   **Espaço Negativo Proposital (Negative Space)**: A informação de finanças já é naturalmente pesada e densa. A interface de exibição deve "respirar". Proibido espremer gráficos ou enfileirar dezenas de tabelas paralelas em uma única visualização.
*   **Ritmo Visual**: Use margens consistentes (padrões de espaçamento de escala múltipla de 4, como `p-4`, `p-6`, `p-8` do Tailwind). Evite uniformizar todo o espaçamento do sistema de forma mecânica (identidade visual robótica).
*   **Controle de Densidade**: Tabelas densas de transações devem ser reservadas para gavetas colapsáveis ou modais de aprofundamento. A tela de primeiro nível deve sempre ser limpa e focada em resultados consolidados.

---

### 3. Tipografia Corporativa

*   **Títulos e Displays (Font Sans)**: **Space Grotesk** ou **Outfit**. Passa a sensação de tecnologia moderna, controladoria refinada e sofisticação de produto SaaS de alto nível.
*   **Textos Gerais e Tabelas**: **Inter**. Altíssima legibilidade em telas de qualquer tamanho de projeção de sala de reunião.
*   **Dados Técnicos, Hashes e Logs (Font Mono)**: **JetBrains Mono** ou **Fira Code**. Utilizada exclusivamente para demonstrar hashes SHA-256 de linhagem e status de auditorias de dados.

---

### 4. Combate à Poluição Visual (Anti-Larping)

*   **Humildade de Interface**: Não invente logs técnicos fictícios na tela, barras de carregamento de brincadeira ou textos de status como *"● INSTÂNCIA OPERACIONAL ONLINE"*.
*   **Zero Gráficos Inúteis**: Não insira gráficos complexos (como gráficos tridimensionais, medidores de ponteiro tipo velocímetro) que apenas poluem a área útil sem agregar poder analítico de recomendação para o consultor sênior.
*   **Foco no Pragmático**: A tela ideal do Sauron deve parecer um relatório de consultoria impresso em papel off-white texturizado: limpa, contrastada, focada em números, metas e caminhos de correção estratégica.
