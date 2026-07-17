/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CaseOverview } from "./CaseOverview";
import { WorkspaceProject } from "../modules/consultant-workspace/types";
import { WorkspaceSuggestions } from "../core/workspace-intelligence/WorkspaceSuggestions";

interface CaseOverviewPanelProps {
  widgetContext: any;
  dnaSuggestions: WorkspaceSuggestions;
  activeProject: WorkspaceProject | null;
}

export const CaseOverviewPanel: React.FC<CaseOverviewPanelProps> = ({
  widgetContext,
  dnaSuggestions,
  activeProject
}) => {
  return (
    <CaseOverview
      widgetContext={widgetContext}
      dnaSuggestions={dnaSuggestions}
      activeProject={activeProject}
    />
  );
};
