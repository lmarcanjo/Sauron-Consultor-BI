/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Terminal, Copy, Check, Download, FileText, Settings, PlayCircle, BookOpen } from "lucide-react";

export const StreamlitExporter: React.FC = () => {
  const [activeTab, setActiveTab ] = useState<"app" | "req" | "instructions">("app");
  const [appCode, setAppCode] = useState<string>("");
  const [reqCode, setReqCode] = useState<string>("");
  const [instructionsCode, setInstructionsCode ] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [appRes, reqRes, instRes] = await Promise.all([
          fetch("/api/streamlit/app").then(r => r.json()),
          fetch("/api/streamlit/requirements").then(r => r.json()),
          fetch("/api/streamlit/instructions").then(r => r.json())
        ]);

        if (appRes.content) setAppCode(appRes.content);
        if (reqRes.content) setReqCode(reqRes.content);
        if (instRes.content) setInstructionsCode(instRes.content);
      } catch (err) {
        console.error("Erro ao puxar dados Streamlit:", err);
        setError("Não foi possível carregar os códigos dinamicamente. Mas os arquivos continuam disponíveis no repositório para download.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleCopy = () => {
    let text = "";
    if (activeTab === "app") text = appCode;
    else if (activeTab === "req") text = reqCode;
    else text = instructionsCode;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let text = "";
    let filename = "";
    let mime = "text/plain";

    if (activeTab === "app") {
      text = appCode;
      filename = "app.py";
      mime = "text/x-python";
    } else if (activeTab === "req") {
      text = reqCode;
      filename = "requirements.txt";
    } else {
      text = instructionsCode;
      filename = "README_STREAMLIT.md";
      mime = "text/markdown";
    }

    const blob = new Blob([text], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const truncateText = (txt: string, maxLines = 15) => {
    const lines = txt.split("\n");
    if (lines.length <= maxLines) return txt;
    return lines.slice(0, maxLines).join("\n") + "\n\n# ... [Código abreviado para visualização rápida. Clique em Copiar ou Baixar para obter o arquivo completo!]";
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 font-sans hover:shadow-md transition-all duration-150">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-850">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white flex items-center gap-1.5">
            <Terminal size={14} className="text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />
            <span>Código de Exportação Python &amp; Streamlit</span>
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Guarde e execute os arquivos solicitados de forma totalmente independente no seu ambiente local</p>
        </div>
        <div className="flex gap-1.5 self-stretch sm:self-auto">
          <button
            onClick={handleCopy}
            disabled={loading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-[10px] uppercase tracking-wide font-bold rounded transition-colors cursor-pointer"
          >
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            <span>{copied ? "Copiado!" : "Copiar"}</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={loading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white disabled:opacity-50 text-[10px] uppercase tracking-wide font-bold rounded transition-all cursor-pointer"
          >
            <Download size={12} />
            <span>Baixar</span>
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-100 dark:border-slate-850 mt-3 overflow-x-auto gap-0.5">
        <button
          onClick={() => setActiveTab("app")}
          className={`px-3 py-2 text-[10px] uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "app" ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-450" : "border-transparent text-slate-500 dark:text-slate-405 hover:text-indigo-500"
          }`}
        >
          <FileText size={12} />
          <span>app.py (Streamlit completo)</span>
        </button>

        <button
          onClick={() => setActiveTab("req")}
          className={`px-3 py-2 text-[10px] uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "req" ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-450" : "border-transparent text-slate-500 dark:text-slate-405 hover:text-indigo-500"
          }`}
        >
          <Settings size={12} />
          <span>requirements.txt</span>
        </button>

        <button
          onClick={() => setActiveTab("instructions")}
          className={`px-3 py-2 text-[10px] uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "instructions" ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-450" : "border-transparent text-slate-400 hover:text-indigo-500"
          }`}
        >
          <BookOpen size={12} />
          <span>Manual de Execução</span>
        </button>
      </div>

      <div className="mt-4 bg-slate-900 border border-slate-950 p-4 rounded-xl relative">
        {loading ? (
          <div className="h-40 flex items-center justify-center text-slate-400 text-xs">
            Drenando códigos corporativos da base...
          </div>
        ) : error ? (
          <div className="h-40 flex flex-col items-center justify-center text-rose-450 text-xs text-center p-4">
            <p className="font-bold">{error}</p>
          </div>
        ) : (
          <pre className="text-xs font-mono text-indigo-200 overflow-x-auto max-h-80 leading-relaxed custom-scrollbar select-text whitespace-pre">
            {activeTab === "app" 
              ? truncateText(appCode, 25) 
              : activeTab === "req" 
                ? reqCode 
                : instructionsCode}
          </pre>
        )}
        <div className="absolute top-2.5 right-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-950 px-2.5 py-1 rounded-md">
          {activeTab === "app" ? "python" : activeTab === "req" ? "plaintext" : "markdown"}
        </div>
      </div>
    </div>
  );
};
