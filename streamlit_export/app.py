# -*- coding: utf-8 -*-
"""
Consultor BI Agent OS - Streamlit Application
Objetivo: Análise consultiva inteligente de dados de grupos corporativos multi-marca e multi-CNPJ.
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime

# Configuração da página do Streamlit
st.set_page_config(
    page_title="Sauron",
    page_icon="👁️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Estilização básica e customizada
st.markdown("""
<style>
    .kpi-container {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: #f8f9fa;
        border-left: 5px solid #007bff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
    }
    .kpi-title {
        font-size: 0.85rem;
        color: #6c757d;
        text-transform: uppercase;
        font-weight: bold;
    }
    .kpi-value {
        font-size: 1.6rem;
        font-weight: bold;
        color: #212529;
    }
    .kpi-positive {
        border-left: 5px solid #28a745 !important;
    }
    .kpi-negative {
        border-left: 5px solid #dc3545 !important;
    }
</style>
""", unsafe_allow_html=True)

# 2. SEÇÃO DE GERAÇÃO DE DADOS SIMULADOS (Caso nenhum arquivo seja enviado)
@st.cache_data
def gerar_dados_simulados():
    np.random.seed(42)
    
    meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho"]
    grupos = ["Grupo Carbon Motors", "Grupo Prime Auto"]
    
    marcas_por_grupo = {
        "Grupo Carbon Motors": ["Toyota", "Chevrolet", "Jeep"],
        "Grupo Prime Auto": ["BMW", "BYD", "Hyundai"]
    }
    
    cnpjs_por_marca = {
        "Toyota": "12.345.678/0001-90",
        "Chevrolet": "98.765.432/0001-10",
        "Jeep": "45.678.901/0001-22",
        "BMW": "55.444.333/0001-44",
        "BYD": "22.333.444/0001-55",
        "Hyundai": "88.777.666/0001-88"
    }
    
    razoes_despesa = [
        ("Custo de Ocupação", "Infraestrutura", "Despesa Fixa"),
        ("Pessoal de Vendas", "Comissões", "Despesa Comercial"),
        ("Pessoal Administrativo", "Salários & Encargos", "Despesa de Pessoal"),
        ("Propaganda e Marketing", "Divulgação Médias", "Despesa Comercial"),
        ("Serviços Terceirizados", "Manutenção e Segurança", "Despesa Fixa"),
        ("Despesas com Viagens", "Transporte e Estadias", "Despesa Operacional"),
        ("Sistemas de TI e Telecom", "Software e Licenças", "Despesa Fixa"),
        ("Material de Consumo", "Administração Geral", "Despesa Operacional")
    ]
    
    rows = []
    
    for grupo in grupos:
        marcas = marcas_por_grupo[grupo]
        for marca in marcas:
            cnpj = cnpjs_por_marca[marca]
            empresa = f"{grupo} - {marca} S/A"
            filiais = [f"Filial {marca} Centro", f"Filial {marca} Norte"]
            
            for filial in filiais:
                for mes_idx, mes in enumerate(meses):
                    # Tendência de aumento no mercado
                    fator_sazonal = 1.0 + (mes_idx * 0.08) + np.random.normal(0, 0.04)
                    
                    # Gerar receitas comerciais e despesas por razão
                    for razao, categoria, tipo in razoes_despesa:
                        # Receita proporcial ao tamanho da marca
                        if marca in ["Toyota", "BMW"]:
                            base_receita = 180000
                        elif marca in ["BYD", "Chevrolet"]:
                            base_receita = 140000
                        else:
                            base_receita = 95000
                            
                        receita = round(base_receita * fator_sazonal * np.random.uniform(0.85, 1.15), 2)
                        
                        # Custos de Venda (CMV de carros é geralmente alto, cerca de 70-80% da receita)
                        custo_pct = np.random.uniform(0.72, 0.78)
                        custo = round(receita * custo_pct, 2)
                        
                        # Despesas operacionais variáveis por razão
                        if "Pessoal" in razao or "Custo de Ocupação" in razao:
                            base_despesa = base_receita * 0.08
                        elif "Propaganda" in razao:
                            base_despesa = base_receita * 0.04
                        else:
                            base_despesa = base_receita * 0.02
                            
                        despesa = round(base_despesa * np.random.uniform(0.8, 1.2), 2)
                        
                        # Para focar na Razão como solicitada (cada linha é um lançamento analítico por Razão)
                        lucro = round(receita - custo - despesa, 2)
                        margem = round((lucro / receita) * 100, 2) if receita > 0 else 0.0
                        
                        rows.append({
                            "Grupo": grupo,
                            "CNPJ": cnpj,
                            "Marca": marca,
                            "Empresa": empresa,
                            "Filial": filial,
                            "Mês": mes,
                            "Razão": razao,
                            "Categoria": categoria,
                            "Receita": receita,
                            "Custo": custo,
                            "Despesa": despesa,
                            "Lucro": lucro,
                            "Margem": margem
                        })
                        
    return pd.DataFrame(rows)

# Título Principal do Painel
st.title("👁️ Sauron")
st.caption("Painel Consultivo de Inteligência de Negócios e Auditoria Multi-Empresas")

# 1. ÁREA DE CARREGAMENTO DE ARQUIVOS
st.sidebar.header("📁 Importações e Filtros")
upload_file = st.sidebar.file_uploader("Envie seu Relatório de Grupo (XLSX ou CSV)", type=["xlsx", "xls", "csv"])

# Lógica para carregar os de dados ou gerar simulados
dados_originais = None
registro_status = "Gerados via simulador inteligente padrão"

if upload_file is not None:
    try:
        if upload_file.name.endswith('.csv'):
            # Detecta separador comum no Brasil (sinalizando excel brasileiro)
            try:
                dados_originais = pd.read_csv(upload_file, sep=';', encoding='utf-8')
                if len(dados_originais.columns) < 5:
                    raise Exception("Colunas insuficientes com ';'")
            except Exception:
                dados_originais = pd.read_csv(upload_file, sep=',', encoding='utf-8')
        else:
            dados_originais = pd.read_excel(upload_file)
        
        # Normalização das colunas para evitar conflito de maiúsculo/minúsculo e acentos
        col_mapping = {col: col.strip().replace('Mes', 'Mês').replace('Razao', 'Razão').replace('Receita', 'Receita') for col in dados_originais.columns}
        dados_originais.rename(columns=col_mapping, inplace=True)
        registro_status = f"Carregado com sucesso através do arquivo '{upload_file.name}'"
    except Exception as e:
        st.error(f"Erro ao processar arquivo: {str(e)}. Utilizando dados simulados de backup.")
        dados_originais = gerar_dados_simulados()
        registro_status = "Erro no upload (Backup simulado carregado)"
else:
    dados_originais = gerar_dados_simulados()

# Verificar existências de colunas obrigatórias
colunas_obrigatorias = ["Grupo", "CNPJ", "Marca", "Empresa", "Filial", "Mês", "Razão", "Categoria", "Receita", "Custo", "Despesa", "Lucro", "Margem"]
campos_ausentes = [col for col in colunas_obrigatorias if col not in dados_originais.columns]

# Caso não existam os campos obrigatórios, simular colunas ausentes de forma inteligente
for col in campos_ausentes:
    if col == "Lucro":
        dados_originais["Lucro"] = dados_originais["Receita"] - dados_originais["Custo"] - dados_originais["Despesa"]
    elif col == "Margem":
        dados_originais["Margem"] = (dados_originais["Lucro"] / dados_originais["Receita"] * 100).fillna(0)
    else:
        dados_originais[col] = "N/D"

# 4. CRIAR FILTROS LATERAIS DINÂMICOS
st.sidebar.markdown("---")
st.sidebar.subheader("🎯 Refinar Visão")

# Grupo
lista_grupos = sorted(dados_originais["Grupo"].unique())
grupo_selecionado = st.sidebar.multiselect("Grupos", options=lista_grupos, default=lista_grupos)

# CNPJ (Filtrados pelo Grupo)
cnpjs_validos = dados_originais[dados_originais["Grupo"].isin(grupo_selecionado)]["CNPJ"].unique()
cnpj_selecionado = st.sidebar.multiselect("CNPJs", options=sorted(cnpjs_validos), default=sorted(cnpjs_validos))

# Marca
marcas_validas = dados_originais[dados_originais["CNPJ"].isin(cnpj_selecionado)]["Marca"].unique()
marca_selecionada = st.sidebar.multiselect("Marcas", options=sorted(marcas_validas), default=sorted(marcas_validas))

# Mês
meses_validos = dados_originais["Mês"].unique()
mes_selecionado = st.sidebar.multiselect("Meses de Competência", options=meses_validos, default=meses_validos)

# Razão (Foco solicitado)
razoes_validas = dados_originais["Razão"].unique()
razao_selecionada = st.sidebar.multiselect("Razões Contábeis", options=sorted(razoes_validas), default=sorted(razoes_validas))

# Aplicação dos filtros sobre a base de rastreabilidade
dados_filtrados = dados_originais[
    (dados_originais["Grupo"].isin(grupo_selecionado)) &
    (dados_originais["CNPJ"].isin(cnpj_selecionado)) &
    (dados_originais["Marca"].isin(marca_selecionada)) &
    (dados_originais["Mês"].isin(mes_selecionado)) &
    (dados_originais["Razão"].isin(razao_selecionada))
]

# 5. INDICADORES PRINCIPAIS (KPIs)
receita_total = dados_filtrados["Receita"].sum()
custo_total = dados_filtrados["Custo"].sum()
despesa_total = dados_filtrados["Despesa"].sum()
lucro_total = dados_filtrados["Lucro"].sum()
margem_media = (lucro_total / receita_total * 100) if receita_total > 0 else 0.0

st.subheader("📌 Indicadores Financeiros Consolidados")
kpi1, kpi2, kpi3, kpi4, kpi5 = st.columns(5)

with kpi1:
    st.markdown(f"""
    <div class="kpi-container">
        <div class="kpi-title">Faturamento Bruto</div>
        <div class="kpi-value">R$ {receita_total:,.2f}</div>
    </div>
    """, unsafe_allow_html=True)

with kpi2:
    st.markdown(f"""
    <div class="kpi-container kpi-negative">
        <div class="kpi-title">Custo Operacional</div>
        <div class="kpi-value">R$ {custo_total:,.2f}</div>
    </div>
    """, unsafe_allow_html=True)

with kpi3:
    st.markdown(f"""
    <div class="kpi-container kpi-negative">
        <div class="kpi-title">Gastos &amp; Despesas</div>
        <div class="kpi-value">R$ {despesa_total:,.2f}</div>
    </div>
    """, unsafe_allow_html=True)

with kpi4:
    color_border = "kpi-positive" if lucro_total >= 0 else "kpi-negative"
    st.markdown(f"""
    <div class="kpi-container {color_border}">
        <div class="kpi-title">Resultado Líquido</div>
        <div class="kpi-value">R$ {lucro_total:,.2f}</div>
    </div>
    """, unsafe_allow_html=True)

with kpi5:
    color_border = "kpi-positive" if margem_media >= 10 else "kpi-negative"
    st.markdown(f"""
    <div class="kpi-container {color_border}">
        <div class="kpi-title">Retorno Líquido Médio</div>
        <div class="kpi-value">{margem_media:.2f}%</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("---")

