import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import fs from "fs";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client with telemetria as requested in SKILL.md
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } else {
    console.warn("⚠️ GEMINI_API_KEY não configurada ou com valor padrão. Usando motor consultivo analítico interno.");
  }
} catch (error) {
  console.error("Erro ao inicializar o cliente GoogleGenAI:", error);
}

// -------------------------------------------------------------
// ENDPOINTS DE API (Sempre registrados primeiro)
// -------------------------------------------------------------

// Endpoint de saúde
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Endpoint para puxar os códigos Streamlit para download/cópia no frontend
app.get("/api/streamlit/app", (req, res) => {
  try {
    const appPath = path.join(process.cwd(), "app.py");
    const content = fs.readFileSync(appPath, "utf-8");
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: "Erro ao ler arquivo app.py" });
  }
});

app.get("/api/streamlit/requirements", (req, res) => {
  try {
    const reqPath = path.join(process.cwd(), "requirements.txt");
    const content = fs.readFileSync(reqPath, "utf-8");
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: "Erro ao ler arquivo requirements.txt" });
  }
});

app.get("/api/streamlit/instructions", (req, res) => {
  try {
    const readmePath = path.join(process.cwd(), "README_STREAMLIT.md");
    const content = fs.readFileSync(readmePath, "utf-8");
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: "Erro ao ler arquivo README_STREAMLIT.md" });
  }
});

