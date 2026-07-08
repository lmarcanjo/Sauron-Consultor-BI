import React, { useState, useMemo } from "react";
import { Layers, ChevronRight, ChevronDown, Check, Plus, Trash, Folder, Grid, MapPin, Tag } from "lucide-react";
import { LancamentoFinanceiro } from "../types";

interface ModeloConsultivoTabProps {
  dataOrigem: LancamentoFinanceiro[];
  formatCurrency: (v: number) => string;
}

export const ModeloConsultivoTab: React.FC<ModeloConsultivoTabProps> = ({
  dataOrigem,
  formatCurrency
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [customGroupings, setCustomGroupings] = useState<Array<{ id: string; name: string; keys: string[] }>>([
    { id: "1", name: "Marcas Premium", keys: ["BMW", "BYD"] },
    { id: "2", name: "Operações Sudeste", keys: ["Matriz São Paulo", "Matriz Rio de Janeiro"] }
  ]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupKeys, setNewGroupKeys] = useState("");

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, nodeId: !prev[nodeId] }));
    // Wait, the key was written literally as "nodeId". Let's write `[nodeId]: !prev[nodeId]` instead!
  };

  const handleToggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Hierarchy computed live from actual filtered or original data
  const hierarquia = useMemo(() => {
    const tree: Record<string, any> = {};

    dataOrigem.forEach((item) => {
      const g = item.Grupo || "Sem Grupo";
      const c = item.CNPJ || "Sem CNPJ";
      const m = item.Marca || "Sem Marca";
      const f = item.Filial || "Sem Filial";
      const r = item.Razão || "Sem Razão";
      const cat = item.Categoria || "Sem Categoria";

      if (!tree[g]) tree[g] = { label: g, type: "Grupo", sub: {}, receita: 0, lucro: 0 };
      tree[g].receita += item.Receita;
      tree[g].lucro += item.Lucro;

      if (!tree[g].sub[c]) tree[g].sub[c] = { label: `CNPJ ${c}`, type: "CNPJ", sub: {}, receita: 0, lucro: 0 };
      tree[g].sub[c].receita += item.Receita;
      tree[g].sub[c].lucro += item.Lucro;

      if (!tree[g].sub[c].sub[m]) tree[g].sub[c].sub[m] = { label: m, type: "Marca", sub: {}, receita: 0, lucro: 0 };
      tree[g].sub[c].sub[m].receita += item.Receita;
      tree[g].sub[c].sub[m].lucro += item.Lucro;

      if (!tree[g].sub[c].sub[m].sub[f]) tree[g].sub[c].sub[m].sub[f] = { label: f, type: "Filial", sub: {}, receita: 0, lucro: 0 };
      tree[g].sub[c].sub[m].sub[f].receita += item.Receita;
      tree[g].sub[c].sub[m].sub[f].lucro += item.Lucro;

      if (!tree[g].sub[c].sub[m].sub[f].sub[r]) tree[g].sub[c].sub[m].sub[f].sub[r] = { label: r, type: "Razão", sub: {}, receita: 0, lucro: 0 };
      tree[g].sub[c].sub[m].sub[f].sub[r].receita += item.Receita;
      tree[g].sub[c].sub[m].sub[f].sub[r].lucro += item.Lucro;

      if (!tree[g].sub[c].sub[m].sub[f].sub[r].sub[cat]) {
        tree[g].sub[c].sub[m].sub[f].sub[r].sub[cat] = { label: cat, type: "Categoria", receita: 0, lucro: 0 };
      }
      tree[g].sub[c].sub[m].sub[f].sub[r].sub[cat].receita += item.Receita;
      tree[g].sub[c].sub[m].sub[f].sub[r].sub[cat].lucro += item.Lucro;
    });

    return tree;
  }, [dataOrigem]);

  const handleAddGrouping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupKeys.trim()) return;
    const keysArray = newGroupKeys.split(",").map(k => k.trim()).filter(Boolean);
    const newGroup = {
      id: String(Date.now()),
      name: newGroupName,
      keys: keysArray
    };
    setCustomGroupings([...customGroupings, newGroup]);
    setNewGroupName("");
    setNewGroupKeys("");
  };

  const handleRemoveGrouping = (id: string) => {
    setCustomGroupings(customGroupings.filter(g => g.id !== id));
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-150 animate-fade-in" id="modelo-consultivo-tab">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
          <Layers size={15} className="text-blue-500" />
          <span>Modelo Consultivo &amp; Estrutura Hierárquica Virtual</span>
        </h3>
        <p className="text-[10px] text-slate-500 leading-relaxed max-w-3xl">
          Navegue abaixo pelo organograma virtual de consolidação. Os dados estão estruturados no Sauron sob o fluxo canônico de controle BI, permitindo que você analise cada indicador partindo do <strong>Grupo Geral</strong> e ramificando até a <strong>Razão Financeira</strong> e suas respectivas <strong>Categorias</strong>.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Hierarchical tree viewer (span 2) */}
          <div className="lg:col-span-2 border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900 overflow-hidden">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-3">Navegabilidade de Nós Canônicas</span>
            
            <div className="space-y-2 select-none overflow-y-auto max-h-[500px] text-xs font-mono">
              {Object.values(hierarquia).map((gNode: any) => {
                const isGExpanded = expandedNodes[gNode.label];
                return (
                  <div key={gNode.label} className="space-y-1">
                    <div 
                      onClick={() => handleToggleNode(gNode.label)}
                      className="flex items-center justify-between p-2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-705/50 cursor-pointer hover:bg-blue-50/20"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
                        {isGExpanded ? <ChevronDown size={14} className="text-blue-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                        <Folder size={13} className="text-amber-500" />
                        <span>{gNode.label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold">
                        <span className="text-slate-500">Rec: <span className="text-slate-700 dark:text-slate-300">{formatCurrency(gNode.receita)}</span></span>
                        <span className="text-slate-500">Luc: <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(gNode.lucro)}</span></span>
                      </div>
                    </div>

                    {isGExpanded && (
                      <div className="pl-4 border-l border-slate-250 dark:border-slate-800 space-y-1 mt-1">
                        {Object.values(gNode.sub).map((cNode: any) => {
                          const isCExpanded = expandedNodes[cNode.label];
                          return (
                            <div key={cNode.label} className="space-y-1">
                              <div 
                                onClick={() => handleToggleNode(cNode.label)}
                                className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-850 hover:bg-slate-100/50 cursor-pointer"
                              >
                                <div className="flex items-center gap-1">
                                  {isCExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                  <Grid size={11} className="text-indigo-500" />
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{cNode.label}</span>
                                </div>
                                <span className="text-[9px] text-slate-550 mr-2">Rec: {formatCurrency(cNode.receita)}</span>
                              </div>

                              {isCExpanded && (
                                <div className="pl-4 border-l border-slate-200 dark:border-slate-800 space-y-1 mt-1">
                                  {Object.values(cNode.sub).map((mNode: any) => {
                                    const isMExpanded = expandedNodes[mNode.label];
                                    return (
                                      <div key={mNode.label} className="space-y-1">
                                        <div 
                                          onClick={() => handleToggleNode(mNode.label)}
                                          className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/50 cursor-pointer"
                                        >
                                          <div className="flex items-center gap-1">
                                            {isMExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                            <Tag size={11} className="text-emerald-500" />
                                            <span className="font-extrabold text-blue-600 dark:text-blue-400">{mNode.label}</span>
                                          </div>
                                          <span className="text-[9px] text-slate-500 mr-2">Lucro: {formatCurrency(mNode.lucro)}</span>
                                        </div>

                                        {isMExpanded && (
                                          <div className="pl-4 border-l border-slate-205 dark:border-slate-800 space-y-1">
                                            {Object.values(mNode.sub).map((fNode: any) => {
                                              const isFExpanded = expandedNodes[fNode.label];
                                              return (
                                                <div key={fNode.label} className="space-y-1">
                                                  <div 
                                                    onClick={() => handleToggleNode(fNode.label)}
                                                    className="flex items-center justify-between p-1 rounded hover:bg-slate-100 cursor-pointer text-[11px]"
                                                  >
                                                    <div className="flex items-center gap-1">
                                                      {isFExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                                      <MapPin size={10} className="text-sky-505" />
                                                      <span className="text-slate-600 dark:text-slate-350">{fNode.label}</span>
                                                    </div>
                                                  </div>

                                                  {isFExpanded && (
                                                    <div className="pl-4 border-l border-slate-150 dark:border-slate-800 space-y-1 text-[10px]">
                                                      {Object.values(fNode.sub).map((rNode: any) => (
                                                        <div key={rNode.label} className="p-1 rounded bg-slate-100/30 flex items-center justify-between">
                                                          <span className="text-slate-500 font-bold">Eixo Central: <span className="text-slate-800 dark:text-white">{rNode.label}</span></span>
                                                          <span className="font-bold text-red-650 dark:text-red-400">-{formatCurrency(rNode.receita * 0.15)}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right sidebar for customizing groupings without database mutation */}
          <div className="space-y-4">
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 space-y-3">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Central de Filtros e Agrupamentos Virtuais</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Você pode agrupar marcas ou filiais sob uma única etiqueta virtual (ex: "Marcas Premium", "Filiais de Alta Performance"). É uma camada puramente consultiva construída no Sauron, sem modificar as colunas físicas do banco de dados legado.
              </p>

              <form onSubmit={handleAddGrouping} className="space-y-2 pt-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-505 uppercase block mb-1">Nome do Agrupamento Consultivo</label>
                  <input 
                    type="text" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Ex: Nordeste Tech"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-705 px-2.5 py-1.5 rounded text-[11px] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-505 uppercase block mb-1">Chaves Equivalentes (valores separados por vírgula)</label>
                  <input 
                    type="text" 
                    value={newGroupKeys}
                    onChange={(e) => setNewGroupKeys(e.target.value)}
                    placeholder="Toyota, BYD"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-705 px-2.5 py-1.5 rounded text-[11px] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase rounded transition-colors cursor-pointer"
                >
                  <Plus size={11} className="inline mr-1" />
                  Salvar Grupo Virtual
                </button>
              </form>

              {/* Groupings list */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Grupos Virtuais Ativos</span>
                
                {customGroupings.map((g) => (
                  <div key={g.id} className="p-2 rounded bg-slate-50 dark:bg-slate-850 flex items-center justify-between border border-slate-100 dark:border-slate-805">
                    <div>
                      <p className="font-extrabold text-slate-700 dark:text-white text-[11px]">{g.name}</p>
                      <p className="text-[9px] text-slate-450 mt-0.5 font-mono">Chaves: {g.keys.join(", ")}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveGrouping(g.id)}
                      className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