# 6. SEÇÃO DE GRÁFICOS INTERATIVOS PLOTLY
st.subheader("📈 Análise Gráfica e Distribuições")
g_col1, g_col2 = st.columns(2)

with g_col1:
    # Receita por marca
    receita_marca = dados_filtrados.groupby("Marca")["Receita"].sum().reset_index().sort_values(by="Receita", ascending=False)
    fig_rec_marca = px.bar(
        receita_marca, 
        x="Marca", 
        y="Receita", 
        title="Faturamento Bruto por Marca",
        labels={"Receita": "Receita (R$)", "Marca": "Marca/Bandeira"},
        color="Marca",
        color_discrete_sequence=px.colors.qualitative.Prism
    )
    st.plotly_chart(fig_rec_marca, use_container_width=True)

with g_col2:
    # Lucro por CNPJ
    lucro_cnpj = dados_filtrados.groupby("CNPJ")["Lucro"].sum().reset_index().sort_values(by="Lucro", ascending=False)
    fig_luc_cnpj = px.bar(
        lucro_cnpj, 
        y="CNPJ", 
        x="Lucro", 
        orientation="h",
        title="Lucratividade Líquida por Unidade (CNPJ)",
        labels={"Lucro": "Lucro (R$)", "CNPJ": "Unidade Operacional CNPJ"},
        color="Lucro",
        color_continuous_scale="RdYlGn"
    )
    st.plotly_chart(fig_luc_cnpj, use_container_width=True)

