# DIRETRIZES DE AJUSTES VISUAIS (VISUAL FIXES) — SAURON PLATFORM
## SPRINT Ω+QA — PADRONIZAÇÃO ESTÉTICA DO DESIGN SYSTEM

---

## 1. APRESENTAÇÃO E MÉTRICA ESTÉTICA

A qualidade visual de uma plataforma C-Suite é o seu cartão de visitas de autoridade. O **Sauron Platform** precisa transmitir extrema precisão. Diferenças sutis em arredondamentos de cantos, espaçamentos excessivos, desalinhamentos horizontais ou cores de gráficos genéricas quebram a imersão de excelência.

Este relatório detalha os desalinhamentos visuais identificados no produto atual e estabelece as regras estritas para sua correção estética, garantindo um produto uniforme de alta fidelidade.

---

## 2. LISTA DE AJUSTES ESTÉTICOS E VISUAIS DETALHADOS

### Glitch 1 — Inconsistência nos Arredondamentos de Cantos (Border Radius)
* **Localização**: Através de todas as abas da aplicação.
* **Diagnóstico**: Modais de configuração de VPN usam `rounded-md`, cards de KPI do Cockpit Executivo usam `rounded-lg`, botões principais usam `rounded-full` e as tabelas financeiras usam `rounded-none`. Essa mistura de escalas causa desconforto visual e fragmenta a consistência do design system.
* **Ação Corretiva**: Padronizar as classes de arredondamento de forma sistemática no CSS:
  * **Controles pequenos, tags, badges e botões**: `rounded-lg` (8px).
  * **Cards de KPI, painéis secundários, quadros do Bento Grid**: `rounded-xl` (12px).
  * **Modais grandes, Drawers retráteis, caixas flutuantes de login**: `rounded-2xl` (16px).
* **Prioridade**: **Alta**

---

### Glitch 2 — Inconsistência de Cores de Gráficos (Paleta Recharts Genérica)
* **Localização**: Gráficos das abas **Comercial**, **DRE**, **Financeiro** e **Vendedores**.
* **Diagnóstico**: Os gráficos de linha e de pizza estão renderizando cores padrão e brilhantes demais do Recharts (rosa choque, azul puro, verde bandeira). Essas cores entram em conflito estético direto com as cores corporativas sóbrias e profissionais do Sauron (tons ardósia, cinzas quentes e azuis marinhos).
* **Ação Corretiva**:
  * Substituir o vetor estático de cores dos gráficos por uma paleta coesa e exclusiva do design system do Sauron:
    - **Cor Principal**: `slate-800` (azul escuro sóbrio).
    - **Cores Secundárias**: `indigo-600` e `blue-500` (tons corporativos complementares).
    - **Cor de Destaque / Alerta**: `emerald-500` para sucesso, `amber-500` para advertência moderada, `rose-500` para perdas de faturamento.
* **Prioridade**: **Média**

---

### Glitch 3 — Ruído Visual de Linhas de Grade em Tabelas ("Jail Effect")
* **Localização**: Tabelas de DRE (`IntelligentDRETab.tsx`) e Tabelas de Faturamento por CNPJ.
* **Diagnóstico**: O uso de bordas grossas e escuras de cinza separando todas as células verticalmente e horizontalmente polui a leitura de números massivos, competindo visualmente com os próprios dados.
* **Ação Corretiva**:
  1. Remover todas as bordas verticais (`border-r`, `border-l`) das tabelas.
  2. Utilizar apenas bordas horizontais ultrafinas em tom de cinza suave (ex: `border-slate-100` ou `border-slate-800/40` em modo escuro).
  3. Adicionar cores intercaladas suaves em linhas pares (`even:bg-slate-50/40` ou `even:bg-slate-900/30` em modo escuro) para guiar o olhar do consultor horizontalmente sem ruído.
* **Prioridade**: **Alta**

---

### Glitch 4 — Espaçamentos Desbalanceados (Container Padding Issues)
* **Localização**: Margens de página da sidebar e painel de controle principal.
* **Diagnóstico**: Algumas páginas espremem o conteúdo diretamente nas bordas da tela (ex: `p-2` ou `p-3`), enquanto outras aplicam espaçamentos exagerados (`p-10`), causando a quebra do grid na viewport e rolagens horizontais desnecessárias em telas de laptops padrão.
* **Ação Corretiva**:
  1. Padronizar a margem externa global do painel de controle principal como `p-6 md:p-8`.
  2. Padronizar o espaçamento interno dos cards de conteúdo como `p-5 md:p-6`.
  3. Garantir o uso de `max-w-7xl mx-auto w-full` para centralizar elegantemente o Bento Grid sem distorcer visualizações em monitores ultrawide.
* **Prioridade**: **Média**

---

### Glitch 5 — Espessura Inconsistente de Ícones (Lucide-React Stroke Weight)
* **Localização**: Menus, Sidebar e botões de comando.
* **Diagnóstico**: Os ícones importados da biblioteca `lucide-react` exibem diferentes larguras de linha de contorno (alguns usam a espessura padrão `strokeWidth={2}`, outros usam `strokeWidth={1.5}` ou `strokeWidth={1}`), enfraquecendo a unidade visual da interface.
* **Ação Corretiva**:
  * Passar o parâmetro global ou individual em todos os componentes de ícone para usar estritamente `strokeWidth={1.75}`, o que confere uma estética moderna, sofisticada e equilibrada.
* **Prioridade**: **Baixa**

---

## 3. COMPROMISSO COM O PIXEL-PERFECT

Toda modificação estética e visual realizada nas próximas sprints de estabilização deve ser validada por comparação rigorosa antes e depois. Layouts ERP datados devem dar lugar a designs fluidos, cleans e de alto impacto que apoiem o consultor na entrega de recomendações com alto valor agregado.

---
*Relatório de design aprovado e chancelado pelo comitê de identidade de marca e engenharia de interface do Sauron OS.*
