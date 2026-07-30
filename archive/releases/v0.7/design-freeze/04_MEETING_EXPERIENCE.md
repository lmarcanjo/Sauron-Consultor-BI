# SAURON SX DESIGN FREEZE — MEETING EXPERIENCE (04/10)
## docs/releases/v0.7/design-freeze/04_MEETING_EXPERIENCE.md

Este documento especifica formalmente o comportamento operacional e interativo do **Executive Meeting Mode** (Modo Reunião Executivo), o ritual culminante da entrega da consultoria de resultados. Ele detalha as transições, atalhos, modos de exibição e controles síncronos de ata em tempo real.

---

### 1. Iniciação do Modo Reunião (The Launch)
1.  O consultor sênior (Carlos) acessa o deck de slides consolidado no **Presentation Studio** e clica no botão principal de ação "Iniciar Reunião (F5)".
2.  O sistema invoca a API de tela cheia nativa do navegador (`document.documentElement.requestFullscreen()`).
3.  A barra de navegação principal da plataforma Sauron e o menu lateral de configurações colapsam suavemente, restando apenas o palco de slides central de altíssima legibilidade (Slide Stage) cercado por um plano de fundo Deep Slate profundo `#0F172A` imersivo e elegante.

---

### 2. Painel do Consultor vs. Painel do Cliente

#### Painel de Projeção do Cliente (The Board Stage)
Exibido no projetor principal ou tela da sala de conselho. Contém apenas:
- O slide ativo selecionado com fontes ampliadas e gráficos limpos.
- O período e a empresa de foco no topo.
- O Data Lineage Badge discreto no rodapé, indicando a conformidade e integridade dos dados expostos.

#### Painel do Consultor (The Cockpit Side)
Exibido na tela de controle física do laptop ou tablet do consultor. Ao expandir o painel de controle (tecla `F2` ou `M`), uma gaveta lateral síncrona se abre exibindo:
- **Notas de Apoio**: Comentários específicos adicionados previamente por Carlos para guiar seu discurso de apresentação de resultados daquele slide.
- **Timer Executivo**: Um relógio sutil que cronometra a duração da reunião para evitar prolongações improdutivas de debate.
- **Ata & Planos de Ação Rápidos**: Um formulário enxuto e imediato para lavrar atas de reuniões e criar novas recomendações acionáveis em tempo real sem precisar abrir menus ou fechar a apresentação.

---

### 3. Os Quatro Modos Operacionais Síncronos

#### A. Modo Apresentação (Presentation Mode)
*   **Ação**: Navegação linear comum de slides.
*   **Foco**: Carlos explica o faturamento, a evolução de custos e o EBITDA acumulado do mês.

#### B. Modo Discussão (Discussion Mode)
*   **Ação**: Ao ser questionado sobre um KPI ou indicador específico de queda de margem, o consultor clica no número.
*   **Foco**: Abre-se um popover discreto (Data Lineage Drawer) exibindo a linhagem completa do dado: hash SHA-256 do lote, nome do arquivo de origem bruno carregado e carimbo de data da carga. O debate é pacificado com evidências estruturadas.

#### C. Modo Plano de Ação (Action Mode)
*   **Ação**: Carlos clica no botão "Adicionar Plano de Ação" ou pressiona a tecla `A`.
*   **Foco**: O foco da digitação vai direto para o formulário de cadastramento de tarefas da gaveta lateral, permitindo lançar a nova meta (O que fazer, Responsável e Prazo) de forma imediata na frente da diretoria do cliente.

#### D. Modo Conclusão (Atas & Encerramento)
*   **Ação**: Ao término de todos os slides, Carlos clica em "Finalizar Apresentação".
*   **Foco**: O sistema compila a ata e dispara automaticamente e-mails contendo os planos de ação consolidados para os respectivos responsáveis cadastrados em assembleia.

---

### 4. Atalhos Rápidos Oficiais de Teclado (Keyboard Shortcuts)
- `Seta Direita` ou `Espaço`: Avança para o próximo slide da apresentação.
- `Seta Esquerda`: Retorna para o slide anterior.
- `F2` ou `M`: Expande ou recolhe a gaveta lateral de ata e controle síncrono do consultor.
- `A`: Abre o formulário de cadastro rápido de plano de ação na gaveta de controle.
- `ESC`: Encerra o Modo Reunião e retorna ao painel do Presentation Studio.
- `L`: Exibe/Oculta tooltip de linhagem detalhada dos dados na tela.
