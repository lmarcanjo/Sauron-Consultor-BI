# ASTERION — Jornada Operacional do Consultor (`CONSULTANT_JOURNEY.md`)

---

# 1. Minha Carteira

## Objetivo
Proporcionar ao consultor e ao sócio da consultoria uma visão consolidada de todas as contas, clientes e engajamentos ativos sob sua responsabilidade, permitindo priorizar esforços diários e identificar imediatamente engajamentos que demandam intervenção ou reunião iminente.

## Quem executa
Consultor Principal, Sócio da Consultoria e Consultor de Campo.

## Entradas
- Carteira de clientes atribuída ao profissional.
- Status operacional dos engajamentos correntes.
- Alertas de pendências de acompanhamento e reuniões agendadas.

## Ações humanas
- Selecionar a conta ou engajamento que será trabalhado no dia.
- Filtrar a carteira por criticidade, fase da jornada ou cliente.
- Iniciar o fluxo de um novo trabalho consultivo.

## Ações automáticas do ASTERION
- Apresentar a lista atualizada de engajamentos ativos com seus respectivos estados canônicos.
- Destacar prazos de ações atrasadas e reuniões executivas próximas.
- Exibir a última atividade e o nível de maturidade do diagnóstico de cada conta.

## Decisões importantes
- Qual cliente/engajamento exige atenção prioritária no dia.
- Se é hora de iniciar um novo engajamento ou dar continuidade a um existente.

## Entregáveis
- Painel de controle da rotina de trabalho do consultor.

## Critérios para concluir a etapa
- O consultor escolhe e acessa o engajamento de trabalho desejado ou decide criar um novo engajamento.

---

# 2. Criar Engajamento

## Objetivo
Formalizar no ASTERION o escopo e o contrato de trabalho consultivo para um cliente novo ou existente, estabelecendo o alinhamento inicial do projeto.

## Quem executa
Sócio da Consultoria ou Consultor Principal.

## Entradas
- Nome e dados institucionais do Cliente.
- Tipo de engajamento (Reestruturação Financeira, Turnaround, Consultoria de Gestão, Diagnóstico Expresso).
- Responsáveis da equipe consultiva atribuídos à conta.

## Ações humanas
- Cadastrar a organização cliente (caso seja um novo cliente).
- Definir o título, objetivo estratégico e responsável pelo engajamento.
- Selecionar o modelo ou playbook consultivo de referência (ex: DRE Financeira, Comercial, Operacional).

## Ações automáticas do ASTERION
- Criar a estrutura do engajamento vinculada à conta do cliente.
- Inicializar a empresa no estado canônico inicial **`NO_SOURCE`**.
- Associar os modelos de indicadores e permissões da equipe configurada.

## Decisões importantes
- Qual a metodologia ou foco principal do projeto consultivo.
- Quais consultores terão acesso de edição e condução do engajamento.

## Entregáveis
- Engajamento ativo cadastrado e pronto para a fase de onboarding.

## Critérios para concluir a etapa
- Estrutura do engajamento criada com sucesso e empresa posicionada em `NO_SOURCE`.

---

# 3. Onboarding do Cliente

## Objetivo
Mapear a estrutura organizacional do cliente (Grupos Econômicos, Empresas, Filiais/Unidades) e entender o modelo de negócios antes da recepção dos dados físicos.

## Quem executa
Consultor Principal ou Consultor de Campo.

## Entradas
- Informações sobre o organograma do cliente fornecidas na reunião de Kick-off.
- Lista de CNPJs, nomes de filiais, fazendas ou lojas envolvidas no escopo.

## Ações humanas
- Cadastrar o Grupo Econômico (se aplicável).
- Cadastrar as Empresas e suas respectivas Unidades/Filiais sob o escopo do engajamento.
- Registrar observações e particularidades do modelo de negócios do cliente.

## Ações automáticas do ASTERION
- Construir a arborescência organizacional do cliente no ambiente do engajamento.
- Preparar os contêineres organizacionais para receberem a vinculação das futuras fontes de dados.

