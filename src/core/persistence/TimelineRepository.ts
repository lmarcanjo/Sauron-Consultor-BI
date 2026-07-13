/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TimelineRepository.ts — Persistência local e log de eventos reais de consultoria.
 */

import { persistenceManager } from "./PersistenceManager";

export interface TimelineLogEvent {
  id: string;
  timestamp: string; // ISO string
  type: string; // e.g. "IMPORT" | "DELETE" | "ARCHIVE" | "RESTORE" | "LINK" | "UNLINK" | "ACTIVATE" | "DEACTIVATE" | "PRESENTATION" | "EXPORT"
  label: string;
  sublabel: string;
}

export class TimelineRepository {
  private static STORAGE_KEY = "sauron_timeline_events_v1";
  private static idCounter = 0;

  public async getAll(): Promise<TimelineLogEvent[]> {
    const list = await persistenceManager.get<TimelineLogEvent[]>(TimelineRepository.STORAGE_KEY);
    return list || [];
  }

  public async log(type: string, label: string, sublabel: string): Promise<void> {
    const list = await this.getAll();
    const event: TimelineLogEvent = {
      id: `evt_${Date.now()}_${TimelineRepository.idCounter++}`,
      timestamp: new Date().toISOString(),
      type,
      label,
      sublabel
    };
    list.unshift(event); // Adicionar no início para ordem decrescente (mais recente primeiro)
    await persistenceManager.set(TimelineRepository.STORAGE_KEY, list);
    window.dispatchEvent(new CustomEvent("sauron:timeline-updated"));
  }

  public async clear(): Promise<void> {
    await persistenceManager.remove(TimelineRepository.STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("sauron:timeline-updated"));
  }
}

export const timelineRepository = new TimelineRepository();
export default timelineRepository;