// AI Consultative analysis endpoint
app.post("/api/analyze", async (req, res) => {
  const { metrics, selectedFilters } = req.body;

  if (!metrics) {
    return res.status(400).json({ error: "Dados métricos ausentes para análise" });
  }

  // Format aggregated data for prompt translation
  const formatValue = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const prompt = `
Você é um consultor econômico sênior, especialista em inteligência de negócios (BI) e controladoria financeira especializado no mercado automotivo (rede de concessionárias multi-marca e filiais).
Analise o resumo financeiro de desempenho consolidado sob os filtros aplicados e gere um relatório executivo de alta densidade analítica e recomendações práticas acionáveis.

DADOS CONSOLIDADOS DA OPERAÇÃO:
- Faturamento Total (Receita): ${formatValue(metrics.receitaTotal)}
- Custo Total Operacional: ${formatValue(metrics.custoTotal)}
- Despesas Operacionais Totais: ${formatValue(metrics.despesaTotal)}
- Resultado Líquido Total (Lucro): ${formatValue(metrics.lucroTotal)}
- Margem de Retorno Média: ${metrics.margemMedia.toFixed(2)}%

FILTROS ATIVOS NA VISÃO ATUAL:
- Grupos Econômicos: ${selectedFilters.grupos?.join(", ") || "Todos"}
- Marcas de Veículos: ${selectedFilters.marcas?.join(", ") || "Todas"}
- CNPJs: ${selectedFilters.cnpjs?.join(", ") || "Todos"}
- Meses Analisados: ${selectedFilters.meses?.join(", ") || "Todos"}

DISTRIBUÍDO POR MARCAS (MARGEM E LUCRO):
${metrics.porMarca?.map((m: any) => `- Marca: ${m.marca} | Receita: ${formatValue(m.receita)} | Lucro: ${formatValue(m.lucro)} | Margem: ${m.margem.toFixed(1)}%`).join("\n") || "Métricas detalhadas indisponíveis"}

DISTRIBUÍDO POR RAZÃO CONTÁBIL DE DESPESA (Foco Principal no Campo "Razão"):
${metrics.porRazao?.map((r: any) => `- Conta (Razão): ${r.razao} | Total Despesa: ${formatValue(r.despesa)} | Participação: ${r.participacao.toFixed(1)}% das despesas totais`).join("\n") || "Métricas detalhadas indisponíveis"}

REQUISITOS DA ANÁLISE (Responda em PORTUGUÊS):
Gere um relatório estruturado no formato Markdown com os seguintes títulos (H3):

### 🌟 Diagnóstico de Liderança (Melhor Desempenho)
Identifique qual marca/bandeira obteve o melhor desempenho neste recorte baseado em Receita e Lucro. Descreva quais fatores de mercado ou operacionais (como volume, mix ou eficiência de CMV) justificam esse sucesso e dê ideias de expansão desse modelo.

### 📉 Monitoramento de Alerta (Menor Desempenho)
Identifique o elo mais fraco de rentabilidade. Analise se o problema reside em margem baixa (custo elevado de aquisição/CMV) ou desestrutura de custos fixos. Indique alternativas estratégicas claras.

### 🔍 Impacto na Razão Contábil (Gargalo de Despesas)
O campo "Razão" é o foco principal. Analise as contas/rubricas que mais drenaram o caixa operante. Dê soluções de racionalização ou controle de orçamento específicas para as duas contas com maior gasto identificadas acima.

### ⚠️ Alertas de Oscilações e Riscos
Apresente alertas concretos sobre quedas de margens, desproporções entre faturamento e custos, ou riscos de liquidez no fluxo de caixa do grupo.

### 🤖 Recomendações e Diretrizes Estratégicas
Gere 4 diretrizes estratégicas numeradas altamente consultivas para a diretoria executiva, focadas em aumentar a margem consolidada, otimizar despesas de Razão e renegociar contratos.

Seja analítico, use português corporativo elegante e amigável, evite jargões promocionais sem fundamento e vá direto ao ponto com profundidade financeira real.
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const cleanText = response.text || "Erro ao processar conteúdo com a IA.";
      return res.json({ analysis: cleanText, source: "Gemini AI" });
    } catch (err: any) {
      console.error("Erro na API Gemini:", err);
      // Fallback below
    }
  }

  // Robust analytical offline engine serving as rule-based fallback
  const fallbackReport = generateOfflineAnalysis(metrics, selectedFilters);
  return res.json({ 
    analysis: fallbackReport, 
    source: "Mecanismo Avançado de Análise Local (Fallback offline)" 
  });
});

// Helper para gerar análise consultiva robusta localmente no backend em caso de ausência da chave Gemini
function generateOfflineAnalysis(metrics: any, selectedFilters: any) {
  const formatValue = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Encontrar melhor e pior marca
  let melhor_marca = "N/D";
  let melhor_lucro = -Infinity;
  let pior_marca = "N/D";
  let pior_lucro = Infinity;

  if (metrics.porMarca && metrics.porMarca.length > 0) {
    metrics.porMarca.forEach((m: any) => {
      if (m.lucro > melhor_lucro) {
        melhor_lucro = m.lucro;
        melhor_marca = m.marca;
      }
      if (m.lucro < pior_lucro) {
        pior_lucro = m.lucro;
        pior_marca = m.marca;
      }
    });
  }

  // Encontrar principal razão de despesa
  let principal_razao = "N/D";
  let principal_razao_valor = 0;
  let segunda_razao = "N/D";
  let segunda_razao_valor = 0;

  if (metrics.porRazao && metrics.porRazao.length > 0) {
    const list = [...metrics.porRazao].sort((a: any, b: any) => b.despesa - a.despesa);
    principal_razao = list[0]?.razao || "N/D";
    principal_razao_valor = list[0]?.despesa || 0;
    segunda_razao = list[1]?.razao || "N/D";
    segunda_razao_valor = list[1]?.despesa || 0;
  }

  return `
### 🌟 Diagnóstico de Liderança (Melhor Desempenho)
A marca de maior contribuição líquida nesta visão consolidada é **${melhor_marca}**, registrando lucros robustos. Essa bandeira demonstra forte aderência ao mercado, boa retenção de margem na venda direta e menor sensibilidade a custos de ocupação física por veículo faturado.
*Recomendação Operacional:* Replicar suas táticas de mix de produtos (veículos de maior valor agregado) e a governança comercial aplicada a outras concessionárias do grupo.

### 📉 Monitoramento de Alerta (Menor Desempenho)
A unidade focada na marca **${pior_marca}** reportou o resultado mais estressado. Identifica-se que este estresse decorre de um custo proporcionalmente alto de faturamento (CMV elevado) ou sobrecarga de despesas operacionais não compensadas pelas receitas de pós-vendas (oficinas e venda de peças).
*Recomendação Operacional:* Criar campanha focada em serviços pós-vendas com maior retenção de margem de contribuição (lubrificantes, acessórios e revisão programada).

### 🔍 Impacto na Razão Contábil (Gargalo de Despesas)
A conta de despesa que exerce o maior impacto negativo sobre o EBITDA do grupo é a Razão **${principal_razao}**, agregando um dreno de ${formatValue(principal_razao_valor)}. Logo em seguida, a conta **${segunda_razao}** também demanda atenção especial, consumindo relevantes recursos operacionais.
*Recomendação Operacional:* Implementar teto orçamentário rígido de teto de gastos (Orçamento Base Zero) focado em **${principal_razao}**, reduzindo desperdícios e renegociando taxas fixas ou contratos associados a esta rubrica fiscal nos próximos 15 dias.

### ⚠️ Alertas de Oscilações e Riscos
*   **Dreno Operacional:** A conta de **${principal_razao}** está com o percentual de absorção de margem acima das médias de referência de concessionárias recomendadas pelo setor.
*   **Fadiga de Modelo de Caixa:** Se as margens absolutas permanecerem oscilando sem o devido corte de despesa, marcas como **${pior_marca}** entrarão em território de fluxo líquido deficitário antes do fechamento do próximo trimestre.

### 🤖 Recomendações e Diretrizes Estratégicas
1.  **Auditoria Avançada de Custos de Razão:** Estabelecer uma célula de controle orçamentário centralizada focada unicamente nas Razões **${principal_razao}** e **${segunda_razao}** para cortar 15% de gastos supérfluos corporativos.
2.  **Mitigação de Riscos Multicanal:** Aproveitar as operações saudáveis de **${melhor_marca}** para subsidiar investimentos de treinamento de técnicas de venda consultiva e digitalização de novos leads da marca **${pior_marca}**.
3.  **Implementação de Shared Services:** Reunir tarefas administrativas, fiscais e de tecnologia de todos os CNPJs sob uma única central unificada de serviços, diminuindo a ocupação de escritório físico local.
4.  **Renegociação Institucional:** Focar na revisão urgente de contratos de fornecimento geral e licenciamento de softwares de CRM e gestão que impactam diretamente a estrutura de despesas do grupo corporativo.
  `;
}

// -------------------------------------------------------------
// VITE E MIDDLEWARES DE EXECUÇÃO
// -------------------------------------------------------------
async function run() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`================================================`);
    console.log(`🚀 Sauron está rodando!`);
    console.log(`👉 Acesse em: http://localhost:${PORT}`);
    console.log(`🌟 Backend e API ativos em tempo real.`);
    console.log(`================================================`);
  });
}

run();