## Decisões importantes
- Quais empresas e unidades fazem parte do perímetro auditado.
- Como as filiais devem ser consolidadas (por grupo ou por empresa individual).

## Entregáveis
- Mapa organizacional do cliente estruturado e pronto para receber fontes.

## Critérios para concluir a etapa
- Estrutura de Empresas e Unidades cadastrada no sistema.

---

# 4. Conectar Fontes

## Objetivo
Receber e conectar os arquivos físicos ou bancos de dados do cliente ao engajamento, sem alterar ou corromper os dados de origem.

## Quem executa
Consultor de Campo ou Consultor Principal.

## Entradas
- Arquivos de planilhas (`.xlsx`, `.csv`) enviados pelo financeiro do cliente ou credenciais de acesso ao banco SQL.

## Ações humanas
- Fazer o upload das planilhas ou configurar os parâmetros da conexão SQL.
- Indicar a qual Empresa ou Grupo aquela fonte primariamente pertence.

## Ações automáticas do ASTERION
- Armazenar o artefato bruto de dados em ambiente isolado.
- Validar a integridade física do arquivo ou da conexão.
- Transitar a empresa para o estado canônico **`SOURCE_CONNECTED`** e disparar imediatamente a análise autônoma.

## Decisões importantes
- Quais fontes de dados representam a verdade oficial do cliente para o período analisado.

## Entregáveis
- Fonte de dados conectada e associada à empresa no engajamento.

## Critérios para concluir a etapa
- Fonte física recebida e validada, com o engajamento pronto para a descoberta.

---

# 5. Descoberta Inteligente

## Objetivo
Permitir que o ASTERION leia, analise e interprete autonomamente a estrutura dos dados do cliente, identificando volumes, qualidade, inconsistências e domínios de negócio sem intervenção humana braçal.

## Quem executa
Execução 100% autônoma do ASTERION, acompanhada passivamente pelo Consultor.

## Entradas
- Fonte de dados conectada na etapa anterior.

## Ações humanas
- Aguardar o término do processamento autônomo (geralmente concluído em segundos).

## Ações automáticas do ASTERION
- Executar o Perfil do Caos: contar linhas, colunas, tipos de dados e células vazias.
- Classificar semanticamente os campos (Receita, Custo, Despesa, Datas, Categorias, Unidades).
- Mapear a aderência aos modelos do DRE e áreas de negócios.
- Agrupar inconsistências e dúvidas conceituais para revisão humana.
- Transitar a empresa para os estados canônicos **`DISCOVERING`** e em seguida **`WAITING_CONFIRMATION`**.

## Decisões importantes
- Nenhuma decisão humana nesta etapa (processamento 100% autônomo).

## Entregáveis
- Diagnóstico preliminar da qualidade da fonte e síntese de entendimento gerada pela plataforma.

## Critérios para concluir a etapa
- Leitura finalizada e síntese explicável apresentada na tela de validação.

---

# 6. Validação

## Objetivo
Garantir que o consultor revise a interpretação sugerida pelo ASTERION, sane dúvidas sobre papéis de colunas e aprove formalmente o entendimento da fonte através de uma ação única.

## Quem executa
Consultor Principal.

## Entradas
- Síntese explicável do entendimento da fonte e lista de dúvidas/anomalias agrupadas pelo ASTERION.

## Ações humanas
- Revisar a narrativa gerada sobre o que a fonte representa.
- Ajustar ou confirmar os papéis sugeridos para colunas com nomenclaturas ambíguas.
- Executar a ação única e soberana: **`Validar entendimento da empresa`**.

## Ações automáticas do ASTERION
- Aplicar as definições aprovadas pelo consultor à camada de leitura.
- Garantir que nomes originais não modificados continuem funcionando sem erros.
- Transitar a empresa para o estado canônico **`READY`**, liberando integralmente o diagnóstico e as análises.

## Decisões importantes
- Se a interpretação do sistema refletir fielmente a realidade financeira do cliente.
- Se existem campos que devem ser ignorados ou reclassificados.

