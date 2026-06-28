/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StoryBlockType =
  | "kpi"
  | "chart"
  | "table"
  | "narrative"
  | "insight"
  | "recommendation"
  | "timeline"
  | "decision"
  | "action"
  | "image"
  | "divider"
  | "text";

export interface StoryBlock {
  id: string;
  type: StoryBlockType;
  title?: string;
  content: any; // Block-specific payload (e.g., config, rows, values, labels)
}

export interface StoryAction {
  id: string;
  description: string;
  responsible: string;
  deadline: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed";
}

export interface StoryChapter {
  id: string;
  title: string;
  objective: string;
  evidence: string;
  conclusion: string;
  indicators: { label: string; value: string; trend?: string; isPositive?: boolean }[];
  decisions: string[]; // List of decision descriptions
  actions: StoryAction[];
  blocks: StoryBlock[];
  notes?: string; // Consultant presenter notes
}

export interface StoryVersion {
  version: number;
  timestamp: string;
  author: string;
  hash: string;
  chapters: StoryChapter[];
  title: string;
  subtitle: string;
}

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  templateId: string;
  version: number;
  isApproved: boolean;
  approvedBy?: string;
  approvalDate?: string;
  approvalHash?: string;
  chapters: StoryChapter[];
  history: StoryVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface StoryDiffResult {
  titleChanged: boolean;
  subtitleChanged: boolean;
  versionFrom: number;
  versionTo: number;
  addedChapters: string[]; // chapter titles
  removedChapters: string[]; // chapter titles
  modifiedChapters: {
    chapterId: string;
    title: string;
    objectiveChanged: boolean;
    evidenceChanged: boolean;
    conclusionChanged: boolean;
    addedDecisions: string[];
    removedDecisions: string[];
    addedActions: string[];
    removedActions: string[];
    addedBlocks: string[]; // block types
    removedBlocks: string[]; // block types
  }[];
}

export interface ReplayEvent {
  timestamp: string;
  chapterIndex: number;
  eventType: "chapter_view" | "decision_added" | "action_added" | "comment_added";
  payload: any;
}

export interface ReplaySession {
  storyId: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  chapterTimes: { [chapterIndex: number]: number }; // duration per chapter in seconds
  events: ReplayEvent[];
}
