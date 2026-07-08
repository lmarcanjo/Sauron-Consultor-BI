/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Presentation,
  Plus,
  Copy,
  Trash2,
  Check,
  RotateCcw,
  BookOpen,
  Timer,
  Play,
  MonitorPlay,
  FileText,
  FileCode,
  Download,
  GitCompare,
  User,
  Hammer,
  ClipboardList,
  ChevronRight,
  Eye,
  Settings,
  HelpCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
  History,
  CheckCircle,
  AlertCircle
} from "lucide-react";

import { Story, StoryChapter, StoryBlock, StoryAction, StoryVersion, StoryDiffResult, ReplaySession } from "../core/story/types";
import { storyEngine } from "../core/story/StoryEngine";
import { storyTemplateEngine } from "../core/story/StoryTemplateEngine";
import { storyVersionEngine } from "../core/story/StoryVersionEngine";
import { storyApprovalEngine } from "../core/story/StoryApprovalEngine";
import { storyDiffEngine } from "../core/story/StoryDiffEngine";
import { storyPresentationEngine } from "../core/story/StoryPresentationEngine";
import { storyExportEngine } from "../core/story/StoryExportEngine";

import { SauronButton } from "../sauron-sdk/ui/SauronButton";
import { SauronBadge } from "../sauron-sdk/ui/SauronBadge";
import { SauronCard } from "../sauron-sdk/ui/SauronCard";
import { SauronTable } from "../sauron-sdk/ui/SauronTable";
import { SauronTimeline } from "../sauron-sdk/ui/SauronTimeline";
import { SauronKpiCard } from "../sauron-sdk/ui/SauronKpiCard";
import { SauronDecisionCard } from "../sauron-sdk/domain/SauronDecisionCard";
import { SauronActionCard } from "../sauron-sdk/domain/SauronActionCard";