## Entregáveis
- Entendimento da fonte validado e registrado com rastreabilidade total.

## Critérios para concluir a etapa
- Acionamento da CTA `Validar entendimento da empresa` e transição da empresa para `READY`.

---

# 7. Diagnóstico Executivo

## Objetivo
Analisar os indicadores financeiros, operacionais e comerciais gerados automaticamente pelo ASTERION para identificar pontos de atenção, anomalias de margem e oportunidades de melhoria no cliente.

## Quem executa
Consultor Principal e Consultor de Campo.

## Entradas
- Fonte de dados no estado `READY` e indicadores calculados pelo ASTERION.

## Ações humanas
- Navegar pelos módulos do diagnóstico (DRE Inteligente, Margens, Pessoas, Comercial, Fechamento).
- Inspecionar a linhagem das métricas (*Data Lineage*) para validar a origem dos números.
- Destacar anomalias e insights que farão parte da pauta da reunião com a diretoria do cliente.

## Ações automáticas do ASTERION
- Calcular a DRE, margens de contribuição, EBITDA e indicadores operacionais em tempo real.
- Exibir alertas visuais de inconsistência ou variação atípica de custos/receitas.
- Manter a rastreabilidade total entre cada valor exibido e o registro original.

## Decisões importantes
- Quais anomalias financeiras são prioritárias para a sobrevida/crescimento do cliente.
- Quais alavancas de valor devem ser apresentadas aos executivos.

## Entregáveis
- Diagnóstico financeiro e operacional completo e validado pelo consultor.

## Critérios para concluir a etapa
- Consultor conclui a análise crítica das métricas e identifica os pontos centrais da apresentação.

---

# 8. Construção da Apresentação

## Objetivo
Gerar e personalizar a apresentação executiva de slides que será utilizada na reunião presencial ou remota com a diretoria do cliente.

## Quem executa
Consultor Principal.

## Entradas
- Diagnóstico executivo concluído e pontos de atenção selecionados.

## Ações humanas
- Solicitar a geração da Apresentação Executiva no ASTERION.
- Revisar a narrativa dos slides gerados (Capas, Resumo Executivo, Indicadores Chave, Anomalias, Recomendações).
- Ajustar textos, adicionar observações do consultor ou reordenar tópicos conforme o perfil do cliente.

## Ações automáticas do ASTERION
- Compilar o deck de slides executivos baseado nos dados certificados do diagnóstico.
- Inserir gráficos, resumos e comparações com linhagem direta aos dados.
- Garantir que nenhum slide apresente números inconsistentes com o diagnóstico.

## Decisões importantes
- O tom e a ênfase da narrativa para a reunião com o cliente.
- Quais pontos críticos devem ser destacados como urgentes.

## Entregáveis
- Deck de Apresentação Executiva pronto e certificado.

## Critérios para concluir a etapa
- Apresentação executiva finalizada e aprovada pelo consultor para a reunião.

---

# 9. Reunião Executiva

## Objetivo
Conduzir a Sessão Executiva de alinhamento e decisão com o CEO, diretores e sócios do cliente, alinhando a percepção de diagnóstico e colhendo deliberações.

## Quem executa
Consultor Principal (apresenta) e Consultor de Campo (apoia/registra).

## Entradas
- Deck de Apresentação Executiva e ASTERION em modo de Sessão Executiva.

## Ações humanas
- Apresentar a narrativa diagnóstica utilizando o modo de apresentação interativo do ASTERION.
- Conduzir o debate sobre os pontos de atenção e recomendações trazidas pela consultoria.
- Registrar em tempo real os compromissos, decisões e deliberações da diretoria durante o encontro.

## Ações automáticas do ASTERION
- Disponibilizar cronômetro, agenda de pauta e navegação fluida entre os slides.
- Registrar os apontamentos da Ata de Reunião em tempo real vinculados aos slides/métricas discutidos.

## Decisões importantes
- Quais deliberações foram aprovadas pela diretoria do cliente.
- Quais metas e diretrizes foram estabelecidas para o próximo período.

