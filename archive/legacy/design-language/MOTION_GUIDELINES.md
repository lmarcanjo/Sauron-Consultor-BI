# SAURON DESIGN LANGUAGE — MOTION GUIDELINES

As animações no Sauron OS têm um único objetivo: orientar a atenção do consultor e suavizar mudanças de estado, sem nunca atrasar a produtividade.

---

## 1. REGRAS DE OURO DA ANIMAÇÃO (SDL 10)

• **Sem Exageros**: Animações de ricochete (bounce), giros ou efeitos elásticos extravagantes são estritamente proibidos.
• **Baixa Latência (< 250ms)**: Todas as transições de interface devem completar em no máximo 250 milissegundos. Idealmente, micro-interações devem durar entre `100ms` e `150ms`.
• **Curva de Aceleração (Easing)**: Use curvas de aceleração padrão de saída suave (`ease-out`) para elementos que entram em cena, e entrada suave (`ease-in`) para elementos que saem.

---

## 2. MAPA DE TRANSIÇÕES PERMITIDAS

### A. Fade-In (Opacidade)
• **Uso**: Transições de rotas, abertura de abas e carregamento de relatórios.
• **Duração**: `150ms`.
• **Efeito**: Suaviza a renderização imediata do conteúdo, evitando o efeito de "flickering".

### B. Slide-In / Slide-Out (Deslocamento Horizontal/Vertical)
• **Uso**: Abertura de gavetas laterais (Drawers) e barras de notificações.
• **Duração**: `200ms`.
• **Direção**: Sempre na direção de onde o elemento se origina (gavetas da direita deslizam da direita para a esquerda).

### C. Scale (Micro-Interação)
• **Uso**: Hover de cartões clicáveis e feedback de clique de botões de ação tática.
• **Duração**: `150ms`.
• **Limite**: O escalonamento nunca deve exceder `1.01x` para evitar desfoque e desalinhamento de pixel.

---

## 3. EXEMPLO DE IMPLEMENTAÇÃO EM REACT (MOTION)

```tsx
import { motion } from 'motion/react';

export const FadeInContainer = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.15, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);
```
