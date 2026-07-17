/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * EnterpriseTimeline — Linha do Tempo Cronológica de Eventos Reais da Consultoria
 *
 * Consome do TimelineRepository para garantir dados reais e auditabilidade.
 */

import React, { useEffect, useState } from "react";
import {
  Building,
  FileSpreadsheet,
  Settings2,
  BookOpen,
  Clock,
  TrendingUp,
  Database,
  Printer,
  FileText,
  Trash2,
  Archive,
  RotateCcw,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { timelineRepository, TimelineLogEvent } from "../core/persistence/TimelineRepository";

interface EnterpriseTimelineProps {
  enterprises?: any[];
  activeDataset?: any;
  activeFiles?: any[];
  presentation?: any;
}

const iconMap: Record<string, React.ElementType> = {
  IMPORT: FileSpreadsheet,
  DELETE: Trash2,
  ARCHIVE: Archive,
  RESTORE: RotateCcw,
  LINK: Building,
  UNLINK: Building,
  ACTIVATE: CheckCircle2,
  DEACTIVATE: XCircle,
  PRESENTATION: BookOpen,
  EXPORT: Printer
};

const colorMap = {
  emerald: {
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/20",
    icon: "text-emerald-450 dark:text-emerald-450",
    bg: "bg-emerald-500/10"
  },
  blue: {
    dot: "bg-blue-500",
    ring: "ring-blue-500/20",
    icon: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  amber: {
    dot: "bg-amber-500",
    ring: "ring-amber-500/20",
    icon: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  indigo: {
    dot: "bg-indigo-500",
    ring: "ring-indigo-500/20",
    icon: "text-indigo-500",
    bg: "bg-indigo-500/10"
  },
  purple: {
    dot: "bg-purple-500",
    ring: "ring-purple-500/20",
    icon: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  rose: {
    dot: "bg-rose-500",
    ring: "ring-rose-500/20",
    icon: "text-rose-500",
    bg: "bg-rose-500/10"
  }
};

const typeColorMap: Record<string, keyof typeof colorMap> = {
  IMPORT: "blue",
  DELETE: "rose",
  ARCHIVE: "amber",
  RESTORE: "emerald",
  LINK: "indigo",
  UNLINK: "amber",
  ACTIVATE: "emerald",
  DEACTIVATE: "rose",
  PRESENTATION: "purple",
  EXPORT: "rose"
};

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours}h`;
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export const EnterpriseTimeline: React.FC<EnterpriseTimelineProps> = () => {
  const [events, setEvents] = useState<TimelineLogEvent[]>([]);

  const loadEvents = React.useCallback(async () => {
    const list = await timelineRepository.getAll();
    setEvents(list);
  }, []);

  useEffect(() => {
    loadEvents();
    window.addEventListener("sauron:timeline-updated", loadEvents);
    return () => {
      window.removeEventListener("sauron:timeline-updated", loadEvents);
    };
  }, [loadEvents]);

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 space-y-4 shadow-sm text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900">
            <Clock size={14} className="text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
              Histórico de Eventos
            </h3>
            <p className="text-[10px] text-slate-450 font-semibold">
              Linha do tempo cronológica da consultoria
            </p>
          </div>
        </div>
        {events.length > 0 && (
          <button
            onClick={async () => {
              if (window.confirm("Limpar todo o histórico de eventos?")) {
                await timelineRepository.clear();
              }
            }}
            className="text-[9px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Empty state */}
      {events.length === 0 && (
        <div className="text-center py-8 space-y-2">
          <Clock size={28} className="text-slate-300 dark:text-slate-800 mx-auto" />
          <p className="text-xs font-bold text-slate-550 dark:text-slate-400">
            Nenhum evento registrado
          </p>
          <p className="text-[10px] text-slate-450">
            Realize ações no projeto para ver o histórico.
          </p>
        </div>
      )}

      {/* Events list */}
      {events.length > 0 && (
        <div className="space-y-0 relative pl-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-850">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-900" />

          {events.map((event) => {
            const Icon = iconMap[event.type] || Clock;
            const colorName = typeColorMap[event.type] || "blue";
            const colors = colorMap[colorName];

            return (
              <div key={event.id} className="flex gap-4 pb-4 last:pb-0 relative">
                {/* Dot with ring */}
                <div className={`w-8 h-8 rounded-full ${colors.bg} ring-4 ${colors.ring} flex items-center justify-center shrink-0 z-10`}>
                  <Icon size={14} className={colors.icon} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase text-slate-700 dark:text-white truncate">
                      {event.label}
                    </p>
                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 shrink-0 font-mono">
                      {formatRelativeDate(new Date(event.timestamp))}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-relaxed">
                    {event.sublabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
