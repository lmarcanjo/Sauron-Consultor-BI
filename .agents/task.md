# Tasks - Data Flow Certification & Domain Neutralization

- [x] Criar tipos canônicos e persistência: `SourceIdentity` e `ActiveSourceSelection`
- [x] Ajustar importador local e geração de identidades
- [x] Refatorar importador em lote (BatchImportReview) e SimpleSpreadsheetImporter com validação de storage sem carregar todas as linhas
- [x] Criar SpreadsheetStoragePort e IndexedSpreadsheetStorageAdapter para desacoplamento de storage
- [x] Refatorar a ativação transacional (DataActivation.ts) com Prepare, Commit e Rollback robusto e validações leves
- [x] Implementar regras estritas de detecção de domínio e fallback neutro
- [x] Criar script de migração para rodar antes do primeiro render em App.tsx
- [x] Atualizar CentralDadosTab.tsx para consumir as fontes de verdade diretamente
- [x] Atualizar produção-sanidade e ajustar teste de importServices
- [x] Rodar testes unitários e typechecks para certificar estabilidade de compilação
