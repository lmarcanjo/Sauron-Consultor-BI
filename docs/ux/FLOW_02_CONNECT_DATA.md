# ASTERION — Especificação de UX: Fluxo de Conexão de Dados (`FLOW_02_CONNECT_DATA.md`)

---

# 1. Visão Geral do Fluxo

O Fluxo de Conexão de Dados é o momento operacional em que o consultor introduz as informações físicas do cliente no ASTERION. 

Diferente de sistemas tradicionais de BI e ETL que exigem que o usuário limpe, padronize e formate planilhas no Excel antes da importação, o ASTERION foi desenhado sob o princípio da **Soberania e Recepção da Origem Bruta**. O consultor pode subir arquivos Excel (`.xlsx`, `.xls`), LibreOffice (`.ods`), `.csv` ou configurar conexões diretas com bancos de dados SQL (PostgreSQL, MySQL, SQL Server) independentemente do grau de bagunça dos arquivos.

Todo o processo é imutável: o ASTERION nunca altera o arquivo ou banco original, criando uma camada de leitura inteligente, explicável e totalmente auditável.

---

# 2. Etapas do Fluxo de Conexão

---

## Etapa 1: Seleção do Meio de Entrada (Planilha ou Banco SQL)

### 1. Objetivo da etapa
Permitir que o consultor escolha o formato físico dos dados que serão integrados ao engajamento corrente (upload de arquivos físicos ou dados de banco).

### 2. Ações do consultor
- Escolher a modalidade de conexão (Upload de Arquivos Físicos ou Conexão a Banco de Dados SQL).
- Arrastar/selecionar um ou múltiplos arquivos físicos (`.xlsx`, `.csv`, `.ods`) ou inserir credenciais de acesso ao servidor SQL.

### 3. Ações automáticas do ASTERION
- Validar a integridade estrutural básica do arquivo (verificar se o arquivo está corrompido ou protegido por senha).
- Testar a conectividade em tempo real com o servidor de banco de dados SQL (quando aplicável).
- Atribuir um identificador imutável de recebimento para cada fonte importada.

### 4. Possíveis problemas encontrados
- Arquivo de planilha corrompido ou protegido por senha de leitura.
- Conexão SQL recusada (credencial inválida, firewall ou banco offline).

### 5. Como o sistema auxilia na resolução
- **Exceção de Senha/Corrupção**: O sistema explica em linguagem clara que o arquivo está criptografado e solicita a senha de abertura ou uma nova cópia não corrompida.
- **Exceção de Conexão Perdida/Recusada**: O ASTERION detalha se a falha ocorreu por timeout de rede, porta bloqueada ou credencial incorreta, sugerindo o teste de ping antes da reativação.

### 6. Critérios para concluir a etapa
- Arquivo recebido com sucesso no contêiner do engajamento ou conexão SQL estabelecida com sucesso.

### 7. Próximo passo recomendado
- Definir o Vínculo Organizacional Inicial da fonte.

---

## Etapa 2: Definição do Vínculo Organizacional Inicial

### 1. Objetivo da etapa
Associar formalmente a fonte de dados importada ao seu respectivo escopo de empresa ou grupo econômico mapeado durante o onboarding.

### 2. Ações do consultor
- Indicar se aquela fonte de dados pertence a um Grupo Econômico consolidado, a uma Empresa específica ou a uma Filial/Unidade.

### 3. Ações automáticas do ASTERION
- Vincular a fonte física ao ID organizacional correspondente.
- Atualizar a empresa associada do estado **`NO_SOURCE`** para **`SOURCE_CONNECTED`**.

### 4. Possíveis problemas encontrados
- O consultor importa uma planilha que contém dados misturados de múltiplas empresas ou CNPJs no mesmo arquivo.

