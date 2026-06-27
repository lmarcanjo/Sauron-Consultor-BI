# Relatório de Dívida Técnica, Performance e Escalabilidade - Sauron OS (Versão 1.0)
## Diagnóstico de Infraestrutura Computacional, Padrões de Código React e Análise de Gargalos

Este documento consolida a análise técnica profunda sobre a performance de renderização no front-end, o comportamento de memória e os gargalos previsíveis de escalabilidade do Sauron OS frente à projeção de crescimento corporativo da base de clientes.

---

## 1. Auditoria de Performance (Front-End & State Management)

No ecossistema React, problemas de performance geralmente residem em re-renderizações em cascata devido a dependências mal gerenciadas e à falta de otimização no consumo de dados estruturados pesados (como grandes planilhas financeiras de filiais).

### A. Re-renderizações em Cascata por Stale Closures e useEffect Dependency Arrays
* **Problema:** Múltiplos componentes do Sauron OS (incluindo o `CaseHub.tsx` e o `CentralDadosTab.tsx`) utilizam `useEffect` vinculando arrays de dependências com objetos ou funções complexas não memoizadas em vez de valores primitivos estáveis.
* **Impacto:** **Alto**. A cada alteração infinitesimal de qualquer estado menor, o React reconstrói referências na memória, disparando execuções de loops de efeito redundantes, gerando travamento perceptível de interface (micro-stutters) em navegadores menos robustos.
* **Proposta de Solução:** 
  1. Estabilizar funções utilitárias fora do ciclo de vida dos componentes ou envolvê-las com o hook `useCallback`.
  2. Memoizar cálculos massivos de dados financeiros com o hook `useMemo` (como foi implementado recentemente no cálculo de `dummyMetrics`).
  3. Evitar arrays de objetos em dependency arrays; preferir strings identificadoras ou números de versão.
* **Prioridade:** **Alta**
* **Esforço Estimado:** Médio (Revisão sistemática de hooks na base de componentes).

### B. Gargalo de Renderização de Tabelas de Grande Extensão (Virtualização)
* **Problema:** A plataforma renderiza tabelas financeiras de filiais e CNPJs de forma integral no DOM do navegador usando iterações simples de `.map()`.
* **Impacto:** Quando o cliente importar uma planilha com mais de 1000 transações ou linhas de DRE, o navegador precisará instanciar milhares de nós HTML no DOM simultaneamente, resultando em travamento severo da tela (tela congelada por segundos durante a troca de abas).
* **Proposta de Solução:** Integrar uma biblioteca de virtualização de listas/tabelas (como `react-window` ou `tanstack-virtual`). A virtualização renderiza estritamente no DOM apenas as linhas que estão visíveis na viewport atual do usuário, mantendo a performance de scroll constante independente do tamanho do arquivo importado.
* **Prioridade:** **Alta**
* **Esforço Estimado:** Médio-Alto (Mudança no mecanismo de iteração de tabelas volumosas).

---

## 2. Auditoria de Escalabilidade (Projeção para Escala Enterprise)

Para que o Sauron OS opere de forma suave sustentando um cenário com **500 consultorias independentes, 5.000 empresas clientes, 50.000 usuários ativos simultâneos e milhões de registros transacionais**, os seguintes gargalos estruturais no backend e banco de dados precisam ser mitigados preventivamente:

```
        [50.000 Usuários Ativos]
                  │
                  ▼
         [API Gateway / Ingress]
                  │
                  ▼ (Gargalo 1: Autenticação & Session State)
        [Express App Cluster]
                  │
                  ▼ (Gargalo 2: Processamento de Planilhas em CPU Threading)
        [Task Queue / Worker]
                  │
                  ▼ (Gargalo 3: Querying de Planilhas e DRE Complexos)
       [PostgreSQL (Cloud SQL)] ───► [Redis Cache Layer]
```

### Gargalo 1: Processamento Síncrono de Carga de Dados (CPU Blocking)
* **Análise:** Atualmente, a importação de planilhas e a execução de algoritmos de detecção de anomalias financeiras são processados diretamente na thread principal do servidor de aplicação de forma síncrona.
* **Risco na Escala:** Com dezenas de usuários importando planilhas de filiais ao mesmo tempo, a thread única do Node.js ficará saturada (CPU-bound), tornando todo o backend temporariamente indisponível e travando as requisições normais dos demais usuários.
* **Mitigação Recomendada:** Desacoplar tarefas pesadas de parse, cálculo de DRE e detecção de anomalias para um serviço de fila de tarefas assíncrona (como BullMQ no Redis ou Cloud Tasks), executados em processos separados ou instâncias Serverless isoladas (Cloud Run / Workers).
* **Prioridade:** **Alta**
* **Esforço Estimado:** Médio-Alto.

---

### Gargalo 2: Consultas Complexas a Dados Financeiros Brutos (Banco de Dados Central)
* **Análise:** Toda renderização de DRE, cálculo de margem e auditoria de KPIs realiza leituras diretas na base de dados relacional (Cloud SQL / PostgreSQL) processando agregações pesadas em tempo real.
* **Risco na Escala:** Sob alta simultaneidade de dezenas de milhares de usuários acessando cockpits estratégicos ao mesmo tempo, a quantidade de leituras no banco relacional causará estouro de conexões e gargalo de CPU no servidor de banco de dados, paralisando o sistema.
* **Mitigação Recomendada:** Implementar uma camada robusta de cache de leitura (Redis) para resultados agregados estruturados de DRE e métricas consolidadas dos casos. O cache é invalidado apenas quando uma nova planilha de dados é carregada para aquele caso de negócio específico.
* **Prioridade:** **Crítico**
* **Esforço Estimado:** Médio.

---

### Gargalo 3: Persistência de Arquivos Físicos de Upload
* **Análise:** O fluxo de manipulação de arquivos (Excel, PDFs de contratos, evidências) necessita de um destino escalável de armazenamento durável.
* **Risco na Escala:** Tentar salvar arquivos ou bytes brutos diretamente no banco de dados ou no sistema de arquivos local do container do Cloud Run resultará em estouro de capacidade do container (Memory leak ou perda de arquivos nas reinicializações do container).
* **Mitigação Recomendada:** Utilizar exclusivamente o Google Cloud Storage (GCS) ou AWS S3 para persistência de todos os arquivos importados pelos clientes. O banco de dados deve armazenar estritamente as URLs seguras de referência de acesso com links assinados temporários.
* **Prioridade:** **Crítico**
* **Esforço Estimado:** Baixo-Médio.

---

## 3. Resumo de Prioridades para Escalabilidade de Infraestrutura

| Alvo de Escalabilidade | Cenário Crítico | Solução Definitiva | Esforço Estimado |
| :--- | :--- | :--- | :--- |
| **Upload de Planilhas** | 50 uploads simultâneos de 50MB | Processamento via Workers isolados com fila Cloud Tasks | Médio-Alto |
| **Dashboard do Cockpit**| 10.000 visualizações simultâneas | Caching no Redis das agregações de faturamento por CNPJ | Médio |
| **Arquivos Importados** | 1TB acumulado de planilhas de dados | Bucket dedicado Cloud Storage com ciclo de vida de arquivos | Baixo-Médio |

---

*Relatório de engenharia de performance elaborado pela equipe de infraestrutura de dados e confiabilidade (SRE) do Sauron OS.*
