# SAURON SX DESIGN FREEZE — STORY BUILDER (05/10)
## docs/releases/v0.7/design-freeze/05_STORY_BUILDER_EXPERIENCE.md

Este documento especifica a experiência de uso e as mecânicas operacionais do **Story Builder**, o editor dinâmico da plataforma Sauron que capacita os consultores a montarem narrativas de impacto estratégico com base em dados reais sem depender de editores de slides externos.

---

### 1. O Conceito de Storytelling de Resultados
No Sauron SX, uma apresentação não é apenas um carrossel de fotos; é uma narrativa estratégica. O consultor sênior (Carlos) cria uma "história" sequenciando cartões analíticos (slides) pré-configurados que conectam de forma lógica os desvios financeiros aos planos de ação correspondentes.

---

### 2. A Mecânica de Montagem (Story Grid)
O Story Builder oferece uma interface dividida em três áreas funcionais:
- **Painel Lateral de Modelos (Templates Bar)**: Contém estruturas pré-montadas de apresentações baseadas em melhores práticas (e.g., "Fechamento Trimestral de Caixa", "Análise de Gargalos de Margem por Filial").
- **Timeline de Slides (Story Line)**: Uma trilha horizontal contendo miniaturas numeradas representativas de cada slide do deck ativo. O consultor reordena a narrativa simplesmente arrastando e soltando (`drag and drop`) as miniaturas na linha do tempo.
- **Área de Palco Principal (Preview Canvas)**: Mostra a visualização em tempo real de como o slide selecionado será projetado para a diretoria do cliente.

---

### 3. Mecânica de Salvamento e Persistência
- **Autosave Silencioso**: Toda reordenação de slides, adição de novos blocos ou edição de notas explicativas é salva de forma automática no cache de estados persistido de forma transparente no navegador do consultor.
- **Evite Perda de Trabalho**: Se o consultor tentar fechar a aba do navegador com edições pendentes ou no meio de um processo de carregamento, o sistema apresenta um alerta nativo discreto de confirmação para evitar perdas acidentais de decks preparados.

---

### 4. Criação e Reutilização de Templates Personalizados
- **Salvar como Template do Escritório**: Se o consultor desenvolveu uma sequência de slides altamente customizada que funciona perfeitamente para um determinado setor de mercado, ele pode clicar em "Salvar Sequência como Template".
- **Disponibilização Coesa**: Esse template customizado é gravado nas configurações da conta e passa a ficar visível no carrossel de modelos de todos os outros consultores do mesmo Tenant (escritório de consultoria), garantindo escalabilidade de entrega metodológica para o time corporativo de campo.
