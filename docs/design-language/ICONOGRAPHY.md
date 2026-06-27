# SAURON DESIGN LANGUAGE — ICONOGRAPHY

Os ícones no Sauron OS funcionam como sinalizações táteis que complementam a tipografia, agilizando o reconhecimento de funções sem criar poluição visual.

---

## 1. PACOTE E FONTE OFICIAL (LUCIDE-REACT)

Todos os ícones da plataforma **devem** ser importados exclusivamente da biblioteca `lucide-react`. É terminantemente proibido importar SVGs brutos customizados ou misturar bibliotecas de ícones de fontes terceiras (como FontAwesome ou Heroicons).

---

## 2. DIMENSÕES E PESO DE LINHA PADRONIZADOS

Para manter o rigor estético, os ícones devem obedecer às seguintes regras de dimensionamento e espessura de traço:

| Categoria | Tamanho (px) | Propriedade Tailwind | Uso Recomendado |
| :--- | :--- | :--- | :--- |
| **Micro** | `11px` / `12px` | `size={11}` / `size={12}` | Ícones inline ao lado de textos de badge, mini botões ou status. |
| **Padrão** | `14px` / `15px` | `size={14}` / `size={15}` | Ícones padrão dentro de botões de barra de ferramentas e inputs. |
| **Médio** | `18px` / `20px` | `size={18}` / `size={20}` | Ícones de navegação em sidebar e cabeçalhos de gavetas (drawers). |
| **Destaque** | `24px` / `32px` | `size={24}` / `size={32}` | Cabeçalhos de estados vazios (Empty States) ou ilustrações táticas. |

---

## 3. SEMÂNTICA DOS ÍCONES

• **Ações Positivas / Conclusão**: Use `Check`, `CheckCircle2`, `Plus` ou `Play` em cores verdes ou azuis.
• **Aluções de Dados**: Use `BarChart3`, `Activity`, `TrendingUp` ou `DollarSign`.
• **Risco / Problemas**: Use `ShieldAlert`, `AlertTriangle` ou `Trash2`.
• **Navegação / Suporte**: Use `ChevronLeft`, `ChevronRight`, `X`, `HelpCircle`, `Layers` ou `BookOpen`.
