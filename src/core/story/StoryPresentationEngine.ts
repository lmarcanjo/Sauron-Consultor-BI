/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReplaySession, ReplayEvent, Story } from "./types";
import { platformLogger } from "../platform/PlatformLogger";

export class StoryPresentationEngine {
  private activeSession: ReplaySession | null = null;

  /**
   * Starts a brand new presentation session.
   */
  public startSession(storyId: string): ReplaySession {
    const session: ReplaySession = {
      storyId,
      startTime: new Date().toISOString(),
      durationSeconds: 0,
      chapterTimes: { 0: 0 },
      events: [],
    };

    this.activeSession = session;
    this.logEvent(session, 0, "chapter_view", { chapterIndex: 0 });

    return session;
  }

  /**
   * Logs a specific event to the replay session.
   */
  public logEvent(session: ReplaySession, chapterIndex: number, eventType: ReplayEvent["eventType"], payload: any): void {
    const event: ReplayEvent = {
      timestamp: new Date().toISOString(),
      chapterIndex,
      eventType,
      payload,
    };
    session.events.push(event);
  }

  /**
   * Increments elapsed time for the current chapter index.
   */
  public tick(session: ReplaySession, activeChapterIndex: number, deltaSeconds: number = 1): void {
    session.durationSeconds += deltaSeconds;
    if (session.chapterTimes[activeChapterIndex] === undefined) {
      session.chapterTimes[activeChapterIndex] = 0;
    }
    session.chapterTimes[activeChapterIndex] += deltaSeconds;
  }

  /**
   * Changes chapter index during presenter session.
   */
  public changeChapter(session: ReplaySession, fromIndex: number, toIndex: number): void {
    this.logEvent(session, toIndex, "chapter_view", { fromIndex, toIndex });
  }

  /**
   * Registers a decision dynamically during presentation.
   */
  public recordDecision(session: ReplaySession, chapterIndex: number, description: string): void {
    this.logEvent(session, chapterIndex, "decision_added", { description });
  }

  /**
   * Registers an action dynamically during presentation.
   */
  public recordAction(session: ReplaySession, chapterIndex: number, description: string, responsible: string, deadline: string): void {
    this.logEvent(session, chapterIndex, "action_added", { description, responsible, deadline });
  }

  /**
   * Registers a client/consultant comment dynamically.
   */
  public recordComment(session: ReplaySession, chapterIndex: number, comment: string, author: string = "Consultor"): void {
    this.logEvent(session, chapterIndex, "comment_added", { comment, author });
  }

  /**
   * Ends and seals the presentation session.
   */
  public endSession(session: ReplaySession): ReplaySession {
    session.endTime = new Date().toISOString();
    
    // Ensure all chapter times are at least initialized
    Object.keys(session.chapterTimes).forEach((k) => {
      const idx = Number(k);
      if (isNaN(session.chapterTimes[idx])) {
        session.chapterTimes[idx] = 0;
      }
    });

    if (this.activeSession?.storyId === session.storyId) {
      this.activeSession = null;
    }

    platformLogger.info(`[Sauron Audit] PRESENTATION_ENDED - Replay session for Story ID: ${session.storyId} finished. Total Duration: ${session.durationSeconds}s.`);
    return session;
  }

  public getActiveSession(): ReplaySession | null {
    return this.activeSession;
  }
}

export const storyPresentationEngine = new StoryPresentationEngine();
