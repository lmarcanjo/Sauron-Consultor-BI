import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, BrainCircuit, RefreshCw, Layers, Terminal, AlertTriangle, Lightbulb } from "lucide-react";
import { LancamentoFinanceiro, MetricasConsolidadas } from "../types";

interface ConsultorIaTabProps {
  metrics: MetricasConsolidadas;
  filtros: any;
  formatCurrency: (v: number) => string;
}

interface Message {
  id: string;
  sender: "user" | "saura_ai";
  text: string;
  timestamp: Date;
}

export const ConsultorIaTab: React.FC<ConsultorIaTabProps> = ({
  metrics,
  filtros,
  formatCurrency
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "saura_ai",
      text: "**Bem-vindo ao Sauron AI OS.**\n\nEu sou o seu consultor sênior de inteligência analítica em tempo real. Estou munido com as regras contábeis consolidadas do grupo e dados operacionais de marcas, faturamentos, comissões de pátio e taxas de conversão de Showroom.\n\nVocê pode me fazer qualquer pergunta sobre descompasso de custos, resultados de marcas ou plano de ações estratégicos. *Como posso impulsionar nossa governança corporativa hoje?*",
      timestamp: new Date()
    }
  ]);

  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sugestoes = [
    { title: "Queda de performance?", query: "Por que a performance caiu em maio de 2026?" },
    { title: "Melhor vendedor?", query: "Qual vendedor teve o melhor desempenho e faturamento?" },
    { title: "Gargalo por Razão?", query: "Quais razões contábeis mais impactaram nosso lucro?" },
    { title: "Lojas abaixo da meta?", query: "Quais filiais estão com faturamento abaixo das metas?" }
  ];

  const handleSend = async (queryToSend?: string) => {
    const text = queryToSend || inputText;
    if (!text.trim() || isThinking) return;

    if (!queryToSend) {
      setInputText("");
    }

    const newUserMsg: Message = {
      id: String(Date.now()),
      sender: "user",
      text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          metrics,
          selectedFilters: filtros
        })
      });

      const resData = await res.json();
      
      const aiReply: Message = {
        id: String(Date.now() + 1),
        sender: "saura_ai",
        text: resData.response || "Falha ao obter conselho. Por favor, verifique os canais de comunicação com o servidor.",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      const aiReply: Message = {
        id: String(Date.now() + 1),
        sender: "saura_ai",
        text: "**Erro de Conexão:** Não foi possível contactar o servidor do Sauron AI. Verifique se o backend está de pé.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, aiReply]);
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Very basic helper to render simplistic markdown styled blocks safely
  const renderMessageContent = (text: string) => {
    // split by double newlines for paragraphs
    return text.split("\n\n").map((para, pIdx) => {
      // detect bullets
      if (para.startsWith("-") || para.startsWith("*")) {
        const bullets = para.split("\n").map((line, bIdx) => {
          const cleanLine = line.replace(/^[-*]\s+/, "");
          return (
            <li key={bIdx} className="list-disc ml-5 mt-1 leading-relaxed">
              {renderBoldText(cleanLine)}
            </li>
          );
        });
        return <ul key={pIdx} className="my-2 space-y-1">{bullets}</ul>;
      }
      return (
        <p key={pIdx} className="leading-relaxed mb-2.5 last:mb-0">
          {renderBoldText(para)}
        </p>
      );
    });
  };

  const renderBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-extrabold text-slate-900 dark:text-white">{part}</strong> : part));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-[520px] shadow-sm font-sans text-slate-850 dark:text-slate-150 overflow-hidden" id="consultor-ia-tab-panel">
      {/* Header bar */}
      <div className="bg-slate-50 dark:bg-slate-850 p-4 border-b border-slate-100 dark:border-slate-805 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-blue-600 rounded text-white animate-spin-slow">
            <BrainCircuit size={15} />
          </span>
          <div>
            <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider flex items-center gap-1.5">
              <span>Sauron AI Consultor Copilot</span>
              <span className="text-[8px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-1 py-0.5 rounded font-mono font-bold">ONLINE</span>
            </h3>
            <p className="text-[10px] text-slate-455">Dúvidas, planos de ação rápidos e modelagem de cenários alimentados via dados de BI</p>
          </div>
        </div>
        <button
          onClick={() => {
            setMessages([
              {
                id: "welcome",
                sender: "saura_ai",
                text: "Memória reiniciada. Qual outra dúvida comercial ou contábil possui sobre nossos faturamentos?",
                timestamp: new Date()
              }
            ]);
          }}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-650 cursor-pointer text-[10px] uppercase font-bold flex items-center gap-1"
          title="Limpar memória"
        >
          <RefreshCw size={11} />
          <span>Limpar Chat</span>
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isAi = m.sender === "saura_ai";
          return (
            <div key={m.id} className={`flex ${isAi ? "justify-start" : "justify-end"} animate-fade-in`}>
              <div className={`max-w-[82%] rounded-2xl p-3.5 text-xs ${
                isAi 
                  ? "bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 text-slate-800 dark:text-slate-300" 
                  : "bg-blue-600 text-white font-medium"
              }`}>
                {/* Meta details if AI */}
                {isAi && (
                  <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    <Sparkles size={8} className="text-amber-500 animate-pulse animate-duration-1000" />
                    <span>Sauron OS Insight Engine</span>
                  </div>
                )}
                <div className="space-y-1">
                  {renderMessageContent(m.text)}
                </div>
                <div className={`text-[8px] text-right mt-1.5 ${isAi ? "text-slate-400" : "text-blue-200"}`}>
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-slate-55 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 max-w-[80%] rounded-2xl p-4 text-xs text-slate-550 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <p className="font-mono font-bold animate-pulse text-[10px]">Sauron está compilando métricas contábeis e formulando diagnóstico cooperativo...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion pills container */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-805 bg-slate-50/50 dark:bg-slate-900/40 flex flex-wrap gap-1.5 shrink-0">
        {sugestoes.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s.query)}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-extrabold rounded-lg border border-slate-150 dark:border-slate-800 shadow-sm transition cursor-pointer flex items-center gap-1"
          >
            <Lightbulb size={10} className="text-amber-500" />
            <span>{s.title}</span>
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-805 shrink-0 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Pergunte ao Sauron EX: Qual unidade teve melhor margem e como reverter custos?"
          className="flex-1 bg-slate-50 dark:bg-slate-850 p-2.5 px-3 rounded-xl border border-slate-150 dark:border-slate-800 focus:border-blue-500 focus:outline-none text-xs"
        />
        <button
          onClick={() => handleSend()}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl aspect-square flex items-center justify-center transition cursor-pointer"
        >
          <Send size={14} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
