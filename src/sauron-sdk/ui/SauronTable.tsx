/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { classComposer } from "../../design-system/factory/classComposer";
import { SauronEmptyState } from "./SauronEmptyState";

export interface TableColumn<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
}

export interface SauronTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  density?: "compact" | "comfortable";
  onRowClick?: (row: T) => void;
  activeRowId?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  actionsBuilder?: (row: T) => React.ReactNode;
}

function TableComponentInner<T>({
  columns,
  data,
  keyExtractor,
  density = "comfortable",
  onRowClick,
  activeRowId,
  emptyTitle = "Nenhum Registro Encontrado",
  emptyDescription = "Não há dados a serem exibidos nesta listagem no momento.",
  actionsBuilder,
}: SauronTableProps<T>) {
  if (!data || data.length === 0) {
    return (
      <SauronEmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  const paddingY = density === "compact" ? "py-1.5" : "py-3";

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200/60 dark:border-slate-800/80">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-150 dark:border-slate-800/80">
            {columns.map((col, index) => (
              <th
                key={index}
                className={classComposer(
                  "px-4 py-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 font-mono uppercase",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
            {actionsBuilder && (
              <th className="px-4 py-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 font-mono uppercase text-right">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-slate-900/40">
          {data.map((row) => {
            const key = keyExtractor(row);
            const isActive = activeRowId === key;

            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(row)}
                className={classComposer(
                  "transition-colors group",
                  onRowClick ? "cursor-pointer" : "",
                  isActive
                    ? "bg-blue-50/20 dark:bg-blue-950/10 border-l-2 border-l-blue-600"
                    : "hover:bg-slate-50/50 dark:hover:bg-slate-950/20"
                )}
              >
                {columns.map((col, index) => (
                  <td
                    key={index}
                    className={classComposer(
                      "px-4 text-xs text-slate-700 dark:text-slate-300 font-sans",
                      paddingY,
                      col.className
                    )}
                  >
                    {col.accessor(row)}
                  </td>
                ))}
                {actionsBuilder && (
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {actionsBuilder(row)}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Wrap with any HOC if required
export const SauronTable = createSauronComponent("SauronTable", TableComponentInner) as <T>(
  props: SauronTableProps<T>
) => React.ReactElement;