## Entregáveis
- Reunião conduzida com sucesso e registros de deliberação capturados.

## Critérios para concluir a etapa
- Encerramento formal da Sessão Executiva no sistema.

---

# 10. Plano de Ação

## Objetivo
Transformar as deliberações e recomendações da reunião executiva em um plano de trabalho prático, atribuindo tarefas, responsáveis no cliente, prazos e prioridades.

## Quem executa
Consultor Principal em conjunto com os Executivos/Gestores do Cliente.

## Entradas
- Ata de reunião executiva e recomendações aprovadas na Sessão Executiva.

## Ações humanas
- Criar e detalhar os Planos de Ação derivados dos diagnósticos.
- Definir o responsável direto no cliente para cada tarefa.
- Estabelecer os prazos de entrega e critérios de conclusão.

## Ações automáticas do ASTERION
- Vincular cada ação ao seu respectivo ponto de atenção no diagnóstico.
- Notificar os responsáveis sobre as tarefas atribuídas e seus prazos.
- Consolidar a matriz de iniciativas do engajamento.

## Decisões importantes
- Quem são os donos das tarefas dentro da estrutura do cliente.
- Quais prazos são factíveis para a execução das correções.

## Entregáveis
- Plano de Ação Estruturado com responsáveis, prazos e metas claras.

## Critérios para concluir a etapa
- Plano de Ação cadastrado, atribuído e aceito pelos responsáveis do cliente.

---

# 11. Acompanhamento

## Objetivo
Monitorar continuamente a execução dos Planos de Ação e a evolução dos indicadores do cliente ao longo das semanas, garantindo que o diagnóstico se converta em resultado real.

## Quem executa
Consultor de Campo, Consultor Principal e Responsáveis no Cliente.

## Entradas
- Planos de Ação ativos e novas cargas periódicas de dados da empresa.

## Ações humanas
- Realizar reuniões periódicas de follow-up com os responsáveis pelas tarefas no cliente.
- Atualizar o status das ações (Em Andamento, Concluído, Atrasado).
- Conectar novas cargas de planilhas/dados mensais para avaliar o impacto das ações nos números.

## Ações automáticas do ASTERION
- Atualizar a taxa de conclusão dos Planos de Ação.
- Destarcar tarefas atrasadas e gerar alertas de desvio de prazo na Carteira do Consultor.
- Recalcular os indicadores à medida que novas cargas financeiras são importadas.

## Decisões importantes
- Se uma ação atrasada exige escalonamento para a diretoria do cliente.
- Se novos planos de ação devem ser criados para corrigir desvios emergentes.

## Entregáveis
- Relatórios periódicos de acompanhamento e evolução dos resultados do cliente.

## Critérios para concluir a etapa
- Cumprimento dos ciclos planejados de acompanhamento e alcance das metas estipuladas.

---

# 12. Encerramento

## Objetivo
Formalizar o encerramento do engajamento ou ciclo consultivo, apresentando o resultado acumulado da transformação e arquivando o histórico de inteligência gerado.

## Quem executa
Sócio da Consultoria e Consultor Principal.

## Entradas
- Histórico completo do engajamento, evolução das métricas e taxa de execução dos Planos de Ação.

## Ações humanas
- Realizar a reunião final de encerramento/prestação de contas com a diretoria do cliente.
- Apresentar o balanço final da transformação e ROI da consultoria.
- Encerrar formalmente o engajamento no ASTERION ou transitar para um novo ciclo de renovação contratual.

## Ações automáticas do ASTERION
- Consolidar o histórico de inteligência do engajamento para fins de aprendizado futuro da consultoria.
- Transitar o status do engajamento para Concluído / Arquivado.
- Preservar a memória histórica dos dados, relatórios e atas com segurança.

## Decisões importantes
- Se a consultoria proporá um novo engajamento (renovação/upsell) ou encerrará o contrato.

## Entregáveis
- Relatório final de encerramento do engajamento e acervo histórico consolidado.

## Critérios para concluir a etapa
- Engajamento finalizado e arquivado com sucesso no ASTERION.
