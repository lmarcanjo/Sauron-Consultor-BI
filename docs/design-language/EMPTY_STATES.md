# SAURON DESIGN LANGUAGE — EMPTY STATES

No Sauron OS, nenhum componente ou painel deve falhar silenciosamente ou exibir um vazio desolador quando não houver dados disponíveis. Os estados vazios funcionam como oportunidades de engajamento e instrução consultiva.

---

## 1. REGRAS DO ESTADO VAZIO (SDL 8)

Tabelas, gráficos e painéis sem dados para exibir devem obrigatoriamente prover uma estrutura de 3 blocos:
1. **Ícone de Contexto**: Um ícone da biblioteca `lucide-react` de tamanho `size={28}` ou `size={32}` em tons neutros desbotados (`text-slate-400` ou `text-slate-500`).
2. **Explicação Consultiva**: Um título curto (`text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1`) acompanhado de um texto descritivo sutil explicando por que os dados não estão aparecendo e qual seu impacto.
3. **Ação Sugerida ou Atalho**: Um botão ou link simples incentivando o usuário a tomar a iniciativa técnica para corrigir a ausência (ex: "Importar Planilha de Custos" ou "Configurar Conexão VPN").

---

## 2. EXEMPLO ESTRUTURAL DE ESTADO VAZIO

```tsx
import React from 'react';
import { FileSpreadsheet, Plus } from 'lucide-react';
import { DesignSystem } from '../../design-system';

export const EmptySpreadsheetState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
      <FileSpreadsheet size={32} className="text-slate-400 mb-3" />
      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">
        Nenhuma Planilha de Custos Importada
      </h4>
      <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed mb-4">
        Importe a planilha financeira oficial do concessionário para gerar a estrutura de DRE e as análises táticas correspondentes.
      </p>
      <button className={DesignSystem.Button.build('filled', 'sm')}>
        <Plus size={11} /> Importar Planilha
      </button>
    </div>
  );
};
```
