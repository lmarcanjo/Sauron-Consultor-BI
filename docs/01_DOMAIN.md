# ASTERION — Modelo de Domínio

## 1. Glossário Institucional
* **ASTERION**: Consulting Intelligence Operating System.
* **Consultor**: O profissional especialista responsável por conduzir o diagnóstico do cliente.
* **Cliente**: Organização contratante atendida pela consultoria.
* **Grupo Econômico**: Conglomerado de organizações sob o mesmo controle acionário.
* **Empresa**: Entidade jurídica e operacional consolidada.
* **Unidade / Filial**: Estabelecimento físico ou filial de uma Empresa.
* **Fonte de Dados**: Planilha Excel/CSV ou Banco de Dados SQL original.
* **Perfil do Caos**: Radiografia autônoma da qualidade e estrutura da fonte.
* **Validação do Entendimento**: Confirmação do consultor sobre a narrativa e papéis dos dados.
* **Dashboard / Diagnóstico**: Painel consolidado de métricas financeiras e comerciais certificadas.
* **Apresentação Executiva**: Deck de slides interativo para a diretoria do cliente.
* **Sessão Executiva (Reunião)**: Rito presencial/remoto de tomada de decisão.
* **Plano de Ação**: Conjunto de tarefas com prazos e responsáveis para executar correções.

---

## 2. Entidades Canônicas

1. **Cliente / Organização**: Entidade raiz do contrato de consultoria.
2. **Grupo Econômico (`BusinessGroup`)**: Agrupamento opcional de empresas.
3. **Empresa (`Company`)**: Entidade jurídica/financeira principal.
4. **Unidade (`Unit`)**: Divisão física ou filial da empresa.
5. **Fonte de Dados (`DataSource`)**: Artefato físico de dados conectado.
6. **Perfil do Caos (`ChaosSourceProfile`)**: Aprendizado autônomo sobre os dados.
7. **Validação (`ConsultantUnderstanding`)**: Aceite do entendimento pelo consultor.
8. **Diagnóstico (`ExecutiveDashboard`)**: Indicadores e DRE consolidados.
9. **Apresentação (`ExecutivePresentation`)**: Slides executivos gerados.
10. **Plano de Ação (`ActionPlan`)**: Compromissos e tarefas com prazos.

---

## 3. Estados Canônicos da Empresa

Toda empresa no ASTERION transita estritamente pelos 5 estados canônicos:

```
[NO_SOURCE] ──► [SOURCE_CONNECTED] ──► [DISCOVERING] ──► [WAITING_CONFIRMATION] ──► [READY]
```

1. **`NO_SOURCE`**: Empresa cadastrada sem fonte de dados associada.
2. **`SOURCE_CONNECTED`**: Arquivo ou banco conectado, aguardando leitura.
3. **`DISCOVERING`**: Sistema lendo a estrutura física e identificando domínios.
4. **`WAITING_CONFIRMATION`**: Estrutura aprendida, aguardando confirmação do consultor.
5. **`READY`**: Entendimento validado; dashboards e apresentações completamente liberados.