### 5. Como o sistema auxilia na resolução
- **Exceção de Múltiplas Empresas / Múltiplos CNPJs**: O ASTERION identifica a existência de múltiplos CNPJs ou nomes de empresas na mesma coluna ou em abas diferentes e sugere a **Consolidação/Desmembramento Multi-Empresa**, permitindo que o consultor vincule cada segmento à sua respectiva empresa sem precisar splitar a planilha manualmente no Excel.

### 6. Critérios para concluir a etapa
- Fonte devidamente vinculada a pelo menos um contêiner organizacional do cliente.

### 7. Próximo passo recomendado
- Disparar a Leitura Autônoma e Perfilar os Dados.

---

## Etapa 3: Perfomance e Leitura Autônoma (Perfil do Caos)

### 1. Objetivo da etapa
Executar a leitura dos registros e estrutura física da fonte sem intervenção braçal do consultor, construindo o mapa semântico e estatístico inicial.

### 2. Ações do consultor
- Acompanhar passivamente o progresso de leitura autônoma do ASTERION.

### 3. Ações automáticas del ASTERION
- Analisar todas as abas de planilhas (`.xlsx`/`.ods`) ou tabelas de banco selecionadas.
- Executar o Perfil do Caos: contagem de linhas, colunas, tipos detectados (texto, data, moeda, inteiro), incidência de nulos e valores discrepantes.
- Classificar previamente papéis conceituais de colunas (Receita, Custo, Categoria, Data, Filial).
- Atualizar o estado da empresa para **`DISCOVERING`** e em seguida **`WAITING_CONFIRMATION`**.

### 4. Possíveis problemas encontrados
- Colunas com tipos de dados incompatíveis ou misturados (ex: texto *"a combinar"* em coluna de valores monetários).
- Datas em formatos inconsistentes (ex: `31/12/2025`, `2025-12-31`, `45657` serial do Excel na mesma coluna).
- Abas com estruturas e nomes de colunas totalmente diferentes na mesma planilha.

### 5. Como o sistema auxilia na resolução
- **Exceção de Tipos Incompatíveis**: O ASTERION isola as linhas com ruído sem descartar o arquivo, apresentando ao consultor o impacto exato (ex: *"99.2% dos valores são numéricos, 3 linhas possuem texto. Converteremos o ruído para zero mantendo a auditoria"*).
- **Exceção de Datas Inconsistentes**: O sistema reconhece padrões híbridos de data e sugere a padronização automática para o calendário fiscal da empresa.
- **Exceção de Colunas Diferentes entre Abas**: O ASTERION sugere a unificação semântica de colunas similares (ex: *"Vendas"* na Aba 1 e *"Faturamento"* na Aba 2 tratadas sob o mesmo papel conceitual).

### 6. Critérios para concluir a etapa
- Finalização da leitura de todas as linhas e disponibilização do mapa de entendimento.

### 7. Próximo passo recomendado
- Navegar para a Validação da Compreensão da Fonte.

---

## Etapa 4: Atualização, Substituição e Consolidação Continuada de Fontes

### 1. Objetivo da etapa
Permitir a evolução contínua da base de dados durante a consultoria através de cargas incrementais mensais, substituição total de arquivos incorretos ou consolidação de fontes históricas.

### 2. Ações do consultor
- Escolher a operação de atualização sobre uma fonte existente:
  - **Atualização Incremental**: Adicionar novas planilhas/registros mantendo os meses anteriores.
  - **Substituição Total**: Substituir uma planilha antiga por uma versão revisada enviada pelo cliente.
  - **Ativação / Desativação**: Ativar ou pausar temporariamente a leitura de uma fonte específica sem apagá-la do histórico.

### 3. Ações automáticas do ASTERION
- Na **Substituição Total**: Manter os mapeamentos conceituais e atritar apenas novas colunas eventualmente surgidas no arquivo substituto.
- Na **Atualização Incremental**: Verificar a compatibilidade de colunas e planos de contas com a carga anterior, destacando divergências.
- Na **Ativação / Desativação**: Recalcular instantaneamente todos os indicadores do engajamento excluindo ou incluindo os dados da fonte alterada.

