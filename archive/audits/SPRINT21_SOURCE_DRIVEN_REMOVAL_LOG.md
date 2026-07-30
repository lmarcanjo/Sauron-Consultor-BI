# SPRINT 21.1 — Source-Driven Removal Log

## Log de Remoção de Componentes e Fluxos Antigos

1. **Remoção de `ModuleFieldMappingPanel.tsx`**:
   - *Motivo*: O componente exibia formulários repetidos em 5 cards tentando enquadrar a fonte em papéis predefinidos (`Valor`, `Custo`, `Pessoa`, etc.).
   - *Impacto*: O arquivo `/src/components/ModuleFieldMappingPanel.tsx` foi removido do repositório após confirmação de zero consumidores restantes.

2. **Remoção de Cards de Módulo em `CentralDadosTab.tsx`**:
   - *Motivo*: A aba "Saúde da Fonte" renderizava 5 blocos duplicados de configuração por módulo.
   - *Impacto*: A seção foi limpa de `CentralDadosTab.tsx` e unificada através da nova suíte `SourceDrivenInterpretationPanel.tsx`.