g_col3, g_col4 = st.columns(2)

with g_col3:
    # Despesas por razão (Foco Principal pedido no item 10)
    despesa_razao = dados_filtrados.groupby("Razão")["Despesa"].sum().reset_index().sort_values(by="Despesa", ascending=False)
    fig_des_razao = px.pie(
        despesa_razao, 
        values="Despesa", 
        names="Razão", 
        title="Estrutura de Despesas Operacionais por Razão Contábil (Centro de Custo)",
        color_discrete_sequence=px.colors.sequential.Electric
    )
    fig_des_razao.update_traces(textposition='inside', textinfo='percent+label')
    st.plotly_chart(fig_des_razao, use_container_width=True)

with g_col4:
    # Evolução mensal do lucro
    # Mapeamento estático apenas para ordenação
    ordem_meses = {"Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4, "Maio": 5, "Junho": 6, 
                    "Julho": 7, "Agosto": 8, "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12}
    
    lucro_mes = dados_filtrados.groupby("Mês")["Lucro"].sum().reset_index()
    lucro_mes["Ordem"] = lucro_mes["Mês"].map(ordem_meses).fillna(99)
    lucro_mes = lucro_mes.sort_values("Ordem")
    
    fig_evo_lucro = px.line(
        lucro_mes, 
        x="Mês", 
        y="Lucro", 
        title="Evolução Mensal do Resultado Líquido",
        labels={"Lucro": "Lucro Mensal (R$)", "Mês": "Meses"},
        markers=True
    )
    fig_evo_lucro.update_traces(line=dict(width=3, color='#2ca02c'))
    st.plotly_chart(fig_evo_lucro, use_container_width=True)

st.markdown("---")

# 7. SEÇÃO DE ANÁLISE CONSULTIVA COM IA REGULAMENTADA
st.subheader("🧠 Análise Consultiva Inteligente")

# Geração automática de métricas para a IA/Lógica Consultiva
if not dados_filtrados.empty:
    # 1. Melhor marca
    lucro_marca_aux = dados_filtrados.groupby("Marca")["Lucro"].sum()
    melhor_marca = lucro_marca_aux.idxmax()
    lucro_melhor_marca = lucro_marca_aux.max()
    
    # 2. Pior marca
    pior_marca = lucro_marca_aux.idxmin()
    lucro_pior_marca = lucro_marca_aux.min()
    
    # 3. Razões que mais gastaram despesa (foco na Razão)
    razoes_gastos = dados_filtrados.groupby("Razão")["Despesa"].sum().sort_values(ascending=False)
    top_razao_gasto = razoes_gastos.index[0] if len(razoes_gastos) > 0 else "Nenhum"
    top_razao_valor = razoes_gastos.values[0] if len(razoes_gastos) > 0 else 0
    segundo_razao_gasto = razoes_gastos.index[1] if len(razoes_gastos) > 1 else "Nenhum"
    segundo_razao_valor = razoes_gastos.values[1] if len(razoes_gastos) > 1 else 0
    
    # 4. Alertas de lucros decrescentes ou problemas
    alertas = []
    # Verificar queda de resultado líquido por mês cronológico
    if len(lucro_mes) > 1:
        for i in range(1, len(lucro_mes)):
            luc_anterior = lucro_mes.iloc[i-1]["Lucro"]
            luc_atual = lucro_mes.iloc[i]["Lucro"]
            mes_nome = lucro_mes.iloc[i]["Mês"]
            if luc_atual < luc_anterior:
                queda_pct = ((luc_anterior - luc_atual) / abs(luc_anterior) * 100) if luc_anterior != 0 else 0
                alertas.append(f"Queda de **{queda_pct:.1f}%** no resultado líquido consolidado em **{mes_nome}** comparado ao mês anterior.")
    
    if len(alertas) == 0:
        alertas.append("As operações estão apresentando trajetórias estáveis ou de crescimento contínuo.")
    
    # Gerar recomendações específicas do nicho baseado em dados de concessionária
    recomendacoes = [
        f"**Plano de Eficiência da Razão Contábil ({top_razao_gasto}):** Essa conta representa o maior dreno sobre as margens, acumulando R$ {top_razao_valor:,.2f}. Recomenda-se realizar uma auditoria de processos para cortar desnecessários.",
        f"**Apoiar a Operação de Baixo Desempenho ({pior_marca}):** A marca registrou o menor resultado acumulado de R$ {lucro_pior_marca:,.2f}. É vital reavaliar a política de faturamento tributário de veículos ou rever o mix de vendas da marca.",
        f"**Blindar a Estrela ({melhor_marca}):** Com o impressionante resultado de R$ {lucro_melhor_marca:,.2f}, estude expandir as operações dessa bandeira para novas geografias.",
        f"**Estruturação de Taxa Administrativa (Shared Services):** Como as despesas de administrativa e TI impactam múltiplos CNPJs, criar uma central de serviços compartilhados (CSC) mitigará custos de ocupação e pessoal administrativo redundantes."
    ]
else:
    melhor_marca, pior_marca = "N/D", "N/D"
    top_razao_gasto, top_razao_valor = "N/D", 0
    alertas = ["Nenhum dado ativo no momento do filtro."]
    recomendacoes = ["Selecione filtros adicionais para habilitar recomendações específicas."]

# Exibição do Painel Inteligente de Insights
consult_col1, consult_col2 = st.columns([1, 1])

with consult_col1:
    st.info("📊 Diagnóstico Consolidado do Agente")
    st.markdown(f"**🌟 Melhor Desempenho:** Marca **{melhor_marca}** (Resultado Consolidado)")
    st.markdown(f"**📉 Menor Desempenho:** Marca **{pior_marca}** (Gargalo de Retorno)")
    st.markdown(f"**🔍 Maior Alocadora de Despesas (Razão):** **{top_razao_gasto}** (Impactando R$ {top_razao_valor:,.2f})")
    
    st.markdown("**⚠️ Alertas Operacionais de Negócios:**")
    for alerta in alertas:
        st.markdown(f"• {alerta}")

with consult_col2:
    st.success("🤖 Diretrizes de Ação Recomendadas")
    for rec in recomendacoes:
        st.markdown(f"• {rec}")

st.markdown("---")

# 9. OPÇÃO DE RELATÓRIO CUSTOMIZÁVEL
st.subheader("📋 Central de Exportação de Relatórios")
export_opt = st.selectbox("Escolha o Nível de Agrupamento do Relatório:", [
    "Relatório Completo do Grupo", 
    "Relatório Individual por CNPJ", 
    "Relatório Individual por Marca"
])

if export_opt == "Relatório Completo do Grupo":
    df_export = dados_filtrados.groupby(["Grupo", "Empresa", "Mês"]).agg({
        "Receita": "sum", "Custo": "sum", "Despesa": "sum", "Lucro": "sum"
    }).reset_index()
elif export_opt == "Relatório Individual por CNPJ":
    df_export = dados_filtrados.groupby(["CNPJ", "Empresa", "Mês"]).agg({
        "Receita": "sum", "Custo": "sum", "Despesa": "sum", "Lucro": "sum"
    }).reset_index()
else:
    df_export = dados_filtrados.groupby(["Marca", "Empresa", "Mês"]).agg({
        "Receita": "sum", "Custo": "sum", "Despesa": "sum", "Lucro": "sum"
    }).reset_index()

# Recomputar margem oficial nos relatórios agrupados
df_export["Margem (%)"] = (df_export["Lucro"] / df_export["Receita"] * 100).round(2).fillna(0)

st.dataframe(df_export, use_container_width=True)

# Opções de downloads nativos do streamlit
col_down1, col_down2 = st.columns(2)
with col_down1:
    csv_data = df_export.to_csv(index=False, sep=';').encode('utf-8-sig')
    st.download_button(
        label="📥 Baixar Relatório Customizado em CSV",
        data=csv_data,
        file_name=f"relatorio_{export_opt.lower().replace(' ', '_')}.csv",
        mime="text/csv"
    )

with col_down2:
    st.write("💡 *Este arquivo é totalmente compatível com Excel brasileiro utilizando o codificador UTF-8 com BOM e pontuação de ponto-e-vírgula.*")

st.markdown("---")

# 11. ÁREA DE RASTREABILIDADE DOS DADOS (Requisito obrigatório)
st.subheader("🛡️ Rastreabilidade dos Dados & Auditoria Contábil")
audit_col1, audit_col2, audit_col3 = st.columns(3)

with audit_col1:
    st.metric("Total Importado (Base Original)", len(dados_originais))
    st.caption("Volume histórico completo detectado")

with audit_col2:
    st.metric("Total Filtrado (Visualização Atual)", len(dados_filtrados))
    st.caption("Registros incluídos sob os filtros selecionados")

with audit_col3:
    colunas_novas_criadas = len(campos_ausentes)
    status_auditoria = "Aprovado sem Correções" if colunas_novas_criadas == 0 else "Aprovado com Tratamento de Ausências"
    st.metric("Campos Ausentes Corrigidos", colunas_novas_criadas, help="Quantidade de colunas que faltavam e foram geradas sinteticamente para compatibilidade.")
    st.write(f"**Status da Modelagem**: {status_auditoria}")

if len(campos_ausentes) > 0:
    st.warning(f"⚠️ **Campos ausentes detectados no seu arquivo**: {', '.join(campos_ausentes)}. Criamos valores padrão ou fórmulas inteligentes para não quebrar a simulação.")

# Estrutura esperada de planilha de entrada (Requisito instrução)
with st.expander("📍 Ver Exemplo de Estrutura Esperada de Planilha de Entrada (XLSX ou CSV)"):
    st.markdown("""
    Abaixo está a estrutura de colunas que o painel aguarda para realizar a análise inteligente sem a necessidade de correções automatizadas secundárias:
    
    | Grupo | CNPJ | Marca | Empresa | Filial | Mês | Razão | Categoria | Receita | Custo | Despesa |
    | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
    | Grupo Carbon Motors | 12.345.678/0001-90 | Toyota | Grupo Carbon Motors - Toyota S/A | Filial Toyota Centro | Janeiro | Custo de Ocupação | Infraestrutura | 185000.00 | 140000.00 | 14800.00 |
    | Grupo Carbon Motors | 12.345.678/0001-90 | Toyota | Grupo Carbon Motors - Toyota S/A | Filial Toyota Centro | Janeiro | Pessoal de Vendas | Comissões | 185000.00 | 140000.00 | 15000.00 |
    | Grupo Prime Auto | 55.444.333/0001-44 | BMW | Grupo Prime Auto - BMW S/A | Filial BMW Norte | Fevereiro | Sistemas de TI e Telecom | Software e Licenças | 192000.00 | 151000.00 | 3500.00 |
    
    *Nota: Se os campos 'Lucro' e 'Margem' não forem enviados, o sistema irá calculá-los de forma dinâmica: `Lucro = Receita - Custo - Despesa` e `Margem = (Lucro / Receita) * 100`.*
    """)