export const ExecutiveStoryTab: React.FC = () => {
  // Navigation & Screen Control
  const [activeTab, setActiveTab] = useState<"library" | "editor" | "diff" | "replay">("library");
  const [stories, setStories] = useState<Story[]>(() => storyEngine.getStories());
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);

  // Active Selected Story Reference
  const activeStory = stories.find((s) => s.id === activeStoryId) || null;

  // Active Selected Chapter in Editor
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);

  // Template State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("conselho");
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStorySubtitle, setNewStorySubtitle] = useState("");

  // Approval Inputs
  const [approvalAuthor, setApprovalAuthor] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Diff Version Selection
  const [diffVer1, setDiffVer1] = useState<number>(1);
  const [diffVer2, setDiffVer2] = useState<number>(1);
  const [diffResult, setDiffResult] = useState<StoryDiffResult | null>(null);

  // Presenter Mode Overlay
  const [isPresenting, setIsPresenting] = useState(false);
  const [presentationMode, setPresentationMode] = useState<"consultant" | "client">("consultant");
  const [currentPresChapter, setCurrentPresChapter] = useState(0);
  const [presentationSeconds, setPresentationSeconds] = useState(0);
  const [presentationSession, setPresentationSession] = useState<ReplaySession | null>(null);
  const [replayToReview, setReplayToReview] = useState<ReplaySession | null>(null);

  // Active Presentation Interactive Inputs
  const [presDecisionInput, setPresDecisionInput] = useState("");
  const [presActionDesc, setPresActionDesc] = useState("");
  const [presActionResp, setPresActionResp] = useState("");
  const [presActionDead, setPresActionDead] = useState("");
  const [presCommentInput, setPresCommentInput] = useState("");

  // Quick Editor Edit States
  const [isEditingChapterMeta, setIsEditingChapterMeta] = useState(false);
  const [editObj, setEditObj] = useState("");
  const [editEvid, setEditEvid] = useState("");
  const [editConc, setEditConc] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Presentation Timer Ticking Effect
  useEffect(() => {
    let interval: any = null;
    if (isPresenting && presentationSession) {
      interval = setInterval(() => {
        setPresentationSeconds((prev) => prev + 1);
        storyPresentationEngine.tick(presentationSession, currentPresChapter, 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPresenting, presentationSession, currentPresChapter]);

  // Sync internal list whenever Engine operates
  const refreshList = () => {
    setStories(storyEngine.getStories());
  };

  // Create Story Handler
  const handleCreateStory = () => {
    if (!newStoryTitle.trim()) return;
    try {
      const story = storyTemplateEngine.createStoryFromTemplate(
        selectedTemplateId,
        newStoryTitle,
        newStorySubtitle || "Análise de Governança"
      );
      storyEngine.registerStory(story);
      refreshList();
      setActiveStoryId(story.id);
      setSelectedChapterIndex(0);
      setActiveTab("editor");
      setShowCreateModal(false);
      setNewStoryTitle("");
      setNewStorySubtitle("");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Duplicate Story Handler
  const handleDuplicateStory = (storyId: string) => {
    try {
      const original = stories.find((s) => s.id === storyId);
      if (!original) return;
      const dup = storyEngine.duplicateStory(storyId, `${original.title} (Cópia)`);
      refreshList();
      setActiveStoryId(dup.id);
      setActiveTab("editor");
      setSelectedChapterIndex(0);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Delete Story Handler
  const handleDeleteStory = (storyId: string) => {
    if (confirm("Deseja realmente excluir esta narrativa executiva permanentemente?")) {
      storyEngine.deleteStory(storyId);
      refreshList();
      if (activeStoryId === storyId) {
        setActiveStoryId(null);
        setActiveTab("library");
      }
    }
  };

  // Approve Handler
  const handleApproveStory = () => {
    if (!activeStory || !approvalAuthor.trim()) return;
    try {
      storyApprovalEngine.approve(activeStory, approvalAuthor);
      refreshList();
      setShowApprovalModal(false);
      setApprovalAuthor("");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Reopen Draft Handler
  const handleReopenAsDraft = () => {
    if (!activeStory) return;
    if (confirm("Esta ação criará uma nova versão rascunho com base na versão atual selada. Confirmar?")) {
      storyApprovalEngine.reopenAsDraft(activeStory);
      refreshList();
    }
  };

  // Restore Version Handler
  const handleRestoreVersion = (verNum: number) => {
    if (!activeStory) return;
    if (confirm(`Deseja restaurar a versão ${verNum} como o rascunho ativo atual?`)) {
      storyVersionEngine.restoreVersion(activeStory, verNum, "Sauron OS Restorer");
      refreshList();
      setSelectedChapterIndex(0);
    }
  };

  // Run Version Diff Handler
  const handleRunDiff = () => {
    if (!activeStory) return;
    try {
      const res = storyDiffEngine.diffVersions(activeStory, diffVer1, diffVer2);
      setDiffResult(res);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Trigger Offline Standalone HTML Export Download
  const handleDownloadHtml = (story: Story) => {
    const htmlString = storyExportEngine.exportToHtml(story);
    const blob = new Blob([htmlString], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Sauron_Executive_Story_${story.title.replace(/\s+/g, "_")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Setup Chapter Edit Form
  const startEditingChapter = (chapter: StoryChapter) => {
    setEditObj(chapter.objective);
    setEditEvid(chapter.evidence);
    setEditConc(chapter.conclusion);
    setEditNotes(chapter.notes || "");
    setIsEditingChapterMeta(true);
  };

  // Save Chapter Meta Changes
  const saveChapterMeta = () => {
    if (!activeStory) return;
    const ch = activeStory.chapters[selectedChapterIndex];
    if (ch) {
      ch.objective = editObj;
      ch.evidence = editEvid;
      ch.conclusion = editConc;
      ch.notes = editNotes;
      activeStory.updatedAt = new Date().toISOString();
      refreshList();
    }
    setIsEditingChapterMeta(false);
  };

  // Start Live Presentation Session
  const startPresentation = () => {
    if (!activeStory) return;
    const session = storyPresentationEngine.startSession(activeStory.id);
    setPresentationSession(session);
    setCurrentPresChapter(0);
    setPresentationSeconds(0);
    setIsPresenting(true);
  };

  // Switch Presentation Chapters
  const changePresChapter = (toIndex: number) => {
    if (!presentationSession || !activeStory) return;
    if (toIndex < 0 || toIndex >= activeStory.chapters.length) return;
    storyPresentationEngine.changeChapter(presentationSession, currentPresChapter, toIndex);
    setCurrentPresChapter(toIndex);
  };

  // Record Decision Live
  const addPresDecision = () => {
    if (!presentationSession || !activeStory || !presDecisionInput.trim()) return;
    const ch = activeStory.chapters[currentPresChapter];
    
    // Add to actual story structure
    ch.decisions.push(presDecisionInput);
    // Add to presentation session replay event log
    storyPresentationEngine.recordDecision(presentationSession, currentPresChapter, presDecisionInput);
    
    setPresDecisionInput("");
    refreshList();
  };

  // Record Action Live
  const addPresAction = () => {
    if (!presentationSession || !activeStory || !presActionDesc.trim() || !presActionResp.trim()) return;
    const ch = activeStory.chapters[currentPresChapter];
    
    const actionObj: StoryAction = {
      id: `act_pres_${Date.now()}`,
      description: presActionDesc,
      responsible: presActionResp,
      deadline: presActionDead || "Imediato",
      priority: "medium",
      status: "pending",
    };
    
    ch.actions.push(actionObj);
    storyPresentationEngine.recordAction(
      presentationSession,
      currentPresChapter,
      presActionDesc,
      presActionResp,
      presActionDead || "Imediato"
    );

    setPresActionDesc("");
    setPresActionResp("");
    setPresActionDead("");
    refreshList();
  };

  // Record Comment Live
  const addPresComment = () => {
    if (!presentationSession || !presCommentInput.trim()) return;
    storyPresentationEngine.recordComment(presentationSession, currentPresChapter, presCommentInput, "Presidente");
    setPresCommentInput("");
  };

  // End Presentation Session and open Replay chronogram
  const endPresentation = () => {
    if (!presentationSession) return;
    const ended = storyPresentationEngine.endSession(presentationSession);
    setReplayToReview(ended);
    setIsPresenting(false);
    setPresentationSession(null);
    setActiveTab("replay");
  };

  // Quick helper to format timer seconds
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans p-6 overflow-y-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800/80 pb-5 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <Presentation size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
              Sauron Executive Story™
              <SauronBadge type="primary">v1.2 Engine</SauronBadge>
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider mt-0.5">
              Substituição completa de slides legados por Narrativas Executivas Determinísticas Auditáveis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <SauronButton
            variant={activeTab === "library" ? "filled" : "outline"}
            onClick={() => setActiveTab("library")}
            size="sm"
          >
            <BookOpen size={13} /> Biblioteca
          </SauronButton>

          {activeStory && (
            <>
              <SauronButton
                variant={activeTab === "editor" ? "filled" : "outline"}
                onClick={() => {
                  setActiveTab("editor");
                  setIsEditingChapterMeta(false);
                }}
                size="sm"
              >
                <FileText size={13} /> Editor Ativo
              </SauronButton>

              {activeStory.history.length >= 2 && (
                <SauronButton
                  variant={activeTab === "diff" ? "filled" : "outline"}
                  onClick={() => {
                    setActiveTab("diff");
                    setDiffVer1(activeStory.history[0]?.version || 1);
                    setDiffVer2(activeStory.history[activeStory.history.length - 1]?.version || 1);
                    setDiffResult(null);
                  }}
                  size="sm"
                >
                  <GitCompare size={13} /> Relatório Diff
                </SauronButton>
              )}

              <SauronButton
                variant="success"
                onClick={startPresentation}
                size="sm"
              >
                <Play size={13} className="stroke-[2.5]" /> Iniciar Sessão
              </SauronButton>
            </>
          )}
        </div>
      </div>

      {/* VIEWPORT AREA */}
      {activeTab === "library" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Quick Template Picker Side Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs">
              <h2 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2 mb-4">
                Novo Deck Corporativo
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider mb-5">
                Selecione o modelo estratégico e crie sua estrutura de capítulos instantaneamente.
              </p>

              <div className="space-y-3 mb-6">
                <label className="block text-[10px] font-black uppercase text-slate-500">Template Oficial</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {storyTemplateEngine.getTemplates().map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 mb-6">
                <label className="block text-[10px] font-black uppercase text-slate-500">Título do Deck</label>
                <input
                  type="text"
                  placeholder="Ex: Conselho Fiscal Q2 Nissan"
                  value={newStoryTitle}
                  onChange={(e) => setNewStoryTitle(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3 mb-6">
                <label className="block text-[10px] font-black uppercase text-slate-500">Subtítulo / Escopo</label>
                <input
                  type="text"
                  placeholder="Ex: Fechamento Fiscal & Operações"
                  value={newStorySubtitle}
                  onChange={(e) => setNewStorySubtitle(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <SauronButton className="w-full justify-center" onClick={handleCreateStory}>
                <Plus size={14} /> Construir Story Deck
              </SauronButton>
            </div>

            {/* Stories List */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex justify-between items-center bg-slate-100/50 dark:bg-slate-950/40 p-4 border border-slate-200/60 dark:border-slate-800/60 rounded-xl">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Narrativas Ativas ({stories.length})
                </span>
                <span className="text-[10px] text-blue-500 font-mono uppercase tracking-wider">
                  Mapeado no Core Repositorio
                </span>
              </div>

              {stories.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
                  <Presentation size={36} className="text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Nenhuma narrativa criada</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Crie um deck usando o formulário à esquerda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {stories.map((st) => (
                    <div
                      key={st.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 ${
                        activeStoryId === st.id
                          ? "border-blue-500 ring-2 ring-blue-500/10"
                          : "border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <SauronBadge type={st.isApproved ? "success" : "neutral"}>
                            {st.isApproved ? "Aprovada & Selada" : "Rascunho Ativo"}
                          </SauronBadge>
                          <span className="text-[9px] font-mono text-slate-400">Versão {st.version}</span>
                          <span className="text-[9px] font-mono text-slate-400">• {st.chapters.length} Capítulos</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                          {st.title}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {st.subtitle}
                        </p>
                        {st.approvalHash && (
                          <div className="text-[9px] font-mono bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded border border-emerald-500/10 mt-2 inline-flex items-center gap-1.5">
                            <CheckCircle size={10} /> Assinatura: <strong className="font-bold">{st.approvalHash}</strong>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0 md:ml-4 shrink-0">
                        <SauronButton
                          variant={activeStoryId === st.id ? "filled" : "outline"}
                          size="sm"
                          onClick={() => {
                            setActiveStoryId(st.id);
                            setSelectedChapterIndex(0);
                            setActiveTab("editor");
                          }}
                        >
                          <Eye size={12} /> Visualizar
                        </SauronButton>

                        <SauronButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateStory(st.id)}
                          title="Duplicar Narrativa"
                        >
                          <Copy size={12} />
                        </SauronButton>

                        <SauronButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadHtml(st)}
                          title="Exportar HTML Standalone"
                        >
                          <Download size={12} />
                        </SauronButton>

                        <SauronButton
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteStory(st.id)}
                          title="Excluir"
                        >
                          <Trash2 size={12} />
                        </SauronButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "editor" && activeStory && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Chapters Sidebar Outline */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-100/50 dark:bg-slate-950/40 p-3 border border-slate-200/60 dark:border-slate-800/60 rounded-xl flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Roteiro de Capítulos
              </span>
              <span className="text-[9px] font-mono text-slate-400">({activeStory.chapters.length})</span>
            </div>

            <div className="space-y-2 max-h-[450px] overflow-y-auto">
              {activeStory.chapters.map((ch, idx) => (
                <div
                  key={ch.id}
                  onClick={() => {
                    setSelectedChapterIndex(idx);
                    setIsEditingChapterMeta(false);
                  }}
                  className={`p-4 border rounded-xl transition-all select-none cursor-pointer ${
                    selectedChapterIndex === idx
                      ? "bg-blue-500/5 border-blue-500 shadow-sm ring-1 ring-blue-500/20"
                      : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-950/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs font-mono border ${
                        selectedChapterIndex === idx
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-black uppercase tracking-wider font-sans truncate ${selectedChapterIndex === idx ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}>
                        {ch.title}
                      </h4>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate font-mono mt-0.5">
                        {ch.indicators.length} KPIS • {ch.decisions.length} Decisões
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Version Management Box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 space-y-4">
              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Histórico de Versões</h3>
              
              {activeStory.history.length === 0 ? (
                <p className="text-[10px] font-mono text-slate-400">Nenhum selo de versão registrado ainda.</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {activeStory.history.map((ver) => (
                    <div key={ver.version} className="p-2 bg-slate-50 dark:bg-slate-950/40 rounded border border-slate-200 dark:border-slate-850 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Versão {ver.version}</span>
                        <SauronButton variant="outline" size="sm" onClick={() => handleRestoreVersion(ver.version)} className="px-1 py-0.5 text-[8px]">
                          Restaurar
                        </SauronButton>
                      </div>
                      <span className="text-[8px] font-mono text-slate-400 truncate">Por: {ver.author}</span>
                      <span className="text-[8px] font-mono text-slate-400 truncate">Selo: {ver.hash.substring(0, 15)}...</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chapter Editor Dashboard Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Active Story Meta Strip */}
            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center md:justify-between shadow-xs">
              <div>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-0.5">Editor de Deck Corporativo</span>
                <h2 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{activeStory.title}</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{activeStory.subtitle}</p>
              </div>

              <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-2">
                {activeStory.isApproved ? (
                  <>
                    <SauronBadge type="success">✓ Aprovado e Selado</SauronBadge>
                    <SauronButton variant="outline" size="sm" onClick={handleReopenAsDraft}>
                      Reabrir como Rascunho
                    </SauronButton>
                  </>
                ) : (
                  <>
                    <SauronBadge type="neutral">Rascunho Ativo</SauronBadge>
                    <SauronButton variant="success" size="sm" onClick={() => setShowApprovalModal(true)}>
                      Aprovar & Selar Versão
                    </SauronButton>
                  </>
                )}
              </div>
            </div>

            {/* Selected Chapter Canvas */}
            {activeStory.chapters[selectedChapterIndex] && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6 relative">
                
                {/* Chapter Title & Setup Form Trigger */}
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-widest block">Capítulo {selectedChapterIndex + 1} de {activeStory.chapters.length}</span>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight mt-0.5">
                      {activeStory.chapters[selectedChapterIndex].title}
                    </h3>
                  </div>
                  {!activeStory.isApproved && !isEditingChapterMeta && (
                    <SauronButton variant="outline" size="sm" onClick={() => startEditingChapter(activeStory.chapters[selectedChapterIndex])}>
                      <Settings size={12} /> Editar Metas & Notas
                    </SauronButton>
                  )}
                </div>

                {/* Interactive Config Forms */}
                {isEditingChapterMeta ? (
                  <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Ajustar Estrutura de Narrativa</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500">Objetivo</label>
                      <textarea
                        value={editObj}
                        onChange={(e) => setEditObj(e.target.value)}
                        className="w-full text-xs p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-200 focus:outline-none"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500">Evidências / Fatos</label>
                      <textarea
                        value={editEvid}
                        onChange={(e) => setEditEvid(e.target.value)}
                        className="w-full text-xs p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-200 focus:outline-none"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500">Conclusão de Governança</label>
                      <textarea
                        value={editConc}
                        onChange={(e) => setEditConc(e.target.value)}
                        className="w-full text-xs p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-200 focus:outline-none"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500">Notas do Apresentador (Consultor)</label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full text-xs p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-200 focus:outline-none"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <SauronButton variant="outline" size="sm" onClick={() => setIsEditingChapterMeta(false)}>
                        Cancelar
                      </SauronButton>
                      <SauronButton variant="success" size="sm" onClick={saveChapterMeta}>
                        Salvar Alterações
                      </SauronButton>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* E3-K Executive Narrative Deterministic Content Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Left: Goals & Evidences */}
                      <div className="md:col-span-2 space-y-4">
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-3">
                          <span className="text-[9px] font-mono font-bold uppercase bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/10 px-1.5 py-0.5 rounded">
                            Objetivo Tático
                          </span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                            {activeStory.chapters[selectedChapterIndex].objective}
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-3">
                          <span className="text-[9px] font-mono font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10 px-1.5 py-0.5 rounded">
                            Evidências de Rastreabilidade
                          </span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                            {activeStory.chapters[selectedChapterIndex].evidence}
                          </p>
                        </div>

                        <div className="p-4 bg-blue-500/5 dark:bg-blue-950/10 border border-blue-500/20 rounded-xl space-y-3">
                          <span className="text-[9px] font-mono font-bold uppercase bg-blue-600 text-white px-1.5 py-0.5 rounded">
                            Conclusão de Governança
                          </span>
                          <p className="text-xs text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
                            {activeStory.chapters[selectedChapterIndex].conclusion}
                          </p>
                        </div>
                      </div>

                      {/* Right: Key Performance indicators list */}
                      <div className="space-y-4">
                        <div className="bg-slate-100/50 dark:bg-slate-950/40 p-3 border border-slate-200/60 dark:border-slate-800/60 rounded-xl flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                            Indicadores do Capítulo
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">({activeStory.chapters[selectedChapterIndex].indicators.length})</span>
                        </div>

                        {activeStory.chapters[selectedChapterIndex].indicators.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 font-mono text-[10px]">Sem KPIs neste capítulo.</div>
                        ) : (
                          <div className="space-y-3">
                            {activeStory.chapters[selectedChapterIndex].indicators.map((ind, idx) => (
                              <div key={idx} className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl flex justify-between items-center">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-mono uppercase block">{ind.label}</span>
                                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">{ind.value}</span>
                                </div>
                                {ind.trend && (
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${ind.isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                                    {ind.trend}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Story Blocks Rendering (E3-B) */}
                    {activeStory.chapters[selectedChapterIndex].blocks.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Lâminas / Blocos Visuais</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activeStory.chapters[selectedChapterIndex].blocks.map((bl) => {
                            if (bl.type === "kpi") {
                              return (
                                <SauronKpiCard
                                  key={bl.id}
                                  title={bl.title || "Indicador Especializado"}
                                  value={bl.content.value}
                                  subtitle="Extraído deterministicamente do DRE"
                                />
                              );
                            }
                            if (bl.type === "narrative") {
                              return (
                                <div key={bl.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:col-span-2">
                                  <h5 className="text-[10px] font-bold uppercase text-slate-400 mb-2">{bl.title || "Insight Narrativo"}</h5>
                                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">"{bl.content.text}"</p>
                                </div>
                              );
                            }
                            if (bl.type === "table") {
                              const columns = (bl.content.headers || []).map((h: string, hIdx: number) => ({
                                header: h,
                                accessor: (row: any[]) => row[hIdx],
                              }));
                              return (
                                <div key={bl.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden md:col-span-2 bg-white dark:bg-slate-900">
                                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                    <h5 className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">{bl.title || "Tabela de Governança"}</h5>
                                  </div>
                                  <SauronTable
                                    columns={columns}
                                    data={bl.content.rows || []}
                                    keyExtractor={(row: any[]) => row.join("-")}
                                  />
                                </div>
                              );
                            }
                            return (
                              <div key={bl.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center font-mono text-[10px] text-slate-400">
                                Bloco: {bl.type.toUpperCase()} - {bl.title || "Sem título"}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Decisions & Actions Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                      
                      {/* Chapter Decisions List */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Decisões Firmadas</h4>
                          <span className="text-[9px] font-mono text-slate-400">({activeStory.chapters[selectedChapterIndex].decisions.length})</span>
                        </div>

                        {activeStory.chapters[selectedChapterIndex].decisions.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 font-mono text-[10px] bg-slate-50/50 dark:bg-slate-950/20 rounded-xl">Sem decisões registradas neste capítulo.</div>
                        ) : (
                          <div className="space-y-3">
                            {activeStory.chapters[selectedChapterIndex].decisions.map((dec, idx) => (
                              <SauronDecisionCard
                                key={idx}
                                description={dec}
                                timestamp={new Date().toLocaleDateString("pt-BR")}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Chapter Action Items List */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Planos de Ação (Ações)</h4>
                          <span className="text-[9px] font-mono text-slate-400">({activeStory.chapters[selectedChapterIndex].actions.length})</span>
                        </div>

                        {activeStory.chapters[selectedChapterIndex].actions.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 font-mono text-[10px] bg-slate-50/50 dark:bg-slate-950/20 rounded-xl">Sem ações planejadas neste capítulo.</div>
                        ) : (
                          <div className="space-y-3">
                            {activeStory.chapters[selectedChapterIndex].actions.map((act) => (
                              <SauronActionCard
                                key={act.id}
                                description={act.description}
                                responsible={act.responsible}
                                deadline={act.deadline}
                                priority={act.priority}
                                status={act.status}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "diff" && activeStory && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <h2 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
              <GitCompare size={18} className="text-blue-500" /> Relatório Comparativo de Versões (Diff)
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono uppercase mt-0.5">
              Compare as alterações estruturais e de governança entre duas versões seladas desta narrativa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-200 dark:border-slate-850 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-500">Versão Inicial:</span>
              <select
                value={diffVer1}
                onChange={(e) => setDiffVer1(Number(e.target.value))}
                className="text-xs font-semibold p-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              >
                {activeStory.history.map((h) => (
                  <option key={h.version} value={h.version}>
                    Versão {h.version} ({h.author})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-500">Versão Final:</span>
              <select
                value={diffVer2}
                onChange={(e) => setDiffVer2(Number(e.target.value))}
                className="text-xs font-semibold p-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              >
                {activeStory.history.map((h) => (
                  <option key={h.version} value={h.version}>
                    Versão {h.version} ({h.author})
                  </option>
                ))}
              </select>
            </div>

            <SauronButton size="sm" onClick={handleRunDiff}>
              Comparar Versões
            </SauronButton>
          </div>

          {diffResult && (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                  <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Estrutura de Alto Nível</h4>
                  <ul className="space-y-1.5 text-xs">
                    <li className="flex items-center gap-2">
                      <span className="font-bold">Título Alterado:</span>
                      <SauronBadge type={diffResult.titleChanged ? "warning" : "success"}>
                        {diffResult.titleChanged ? "Sim" : "Não"}
                      </SauronBadge>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-bold">Subtítulo Alterado:</span>
                      <SauronBadge type={diffResult.subtitleChanged ? "warning" : "success"}>
                        {diffResult.subtitleChanged ? "Sim" : "Não"}
                      </SauronBadge>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                  <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Fluxo de Capítulos</h4>
                  <ul className="space-y-1.5 text-xs">
                    <li className="text-emerald-600 dark:text-emerald-400">
                      <strong>Capítulos Adicionados:</strong> {diffResult.addedChapters.join(", ") || "Nenhum"}
                    </li>
                    <li className="text-rose-600 dark:text-rose-400">
                      <strong>Capítulos Removidos:</strong> {diffResult.removedChapters.join(", ") || "Nenhum"}
                    </li>
                  </ul>
                </div>
              </div>

              {/* Chapters Delta report */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Capítulos com Alterações de Governança</h3>
                
                {diffResult.modifiedChapters.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 font-mono text-xs">Nenhuma alteração de texto ou dados nos capítulos preservados.</div>
                ) : (
                  <div className="space-y-4">
                    {diffResult.modifiedChapters.map((mCh, idx) => (
                      <div key={idx} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 space-y-3">
                        <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                          Capítulo: {mCh.title}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                          <div className="flex items-center gap-1.5">
                            <span>Objetivo Alterado:</span>
                            <SauronBadge type={mCh.objectiveChanged ? "warning" : "neutral"}>
                              {mCh.objectiveChanged ? "Sim" : "Não"}
                            </SauronBadge>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span>Evidência Alterada:</span>
                            <SauronBadge type={mCh.evidenceChanged ? "warning" : "neutral"}>
                              {mCh.evidenceChanged ? "Sim" : "Não"}
                            </SauronBadge>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span>Conclusão Alterada:</span>
                            <SauronBadge type={mCh.conclusionChanged ? "warning" : "neutral"}>
                              {mCh.conclusionChanged ? "Sim" : "Não"}
                            </SauronBadge>
                          </div>
                        </div>

                        {/* Decisions / Actions additions/removals detail */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-500 block">Delta de Decisões:</span>
                            {mCh.addedDecisions.map((d, i) => (
                              <div key={i} className="text-emerald-600 dark:text-emerald-400">+ Decisão Adicionada: "{d}"</div>
                            ))}
                            {mCh.removedDecisions.map((d, i) => (
                              <div key={i} className="text-rose-600 dark:text-rose-400">- Decisão Removida: "{d}"</div>
                            ))}
                            {mCh.addedDecisions.length === 0 && mCh.removedDecisions.length === 0 && (
                              <div className="text-slate-400 font-mono text-[10px]">Sem alteração em decisões.</div>
                            )}
                          </div>

                          <div className="space-y-1">
                            <span className="font-bold text-slate-500 block">Delta de Ações:</span>
                            {mCh.addedActions.map((a, i) => (
                              <div key={i} className="text-emerald-600 dark:text-emerald-400">+ Ação Adicionada: "{a}"</div>
                            ))}
                            {mCh.removedActions.map((a, i) => (
                              <div key={i} className="text-rose-600 dark:text-rose-400">- Ação Removida: "{a}"</div>
                            ))}
                            {mCh.addedActions.length === 0 && mCh.removedActions.length === 0 && (
                              <div className="text-slate-400 font-mono text-[10px]">Sem alteração em ações.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "replay" && replayToReview && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                <Clock size={18} className="text-blue-500" /> Cronograma de Reunião (Story Replay)
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-mono uppercase mt-0.5">
                Auditoria do tempo de fala por capítulo e as decisões/ações registradas em tempo real.
              </p>
            </div>
            <SauronButton variant="outline" size="sm" onClick={() => { setReplayToReview(null); setActiveTab("library"); }}>
              Fechar Replay
            </SauronButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Times per Chapter */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Tempo por Capítulo</h3>
              <div className="space-y-2">
                {Object.keys(replayToReview.chapterTimes).map((k) => {
                  const idx = Number(k);
                  const duration = replayToReview.chapterTimes[idx] || 0;
                  const total = replayToReview.durationSeconds || 1;
                  const percent = Math.min(100, Math.round((duration / total) * 100));

                  return (
                    <div key={k} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-850">
                      <div className="flex justify-between text-xs font-bold uppercase mb-1">
                        <span>Capítulo {idx + 1}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 mt-1 block">{percent}% do tempo de pauta</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event logs timeline */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider font-sans">Timeline de Ocorrências</h3>
              
              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {replayToReview.events.map((evt, idx) => (
                  <div key={idx} className="flex gap-4 items-start relative pl-8">
                    <div className="absolute left-1.5 top-2 w-3.5 h-3.5 rounded-full border border-blue-500 bg-white dark:bg-slate-900 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex-1">
                      <div className="flex justify-between items-center mb-1 text-[9px] font-mono text-slate-400">
                        <span>Minuto {new Date(evt.timestamp).toLocaleTimeString("pt-BR")}</span>
                        <span>Capítulo {evt.chapterIndex + 1}</span>
                      </div>

                      {evt.eventType === "chapter_view" && (
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Abriu visualização do capítulo.
                        </p>
                      )}

                      {evt.eventType === "decision_added" && (
                        <p className="text-xs text-slate-800 dark:text-slate-100">
                          <strong className="text-blue-500 uppercase font-mono tracking-wider text-[9px] block">Decisão Registrada</strong>
                          {evt.payload.description}
                        </p>
                      )}

                      {evt.eventType === "action_added" && (
                        <p className="text-xs text-slate-800 dark:text-slate-100">
                          <strong className="text-emerald-500 uppercase font-mono tracking-wider text-[9px] block">Ação Delegada</strong>
                          Ação: {evt.payload.description} • Responsável: <strong className="font-bold">{evt.payload.responsible}</strong>
                        </p>
                      )}

                      {evt.eventType === "comment_added" && (
                        <p className="text-xs text-slate-800 dark:text-slate-100 leading-relaxed italic">
                          <strong className="text-slate-500 uppercase font-mono tracking-wider text-[9px] block">Comentário / Pergunta</strong>
                          "{evt.payload.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* APPROVAL SETTINGS MODAL */}
      {showApprovalModal && activeStory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-tight">Selo de Governança</h3>
              <button onClick={() => setShowApprovalModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-400">
                Ao selar e aprovar, a versão rascunho atual será congelada no histórico do sistema. Um hash de autenticidade contábil será gerado.
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 block">Autor / Diretor Responsável</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Santos (Diretor Nissan)"
                  value={approvalAuthor}
                  onChange={(e) => setApprovalAuthor(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <SauronButton variant="outline" size="sm" onClick={() => setShowApprovalModal(false)}>
                Cancelar
              </SauronButton>
              <SauronButton variant="success" size="sm" onClick={handleApproveStory} disabled={!approvalAuthor.trim()}>
                Gerar Versão Selada
              </SauronButton>
            </div>
          </div>
        </div>
      )}

      {/* PRESENTER FULLSCREEN OVERLAY (E3-G) */}
      {isPresenting && activeStory && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
          
          {/* TOP PRESENTATION BAR */}
          <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                Sessão Ativa
              </span>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">{activeStory.title}</h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Running stop watch */}
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                <Timer size={14} className="text-blue-500 animate-pulse" />
                <span>{formatTime(presentationSeconds)}</span>
              </div>

              {/* Mode toggle */}
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setPresentationMode("consultant")}
                  className={`px-3 py-1 text-[9px] font-bold uppercase rounded ${
                    presentationMode === "consultant" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Modo Consultor
                </button>
                <button
                  onClick={() => setPresentationMode("client")}
                  className={`px-3 py-1 text-[9px] font-bold uppercase rounded ${
                    presentationMode === "client" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Modo Cliente
                </button>
              </div>

              <SauronButton variant="danger" size="sm" onClick={endPresentation}>
                Finalizar Reunião
              </SauronButton>
            </div>
          </header>

          {/* MAIN SCREEN split-screen in Consultant / full-width in Client */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Visual Slide Stage */}
            <div className={`flex-1 flex flex-col p-8 overflow-y-auto ${presentationMode === "client" ? "max-w-4xl mx-auto justify-center" : "bg-slate-900/40"}`}>
              
              {activeStory.chapters[currentPresChapter] && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-widest block">Capítulo {currentPresChapter + 1} de {activeStory.chapters.length}</span>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight mt-1">{activeStory.chapters[currentPresChapter].title}</h1>
                  </div>

                  {/* Objective Evidence grid */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1.5">Objetivo Tático</span>
                      <p className="text-sm font-bold text-slate-200 leading-relaxed">
                        {activeStory.chapters[currentPresChapter].objective}
                      </p>
                    </div>

                    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1.5">Evidências e Fatos</span>
                      <p className="text-xs text-slate-300 font-mono leading-relaxed">
                        {activeStory.chapters[currentPresChapter].evidence}
                      </p>
                    </div>

                    <div className="p-5 bg-blue-950/20 border border-blue-500/20 rounded-2xl">
                      <span className="text-[9px] font-mono text-blue-400 font-bold uppercase block mb-1.5">Conclusão de Diretoria</span>
                      <p className="text-sm font-black text-white leading-relaxed">
                        {activeStory.chapters[currentPresChapter].conclusion}
                      </p>
                    </div>
                  </div>

                  {/* Display indicators during presentation */}
                  {activeStory.chapters[currentPresChapter].indicators.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      {activeStory.chapters[currentPresChapter].indicators.map((ind, idx) => (
                        <div key={idx} className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                          <span className="text-[9px] text-slate-500 font-mono uppercase block">{ind.label}</span>
                          <span className="text-base font-black text-white mt-1 block">{ind.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Presenter decisions displayed in slide */}
                  {activeStory.chapters[currentPresChapter].decisions.length > 0 && (
                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Decisões Registradas na Sessão</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeStory.chapters[currentPresChapter].decisions.map((dec, i) => (
                          <div key={i} className="p-3 bg-blue-950/10 border border-blue-500/20 rounded-xl text-xs font-semibold text-slate-200">
                            {dec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Slide Navigator controls in stage footer */}
                  <div className="flex gap-2 justify-between items-center pt-8">
                    <SauronButton
                      variant="outline"
                      size="sm"
                      onClick={() => changePresChapter(currentPresChapter - 1)}
                      disabled={currentPresChapter === 0}
                      className="border-slate-800 text-slate-300 hover:bg-slate-800"
                    >
                      <ArrowLeft size={13} /> Anterior
                    </SauronButton>

                    <span className="text-xs font-mono text-slate-500">Página {currentPresChapter + 1} / {activeStory.chapters.length}</span>

                    <SauronButton
                      variant="outline"
                      size="sm"
                      onClick={() => changePresChapter(currentPresChapter + 1)}
                      disabled={currentPresChapter === activeStory.chapters.length - 1}
                      className="border-slate-800 text-slate-300 hover:bg-slate-800"
                    >
                      Próximo <ArrowRight size={13} />
                    </SauronButton>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Consultant Control Panel Dashboard */}
            {presentationMode === "consultant" && (
              <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto p-5 space-y-6">
                
                {/* Presenter Notes */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Notas de Apoio</span>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-300">
                    {activeStory.chapters[currentPresChapter]?.notes || "Sem notas particulares registradas para este capítulo de pauta."}
                  </div>
                </div>

                {/* Next Chapters list */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Sequência de Capítulos</span>
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                    {activeStory.chapters.map((ch, idx) => (
                      <div
                        key={ch.id}
                        onClick={() => changePresChapter(idx)}
                        className={`p-2 rounded border cursor-pointer text-xs flex justify-between items-center ${
                          currentPresChapter === idx
                            ? "bg-blue-600/10 border-blue-500 text-blue-400 font-bold"
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span className="truncate">{idx + 1}. {ch.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form to log dynamic Decision */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Registrar Decisão de Diretoria</span>
                  <input
                    type="text"
                    placeholder="Descrição da decisão firmada..."
                    value={presDecisionInput}
                    onChange={(e) => setPresDecisionInput(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-900 border border-slate-800 rounded text-white focus:outline-none"
                  />
                  <SauronButton size="sm" className="w-full" onClick={addPresDecision} disabled={!presDecisionInput.trim()}>
                    <Hammer size={12} /> Logar Decisão
                  </SauronButton>
                </div>

                {/* Form to log dynamic Action Item */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Delegar Ação</span>
                  <input
                    type="text"
                    placeholder="Tarefa..."
                    value={presActionDesc}
                    onChange={(e) => setPresActionDesc(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-900 border border-slate-800 rounded text-white focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Responsável"
                      value={presActionResp}
                      onChange={(e) => setPresActionResp(e.target.value)}
                      className="text-xs p-2 bg-slate-900 border border-slate-800 rounded text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Prazo"
                      value={presActionDead}
                      onChange={(e) => setPresActionDead(e.target.value)}
                      className="text-xs p-2 bg-slate-900 border border-slate-800 rounded text-white focus:outline-none"
                    />
                  </div>
                  <SauronButton size="sm" className="w-full" onClick={addPresAction} disabled={!presActionDesc.trim() || !presActionResp.trim()}>
                    <ClipboardList size={12} /> Delegar Ação
                  </SauronButton>
                </div>

                {/* Form to log Comments / Questions */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Anotar Comentário de Cliente</span>
                  <input
                    type="text"
                    placeholder="Insira observação, pergunta do CEO..."
                    value={presCommentInput}
                    onChange={(e) => setPresCommentInput(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-900 border border-slate-800 rounded text-white focus:outline-none"
                  />
                  <SauronButton size="sm" className="w-full" onClick={addPresComment} disabled={!presCommentInput.trim()}>
                    Gravar Comentário
                  </SauronButton>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
