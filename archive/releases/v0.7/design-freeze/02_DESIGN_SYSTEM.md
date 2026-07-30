# SAURON SX DESIGN FREEZE — DESIGN SYSTEM (02/10)
## docs/releases/v0.7/design-freeze/02_DESIGN_SYSTEM.md

Este documento especifica a linguagem visual definitiva da plataforma Sauron a partir da Release v0.7. Ele documenta as cores, fontes, sombras, raios, bordas, regras para o Modo Escuro e os padrões de maturidade visual que garantem que o software transmita solidez corporativa premium.

---

### 1. Paleta de Cores Definitiva (Tonalidades)

Adotamos uma paleta executiva com forte apelo em tons de ardósia, cinzas neutros de alta densidade, brancos puros e contrastes pontuais de alertas sem saturações excessivas (estilo neon vulgar).

#### Cores de Fundo (Canvas)
- **Deep Slate (Fundo Escuro)**: `#0F172A` (Tailwind `slate-900`). Usado para o Modo Reunião Imersivo.
- **Pristine White (Fundo Claro)**: `#F8FAFC` (Tailwind `slate-50`). Nosso padrão corporativo para o workspace de trabalho diurno.
- **Soft Border**: `#E2E8F0` (Tailwind `slate-200`) em Light Mode ou `#334155` (Tailwind `slate-700`) em Dark Mode.

#### Cores de Texto (Typography Colors)
- **Primary Ink**: `#0F172A` (Light Mode) | `#F8FAFC` (Dark Mode). Máximo contraste.
- **Muted Gray**: `#64748B` (Light Mode) | `#94A3B8` (Dark Mode). Usado em metadados de auditoria e hashes de linhagem.

#### Cores de Status e Ações
- **Executive Blue (Royal)**: `#1E40AF` (Tailwind `blue-800`). Representa integridade e governança.
- **Emerald Growth (Sucesso)**: `#065F46` (Light Mode) | `#10B981` (Dark Mode). Para tendências e metas batidas.
- **Crimson Alerta (Crítico)**: `#991B1B` (Light Mode) | `#EF4444` (Dark Mode). Para anomalias e desvios sérios de custos.

---

### 2. Tipografia e Escala de Títulos
Utilizaremos fontes do Google Fonts importadas de forma transparente no CSS global da aplicação:
- **Títulos de Grande Impacto (Display)**: **Space Grotesk** ou **Outfit** (com peso `semibold` e espaçamento fino `tracking-tight`). É uma fonte geométrica limpa que denota precisão e modernidade.
- **Textos de Conteúdo e Tabelas (Body & Data)**: **Inter**. Reconhecida pela sua incrível legibilidade de números em telas de baixa resolução ou projeções distorcidas de salas de conselho.
- **Dados de Engenharia, Hashes SHA-256 e Logs**: **JetBrains Mono**.

---

### 3. Raio de Bordas e Sombras (Radii & Shadows)
- **Borda de Cards e Painéis**: `rounded-xl` (`12px` de raio). Fornece cantos arredondados discretos e modernos, sem passar a imagem infantil de cantos excessivamente redondos ou a imagem áspera de cantos 100% retos.
- **Sombras (Drop Shadows)**:
  - Cards Padrão: `shadow-sm` para Light Mode. Evite sombras grossas que geram ruído visual ("sujeira" na tela).
  - Componentes Ativos ou Popups: `shadow-md` ou `shadow-lg` com cor de dispersão suave (`shadow-slate-200/50`).

---

### 4. Padrões de Estados (States)
- **Hover**: Transição suave de cor de fundo utilizando a regra `transition-colors duration-200`.
- **Focus**: Anéis de foco discretos e elegantes utilizando outline Royal Blue com borda branca interna de isolamento.
- **Loading**: Skeleton loaders cinzas que reproduzem as formas exatas das fontes e gráficos que estão sendo carregados. Proibido colocar spinners circulares gigantes girando no centro de telas financeiras sem preenchimento.

---

### 5. Padrões de Entrega Enterprise
Nossa interface deve transmitir a robustez de um terminal de inteligência executiva de elite:
- **Ausência de Ícones Genéricos**: Não misture conjuntos de ícones diferentes. Use única e exclusivamente o repositório oficial do `lucide-react`.
- **Bordas Delgadas**: Use bordas finas de 1px (`border-[1px]`) em vez de linhas grossas para delimitar seções de relatórios.
- **Espaço Generoso**: Cada seção principal deve ser cercada por áreas sem conteúdo (negative space), permitindo ao cérebro do tomador de decisões focar na informação chave que demanda ações práticas.
