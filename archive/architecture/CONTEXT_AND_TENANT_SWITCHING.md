# Context and Tenant Switching Architecture

Este documento descreve as diretrizes para a troca rápida de empresa e isolamento estrito de CNPJs no Sauron.

---

## 1. Separação de Conceitos

- **Autenticação:** Representa as credenciais do usuário.
- **Contexto do Cliente (Grupo):** Define a base de dados cognitiva ativa do grupo econômico.
- **Contexto Empresarial (Empresa/Unidade):** Define o filtro organizacional em tempo de execução para os lançamentos exibidos na tela.

---

## 2. Fluxo da Troca Rápida de Empresa

A troca de foco corporativo é feita em um clique diretamente no cabeçalho através do componente `GlobalContextBar`.

1. O consultor seleciona outra empresa.
2. O sistema carrega a `ConsultingModelConfiguration` associada ao CNPJ destino e atualiza o cache síncrono `sauron_active_consulting_config`.
3. O estado `enterpriseContext` é modificado.
4. O `EnterpriseConsolidationService` filtra as linhas da planilha de forma reativa pelo nome da empresa destino (isolamento estrito).
5. O menu lateral adaptativo (`AppSidebar`) e os cards são re-renderizados imediatamente sem recarregar a página e sem navegar para a Biblioteca.
