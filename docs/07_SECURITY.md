# ASTERION — Diretrizes de Segurança

## Segurança e Privacidade dos Dados

1. **Proteção de Credenciais**: Todos os inputs de senha possuem suporte nativo a elementos `<form>`, com autocomplete seguro e isolamento de campos.
2. **Execução Local / Contida**: Os dados do cliente são processados localmente e mantidos no navegador via IndexedDB/Storage criptografado.
3. **Isolamento de Tenants**: Vínculos de fontes e contextos organizacionais respeitam os limites de cada empresa sem contaminação cruzada.
