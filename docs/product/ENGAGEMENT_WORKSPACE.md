# ASTERION — Especificação de UX do Workspace de Engajamento (`ENGAGEMENT_WORKSPACE.md`)

---

# 1. Objetivo do Workspace

O Workspace de Engajamento é o ambiente de trabalho diário do consultor dentro do ASTERION. 

Seu propósito não é servir como um painel passivo de visualização de gráficos, mas como um **Centro de Comando e Tomada de Decisão**. O Workspace organiza todo o contexto do cliente, o progresso da consultoria, a linhagem dos dados e as deliberações em uma experiência integrada, orientando ativamente o consultor sobre o próximo passo necessário para fazer o engajamento evoluir do diagnóstico inicial ao resultado final.

---

# 2. Princípios da Experiência

1. **Orientação Ativa ao Próximo Passo**: O consultor nunca deve abrir um engajamento e se perguntar *"o que faço agora?"*. O sistema deve apresentar ostensivamente a próxima ação recomendada, pendências críticas e riscos.
2. **Contexto Sobre Quantidade**: A interface prioriza o significado das métricas, a explicação dos números e a decisão humana em vez de uma profusão de cartões e gráficos desconexos.
3. **Progressive Disclosure (Revelação Progressiva)**: Informações complexas e detalhes técnicos (linhagem de dados, logs de leitura, perfis estruturais) só são apresentados quando o consultor solicita aprofundamento, mantendo a visão principal limpa e focada.
4. **Continuidade de Estado**: O estado do engajamento reflete diretamente os 5 estados canônicos da empresa (`NO_SOURCE` -> `SOURCE_CONNECTED` -> `DISCOVERING` -> `WAITING_CONFIRMATION` -> `READY`), adaptando o que é exibido conforme a maturidade do projeto.
5. **Zero Dead Actions**: Toda interação disponível no Workspace produz uma transição ou alteração visível de estado no trabalho do consultor.

---

# 3. Estrutura Geral e Dinâmica do Trabalho

Ao abrir um Engajamento, o consultor recebe imediatamente um cabeçalho contextual contendo:
- Nome do Cliente e da Empresa selecionada.
- Estado canônico atual da empresa no engajamento.
- **Cartão do Próximo Passo Recomendado** (destaque prioritário no topo).

O corpo do Workspace é articulado em **11 Áreas Principais**, organizadas de forma lógica e acessíveis por navegação contextual.

---

# 4. Especificação das Áreas Principais

---

## 1. Resumo Executivo

### Objetivo
Apresentar uma síntese consolidada da saúde do engajamento, destacando a situação financeira/operacional atual do cliente, o status da consultoria e o impacto gerado até o momento.

### Informações exibidas
- Visão sintética das principais métricas validadas (Receita Bruta, EBITDA, Margem de Contribuição, Caixa).
- Status geral do engajamento e saúde do contrato.
- Destaque para os 3 maiores gargalos ou oportunidades identificados no diagnóstico.

### Ações disponíveis
- Alternar período de análise (mensal, trimestral, anual).
- Exportar síntese executiva.
- Navegar diretamente para a métrica ou anomalia selecionada.

### Dependências
- Empresa no estado `READY` com entendimento validado pelo consultor.

### Critérios para atualização
- Atualizado automaticamente sempre que uma nova carga de dados for validada ou quando métricas forem reclassificadas pelo consultor.

---

## 2. Linha do Tempo do Engajamento

### Objetivo
Visualizar a evolução cronológica do trabalho consultivo, desde a recepção da primeira planilha até as entregas de reuniões e planos de ação.

### Informações exibidas
- Etapas concluídas, em andamento e futuras da jornada do consultor.
- Histórico de marcos (Marcos de Onboarding, Conexão de Dados, Validações, Reuniões Executivas Realizadas).
- Datas de entregas e prazos contratuais.

