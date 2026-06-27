/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Search, Terminal, FileText, ArrowRight, User, FolderOpen, Calendar, HelpCircle, X } from "lucide-react";
import { searchEngine, SearchResultItem } from "../core/search/SearchEngine";
import { DesignSystem } from "../design-system";

interface CommandPaletteProps {
  onSelectTab: (tabId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onSelectTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Autofocus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Handle live querying
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setQuery(text);
    if (text.trim()) {
      const searchRes = searchEngine.search(text);
      setResults(searchRes);
    } else {
      setResults([]);
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    if (item.targetTab) {
      onSelectTab(item.targetTab);
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-in">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Pesquisar cliente, CNPJ, plano, relatório, ata... (Ctrl+K)"
            value={query}
            onChange={handleQueryChange}
            className="w-full bg-transparent text-xs text-slate-800 dark:text-white focus:outline-none placeholder-slate-400 font-medium"
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded"
          >
            <X size={14} />
          </button>
        </div>

        {/* Results / Navigation Suggestions */}
        <div className="max-h-72 overflow-y-auto p-2">
          {query.trim() === "" ? (
            <div className="p-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider space-y-2">
              <p className="flex items-center gap-1.5"><Terminal size={12} className="text-blue-500" /> Atalhos Rápidos:</p>
              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-500 font-semibold lowercase">
                <button onClick={() => { onSelectTab("central_dados"); setIsOpen(false); }} className="p-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 rounded border border-slate-150 dark:border-slate-850 text-left cursor-pointer flex items-center gap-1">
                  <FileText size={10} /> central de dados
                </button>
                <button onClick={() => { onSelectTab("consultor_workspace"); setIsOpen(false); }} className="p-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 rounded border border-slate-150 dark:border-slate-850 text-left cursor-pointer flex items-center gap-1">
                  <FolderOpen size={10} /> workspace do consultor
                </button>
                <button onClick={() => { onSelectTab("apresentacoes"); setIsOpen(false); }} className="p-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 rounded border border-slate-150 dark:border-slate-850 text-left cursor-pointer flex items-center gap-1">
                  <Calendar size={10} /> apresentações / atas
                </button>
                <button onClick={() => { onSelectTab("modo_reuniao"); setIsOpen(false); }} className="p-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 rounded border border-slate-150 dark:border-slate-850 text-left cursor-pointer flex items-center gap-1">
                  <HelpCircle size={10} /> modo reunião / board room
                </button>
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 flex items-center justify-between gap-3 cursor-pointer transition"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{item.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono">
                      {item.category}
                    </span>
                    <ArrowRight size={12} className="text-slate-300" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 font-medium text-xs">
              Nenhum resultado encontrado para &ldquo;<strong className="text-slate-600 dark:text-slate-200">{query}</strong>&rdquo;
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 text-[9px] font-mono text-slate-400 flex justify-between items-center">
          <span>Pressione <kbd className="bg-white dark:bg-slate-900 border border-slate-200 px-1 rounded shadow-xs font-bold font-sans">ESC</kbd> para fechar</span>
          <span>Sauron Command Center v2.5</span>
        </div>
      </div>
    </div>
  );
};
