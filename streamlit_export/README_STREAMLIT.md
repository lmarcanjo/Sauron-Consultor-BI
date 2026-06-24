# 📊 Instruções de Execução - Consultor BI Agent OS (Streamlit)

Este é o protótipo em Python com Streamlit desenvolvido de acordo com as especificações solicitadas para auditorias, BI e diagnósticos de grupos com múltiplos CNPJs e marcas.

## 🚀 Como Executar o Protótipo Streamlit Localmente

Para rodar esta aplicação de forma independente no seu computador, siga o passo a passo abaixo:

### Passo 1: Preparar o Ambiente Python
Certifique-se de ter o Python 3.8 ou superior instalado na sua máquina.

### Passo 2: Instalar as Dependências Necessárias
Abra o seu terminal na pasta do projeto e execute o comando abaixo para instalar as bibliotecas de processamento de dados e gráficos:

```bash
pip install streamlit pandas plotly openpyxl
```

*(Ou utilize o arquivo `requirements.txt` fornecido na pasta do projeto)*:
```bash
pip install -r requirements.txt
```

### Passo 3: Iniciar o Streamlit Server
Execute o comando a seguir para inicializar a aplicação no seu navegador:

```bash
streamlit run app.py
```

Pronto! A aplicação será aberta automaticamente em uma aba do seu navegador (geralmente no endereço `http://localhost:8501`).

---

## 📅 Estrutura Esperada da Planilha de Entrada

Para realizar o upload de dados customizados via Excel (`.xlsx`) ou CSV (`.csv`), garanta que o seu arquivo de entrada possua a estrutura de colunas abaixo.

**Observação:** O sistema é tolerante a variações. Se os campos **Lucro** e **Margem** estiverem ausentes, o sistema irá calculá-los de forma inteligente em tempo real (`Lucro = Receita - Custo - Despesa`).

### 📌 Colunas Obrigatórias Esperadas:
1. **Grupo**: Nome do Grupo Econômico (ex: `Grupo Carbon Motors`).
2. **CNPJ**: CNPJ da concessionária ou unidade operacional (ex: `12.345.678/0001-90`).
3. **Marca**: Marca/Bandeira operada (ex: `Toyota`, `Chevrolet`, `BMW`).
4. **Empresa**: Nome oficial ou Razão Social (ex: `Grupo Carbon Motors - Toyota S/A`).
5. **Filial**: Nome identificador da filial da marca (ex: `Filial Toyota Centro`).
6. **Mês**: Mês de competência (ex: `Janeiro`, `Fevereiro`).
7. **Razão** *(Foco Principal)*: Razão contábil ou rubrica de despesa (ex: `Custo de Ocupação`, `Pessoal de Vendas`).
8. **Categoria**: Classificação do lançamento (ex: `Infraestrutura`, `Comissões`).
9. **Receita**: Valor faturado bruto em formato decimal (ex: `185000.00`).
10. **Custo**: Custo de mercadorias vendidas ou operacional (ex: `140000.00`).
11. **Despesa**: Despesa operacional de centro de custo (ex: `14800.00`).

---

## 🤖 Análises Disponíveis no Dashboard
- **Metrificação Financeira Inteligente**: Visualização instantânea de faturamento, custo, gastos e resultado líquido acumulado sob diferentes seleções.
- **Auditoria de Integridade**: Rastreamento de dados importados vs. filtrados e diagnóstico de colunas ausentes geradas por simulação reversa.
- **Foco Analítico na Razão**: Identificação imediata e fracionada de qual rubrica de despesa está impactando as margens do grupo multi-marca.
- **Relatório Compacto**: Exportações e agrupamentos por CNPJ, Marca ou Grupo em formato CSV compatível com Excel local brasileiro (com pontuação e codificação ideal).
