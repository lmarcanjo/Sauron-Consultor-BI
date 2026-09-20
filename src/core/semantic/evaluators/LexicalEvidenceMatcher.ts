import { SemanticCategory } from '../SemanticContracts';

export interface LexicalMatchResult {
  category: SemanticCategory;
  suggestedLabel: string;
  lexicalScore: number;
  patternMatched: string;
}

export class LexicalEvidenceMatcher {
  private static readonly RULES: { pattern: RegExp; category: SemanticCategory; label: string; score: number }[] = [
    // Identificadores / Chaves
    { pattern: /^(id|cod|codigo|code|pk|fk|key|uuid|guid)(_|$)/i, category: 'IDENTIFIER', label: 'Identificador / Chave', score: 0.90 },
    { pattern: /(_id|_cod|_codigo|_key)$/i, category: 'RELATIONSHIP_KEY', label: 'Chave de Relacionamento', score: 0.85 },

    // Datas e Horas (Temporal)
    { pattern: /^(dt|data|date|created_at|updated_at|timestamp|mes|ano|year|month|day)(_|$)/i, category: 'TEMPORAL', label: 'Data / Momento Temporal', score: 0.90 },
    { pattern: /(_dt|_data|_date)$/i, category: 'TEMPORAL', label: 'Data / Momento Temporal', score: 0.85 },

    // Valores Monetários (Medida Monetária)
    { pattern: /^(val|valor|vlr|price|preco|cost|custo|receita|revenue|faturamento|total_val|bruto|liquido)(_|$)/i, category: 'MONETARY_MEASURE', label: 'Valor Monetário', score: 0.85 },
    { pattern: /(_val|_valor|_vlr|_price|_preco|_custo|_receita)$/i, category: 'MONETARY_MEASURE', label: 'Valor Monetário', score: 0.85 },

    // Percentuais
    { pattern: /^(pct|perc|percentual|porcentagem|taxa|rate|margin|margem)(_|$)/i, category: 'PERCENTAGE', label: 'Percentual / Taxa', score: 0.85 },
    { pattern: /(_pct|_perc|_rate|_margem)$/i, category: 'PERCENTAGE', label: 'Percentual / Taxa', score: 0.85 },

    // Medidas Numéricas Quantitativas
    { pattern: /^(qtd|quant|quantidade|qty|quantity|num|numero|vol|volume)(_|$)/i, category: 'NUMERIC_MEASURE', label: 'Quantidade / Medida Numérica', score: 0.85 },
    { pattern: /(_qtd|_quant|_qty|_volume)$/i, category: 'NUMERIC_MEASURE', label: 'Quantidade / Medida Numérica', score: 0.85 },

    // Referência Organizacional / Cadastro
    { pattern: /^(empresa|company|filial|unidade|depto|departamento|setor|filial_id)(_|$)/i, category: 'ORGANIZATIONAL_REFERENCE', label: 'Referência Organizacional', score: 0.80 },
    { pattern: /^(cpf|cnpj|tax_id|rg|doc|documento)(_|$)/i, category: 'IDENTIFIER', label: 'Documento Fiscal / Registro', score: 0.90 },

    // Referência Geográfica
    { pattern: /^(uf|estado|cidade|city|state|pais|country|cep|zipcode|bairro|endereco)(_|$)/i, category: 'GEOGRAPHIC_REFERENCE', label: 'Referência Geográfica', score: 0.85 },

    // Flags Booleanas
    { pattern: /^(is_|has_|flg_|flag_|ativo|canceled|cancelado|status_flag)(_|$)/i, category: 'BOOLEAN_FLAG', label: 'Indicador Lógico (Sim/Não)', score: 0.90 },

    // Categorias / Status
    { pattern: /^(tipo|type|status|situacao|categoria|category|grupo|group)(_|$)/i, category: 'CATEGORICAL', label: 'Atributo Categórico / Status', score: 0.80 },

    // Descrições Textuais
    { pattern: /^(nome|name|desc|descricao|description|obs|observacao|titulo|title)(_|$)/i, category: 'TEXTUAL_DESCRIPTION', label: 'Nome / Descrição Textual', score: 0.85 }
  ];

  public static match(physicalName: string): LexicalMatchResult | null {
    const cleanName = physicalName.trim();

    for (const rule of this.RULES) {
      if (rule.pattern.test(cleanName)) {
        return {
          category: rule.category,
          suggestedLabel: `${rule.label} (${cleanName})`,
          lexicalScore: rule.score,
          patternMatched: rule.pattern.source
        };
      }
    }

    return null;
  }
}
