# SAURON DESIGN LANGUAGE — DATA VISUALIZATION

O Sauron baseia suas decisões executivas em dados rigorosos. Este guia padroniza a aparência de todos os gráficos gerados por Recharts ou D3 na plataforma para garantir que todos pareçam da mesma família de produtos.

---

## 1. PALETA DE CORES DOS GRÁFICOS (SDL 11)

As cores dos eixos, barras, linhas e preenchimentos seguem regras semânticas estritas de alta precisão:

| Métrica / Status | Cor Hex | Uso |
| :--- | :--- | :--- |
| **Faturamento / Receita Real** | `#3b82f6` (Blue 500) | Linha ou barra principal de resultados reais. |
| **Meta / Orçamento** | `#10b981` (Emerald 500) | Meta estipulada (frequentemente tracejada com `strokeDasharray="5 5"`). |
| **CMV / Custos Fixo** | `#f59e0b` (Amber 500) | Custos operacionais e despesas controláveis. |
| **Perda / Gargalo** | `#ef4444` (Red 500) | Quebra de margem, despesas excedentes ou multas. |
| **Eixos & Grades** | `#1e293b` (Slate 800) | Cor fina de demarcação de eixos e grades. |
| **Rótulos (Labels)** | `#64748b` (Slate 500) | Fonte pequena e discreta para eixos X e Y. |

---

## 2. COMPORTAMENTO E DESIGN DE GRÁFICOS

• **Eixos e Grades**: Grades cartesianas devem usar linhas tracejadas sutis (`strokeDasharray="3 3"`). Eixos de texto devem usar tipografia Mono em tamanho reduzido (`fontSize={9}` ou `fontSize={10}`).
• **Tooltips Elegantes**: Tooltips customizados devem usar fundos escuros de alta densidade (`bg-slate-900` ou `bg-slate-950`), com bordas arredondadas e finas (`rounded-lg border border-slate-800`), contendo dados em tipografia monoespaçada altamente legível.
• **ResponsiveContainer**: Sempre envolva gráficos em `ResponsiveContainer` com `width="100%"` e `height="100%"` para garantir redimensionamento perfeito em redimensionamentos de tela ou abertura de gavetas laterais.
• **Anomalias e Benchmarks**: Metas ou linhas de benchmark devem usar linhas tracejadas horizontais (`ReferenceLine`) sinalizadas em cores suaves para contextualizar os limites de segurança da operação.
