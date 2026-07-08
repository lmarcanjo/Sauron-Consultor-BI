/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlatformEventType =
  | "WorkspaceChanged"
  | "CaseChanged"
  | "MeetingStarted"
  | "PresentationApproved"
  | "ActionCompleted"
  | "DataImported"
  | "DatabaseSynced";

export interface PlatformEventPayload {
  WorkspaceChanged: { workspaceId: string; timestamp: string };
  CaseChanged: { caseId: string; clientName: string };
  MeetingStarted: { meetingId: string; presenter: string };
  PresentationApproved: { presentationId: string; approvedBy: string };
  ActionCompleted: { actionId: string; description: string };
  DataImported: { fileNames: string[]; rowCount: number };
  DatabaseSynced: { sourceName: string; count: number };
}

type EventCallback<T extends PlatformEventType> = (payload: PlatformEventPayload[T]) => void;

class EventBus {
  private listeners: Map<PlatformEventType, Set<EventCallback<any>>> = new Map();

  /**
   * Subscribe to a platform-wide event.
   */
  public subscribe<T extends PlatformEventType>(event: T, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return an unsubscribe function
    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Publish an event to all subscribers.
   */
  public publish<T extends PlatformEventType>(event: T, payload: PlatformEventPayload[T]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error executing event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Clear all subscribers. Mainly used in test teardowns.
   */
  public clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
export default eventBus;