### Ações disponíveis
- Filtrar linha do tempo por tipo de evento (Dados, Diagnóstico, Reunião, Ação).
- Iniciar uma etapa futura agendada.

### Dependências
- Existência do Engajamento cadastrado.

### Critérios para atualização
- Atualizada automaticamente em tempo real a cada transição de estado da empresa ou evento registrado no engajamento.

---

## 3. Próximas Decisões (Direcionador de Ação)

### Objetivo
Servir como o motor de orientação ativa do consultor, reunindo todas as pendências, aprovações, revisões de dados e decisões necessárias para destravar o progresso do engajamento.

### Informações exibidas
- **Ação Principal Recomendada pelo ASTERION** (ex: *"Validar entendimento da fonte cadastrada"* ou *"Agendar Sessão Executiva de Diagnóstico"*).
- Lista de decisões pendentes agrupadas por urgência (Erros de mapeamento, Ações atrasadas no cliente, Validações necessárias).
- Alertas de risco financeiro ou operacional detectados nos dados.

### Ações disponíveis
- Executar a ação direta sugerida (ex: abrir tela de validação, abrir plano de ação).
- Postergar ou delegar a revisão de uma pendência secundaria.

### Dependências
- Avaliação contínua do estado do engajamento e das regras de negócio pelo ASTERION.

### Critérios para atualização
- Recalculado instantaneamente a cada ação do consultor ou mudança de estado dos dados.

---

## 4. Fontes de Dados

### Objetivo
Gerenciar o recebimento, integridade, vínculo organizacional e histórico das planilhas ou conexões SQL do cliente.

### Informações exibidas
- Lista de fontes de dados conectadas à empresa.
- Status do vínculo (Ativo, Em Análise, Desconectado).
- Data da última importação, volume de registros lidos e indicador de qualidade da fonte (Perfil do Caos).

### Ações disponíveis
- Upload de nova planilha ou adição de conexão SQL.
- Vincular/Desvincular fonte a uma Empresa ou Grupo Econômico.
- Disparar nova leitura autônoma.

### Dependências
- Nenhuma (primeira etapa operacional pós-onboarding).

### Critérios para atualização
- Atualizado na recepção de novos arquivos ou alteração de vínculo organizacional.

---

## 5. Descobertas

### Objetivo
Exibir os achados estruturais e semânticos revelados autossuficientemente pelo ASTERION sobre a fonte de dados antes da validação do consultor.

### Informações exibidas
- Narrativa explicável sobre o que a fonte representa (ex: *"Trata-se de uma base financeira contendo 12.400 lançamentos de despesas e receitas entre Jan/2025 e Dez/2025"*).
- Classificação de campos sugeridos (Receita, Custos, Datas, Unidades).
- Dúvidas e anomalias de nomenclatura agrupadas por relevância.

### Ações disponíveis
- Revisar dúvidas de classificação sugeridas pelo sistema.
- **Ação Única de Validação**: Botão `Validar entendimento da empresa`.

### Dependências
- Empresa nos estados `SOURCE_CONNECTED` ou `DISCOVERING`.

### Critérios para atualização
- Gerado após o término da análise autônoma e atualizado durante a revisão do consultor.

---

## 6. Diagnósticos

### Objetivo
Disponibilizar a análise financeira, comercial e operacional profunda do cliente através de módulos especializados e métricas certificadas.

### Informações exibidas
- Demonstração do Resultado do Exercício (DRE Inteligente).
- Análise de Margens de Contribuição e EBITDA.
- Módulos setoriais ativos (Pessoas, Comercial, Fechamento).
- Linhagem rastreável (*Data Lineage*) para cada indicador.

### Ações disponíveis
- Navegar entre diferentes visões e módulos analíticos.
- Clicar em qualquer valor para inspecionar a linhagem física dos dados originais.
- Adicionar observações ou destaques consultivos a uma métrica.

### Dependências
- Empresa no estado `READY` (Entendimento validado).

### Critérios para atualização
- Recalculado automaticamente após qualquer alteração na validação da fonte ou chegada de novos dados.