### 4. Possíveis problemas encontrados
- **Arquivo Duplicado**: Upload acidental do mesmo arquivo já importado anteriormente.
- **Plano de Contas Diferente na Nova Carga**: O cliente altera os códigos ou nomes das contas contábeis de um mês para o outro.
- **Centros de Custo Diferentes**: Inclusão de novas unidades ou departamentos na nova planilha sem histórico prévio.

### 5. Como o sistema auxilia na resolução
- **Exceção de Arquivo Duplicado**: O ASTERION alerta que o arquivo já existe no engajamento por verificação de hash/conteúdo, perguntando se o consultor deseja ignorar a importação ou substituir o existente.
- **Exceção de Plano de Contas / Centros de Custo Diferentes**: O sistema destaca visualmente as novas contas ou centros de custo que não existiam nas cargas anteriores, permitindo que o consultor encaixe o novo item na árvore do DRE com 1 clique sem quebrar os meses passados.

### 6. Critérios para concluir a etapa
- Carga incremental, substituição ou alteração de estado da fonte concluída com rastreabilidade auditável.

### 7. Próximo passo recomendado
- Prosseguir para a Validação do Entendimento ou atualização imediata dos Diagnósticos.

---

# 3. Matriz de Tratamento de Casos Obrigatórios

| Caso de Exceção | Detecção Automática do ASTERION | Solução Proposta ao Consultor | Ação no Excel Necessária? |
| --- | --- | --- | --- |
| **Arquivo Duplicado** | Alerta por Hash/Nome de arquivo | Cancelar envio ou Substituir versão antiga | **NÃO** |
| **Colunas Diferentes entre Fontes** | Mapeador de Schema compara colunas | Sugere alinhamento semântico ou omissão pontual | **NÃO** |
| **Tipos Incompatíveis na Coluna** | Analisador de Tipos do Perfil do Caos | Sanitização segura mantendo registro físico rastreável | **NÃO** |
| **Datas Inconsistentes (Formatos Híbridos)** | Parser de Data Multi-Formato | Normalização automática para o padrão fiscal | **NÃO** |
| **Múltiplas Empresas na Mesma Fonte** | Leitor de CNPJ e Razão Social | Separação lógica por Empresa com 1 clique | **NÃO** |
| **Múltiplos CNPJs** | Agrupador Organizacional | Mapeamento direto de cada CNPJ à sua unidade cadastrada | **NÃO** |
| **Plano de Contas Diferente** | Comparador de Árvore Contábil | Encaixe de novas contas na estrutura do DRE existente | **NÃO** |
| **Centros de Custo Diferentes** | Detector de Novas Filiais/Setores | Atribuição ao centro de custo correspondente no sistema | **NÃO** |
| **Conexão SQL Perdida** | Monitor de Health-Check SQL | Alerta de desconexão com tentativa automática de reconexão | **NÃO** |
| **Atualização Incremental** | Detector de Cargas Periódicas | Anexação dos novos meses à série histórica já validada | **NÃO** |
| **Substituição Total de Arquivo** | Gestor de Versões de Fonte | Troca do arquivo físico preservando os mapeamentos aprovados | **NÃO** |
| **Consolidação de Múltiplas Bases** | Engine de Consolidação Multi-Fonte | Leitura integrada de planilhas de filiais sob a mesma Empresa/Grupo | **NÃO** |

---

# 4. Princípios de Rastreabilidade e Não-Destruição

1. **Imutabilidade do Dado Bruto**: O arquivo físico ou tabela SQL original é mantido intocado em sua forma nativa. Nenhuma célula é modificada na origem.
2. **Camada Transparente de Transformação**: Toda conversão de tipo, remoção de ruído ou unificação de colunas fica registrada em um log de transformação auditável.
3. **Data Lineage (Linhagem Completa)**: Ao visualizar qualquer valor no engajamento, o consultor pode rastrear exatamente qual arquivo, aba, linha e coluna geraram aquela informação.
