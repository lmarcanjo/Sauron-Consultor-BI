# SPRINT 20 — ZCX Removal Log

## Log de Remoções e Absorções da Experiência ZCX

1. **Absorção da Etapa Obrigatória de Configuração**:
   - *O que mudou*: A tela de mapeamento técnico individual não é mais apresentada como barreira de entrada após importação de fonte.
   - *Substituição*: O `ZcxProposalPanel` gera um `ZcxProposal` imediatamente e pré-seleciona colunas com confiança ≥0.85.

2. **Ocultação de Termos de Arquitetura da Tela Principal**:
   - *O que mudou*: Termos internos como `profileId`, `datasetViewId`, `sourceId`, `confidence model` e `rule engine` foram movidos ou omitidos da jornada principal.
   - *Substituição*: Linguagem de consultoria explicativa (evidências rastreáveis, estatísticas de linhas/campos e percentual de confiança).

3. **Eliminação de Bloqueio em Nomes Originais**:
   - *O que mudou*: O consultor não é forçado a mapear nenhum papel semântico para visualizar dados.
   - *Substituição*: Ação explícita `[Continuar com nomes originais]` que cria uma `DatasetView` mínima usando `physicalName`.