---

## 7. Plano de Ação

### Objetivo
Estruturar e acompanhar a matriz de iniciativas corretivas acordadas com o cliente para resolver as deficiências apontadas pelo diagnóstico.

### Informações exibidas
- Lista de planos de ação e tarefas ativas.
- Responsável no cliente, prazo de entrega, prioridade e status de execução (AIniciar, Em Andamento, Concluído, Atrasado).
- Vínculo entre a ação e a métrica/anomalia que a originou.

### Ações disponíveis
- Criar novo Plano de Ação.
- Atribuir responsável no cliente e definir prazo.
- Atualizar status de execução da tarefa.

### Dependências
- Diagnóstico concluído ou deliberações registradas em Reunião.

### Critérios para atualização
- Atualizado em tempo real pelas interações do consultor ou atualizações dos responsáveis.

---

## 8. Reuniões

### Objetivo
Preparar, conduzir e registrar os ritos formais de apresentação de diagnósticos e alinhamento executivo com a diretoria do cliente.

### Informações exibidas
- Histórico de Sessões Executivas realizadas e agendadas.
- Pauta da reunião, deck de apresentação executiva associado e ata de deliberações.
- Compromissos acordados durante os encontros.

### Ações disponíveis
- Agendar nova Sessão Executiva.
- Iniciar modo de Apresentação Executiva Interativa.
- Registrar ata e deliberações ao vivo durante o rito.

### Dependências
- Diagnóstico validado e apresentação executiva gerada.

### Critérios para atualização
- Registrado após o agendamento, condução ou encerramento de uma Sessão Executiva.

---

## 9. Arquivos

### Objetivo
Centralizar a custódia e o repositório de documentos institucionais, relatórios exportados, minutas e planilhas recebidas do cliente.

### Informações exibidas
- Biblioteca de arquivos do engajamento categorizada (Fontes Brutas, Relatórios Exportados, Apresentações PDF, Atas Assinadas).
- Data de envio, autor e versão do documento.

### Ações disponíveis
- Download de relatórios e apresentações.
- Organizar arquivos em pastas institucionais.
- Visualizar histórico de versões de um documento.

### Dependências
- Existência de arquivos importados ou relatórios gerados.

### Critérios para atualização
- Atualizado sempre que um novo documento for uploadado ou exportado na plataforma.

---

## 10. Histórico

### Objetivo
Garantir a auditabilidade total das decisões humanas e alterações técnicas ocorridas ao longo de todo o ciclo de vida do engajamento.

### Informações exibidas
- Log cronológico de auditoria de ações (ex: *"Consultor João validou o entendimento da fonte X em 14/03 às 10:30"*).
- Histórico de reclassificações de colunas e alterações de prazos em planos de ação.

### Ações disponíveis
- Filtrar histórico por autor, tipo de ação ou período.
- Inspecionar detalhes de uma alteração passada.

### Dependências
- Registrado automaticamente pelo sistema.

### Critérios para atualização
- Registro imutável gravado em tempo real em cada ação do consultor.

---

## 11. Inteligência Consultiva Relacionada

### Objetivo
Disponibilizar ao consultor referências metodológicas, benchmarks de mercado e aprendizados institucionais aplicáveis ao perfil e segmento do cliente atual.

### Informações exibidas
- Recomendações do Modelo Consultivo ativo.
- Benchmarks de margem e estrutura de custos para o segmento do cliente (ex: Agro, Serviços, Varejo).
- Sugestões de planos de ação padrão recomendados para o tipo de anomalia detectada.

### Ações disponíveis
- Aplicar um modelo de plano de ação sugerido ao engajamento atual.
- Consultar diretrizes da metodologia da consultoria.

### Dependências
- Dados do cliente categorizados por segmento e modelo de negócios.

### Critérios para atualização
- Atualizado dinamicamente conforme os domínios do cliente são identificados e validados.
