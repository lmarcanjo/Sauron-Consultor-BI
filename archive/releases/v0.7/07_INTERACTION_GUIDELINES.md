# SAURON SX — INTERACTION GUIDELINES (v0.7)
## Diretrizes de Interação, Feedback e Comportamento Reativo

Este documento orienta os comportamentos dinâmicos, feedbacks imediatos, tratamento de loading, estados de interação e as micro-animações da plataforma Sauron a partir da **Release v0.7**.

---

### 1. Estados de Interação (Hover, Focus, Active)

*   **Botões de Ação**: Ao passar o cursor (hover), os botões devem sofrer alteração sutil de opacidade ou brilho de cor (`hover:brightness-110` ou `hover:bg-opacity-90` do Tailwind) de forma suave.
*   **Elementos Focáveis (Inputs)**: Todos os campos de digitação devem receber contorno azul sutil (`focus:ring-2 focus:ring-blue-500 focus:border-transparent`) para sinalizar foco de digitação claro para o usuário.
*   **Arrastar e Soltar (Drag and Drop)**: No Story Builder, ao pegar um slide para reordenar, o elemento agarrado deve receber uma sombra pronunciada (`shadow-2xl`) e uma leve rotação de 1 grau para passar feedback físico de suspensão. O local de encaixe (drop target) deve piscar em tracejado azulRoyal discreto.

---

### 2. Comportamentos de Carregamento (Loading & Transition)

*   **Evite Bloqueio Geral de Tela**: Não use telas cinzas de travamento total com "Aguarde... Carregando sistema" a menos que seja um processo crítico de sincronização de banco de dados.
*   **Skeleton Screens**: Prefira usar caixas de carregamento que mimetizam a estrutura visual final do componente (Skeletons animados com gradiente cinza pulsante) para carregar gráficos e listas de auditoria.
*   **Transição de Páginas**: As mudanças de telas e abas operacionais do consultor devem utilizar transições de fade suave (suportadas pelo `motion` da biblioteca `motion/react`) para evitar quebras visuais bruscas que causam fricção de uso.

---

### 3. O Modo Reunião (SX) e Responsividade de Projeção

*   **Comportamento Tela Cheia**: Ao ativar o Modo Reunião, a aplicação deve solicitar e expandir o palco de slides para o modo imersivo nativo do navegador (`document.documentElement.requestFullscreen()`).
*   **Auto-Ajuste de Palco (Stage Scaling)**: O container central de exibição dos slides (Slide Canvas) não deve ter dimensões fixadas em pixels. Ele escuta as dimensões de resize do monitor através de um `ResizeObserver` e redistribui proporcionalmente a largura das fontes e margens para que tudo caiba perfeitamente na projeção (ideal para retroprojetores corporativos e telas ultrawide).
*   **Atalhos Rápidos de Teclado**:
    *   `Seta Direita` ou `Espaço` -> Próximo Slide.
    *   `Seta Esquerda` -> Slide Anterior.
    *   `F2` ou `M` -> Abrir/Fechar Gaveta lateral de ata e cadastro de planos de ação.
    *   `ESC` -> Sair do Modo Reunião.
