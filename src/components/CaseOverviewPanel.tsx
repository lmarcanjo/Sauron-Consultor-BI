/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CaseOverview } from "./CaseOverview";
import { WorkspaceProject } from "../modules/consultant-workspace/types";
import { DNASuggestions } from "../core/workspace-intelligence/WorkspaceDNAEngine";

interface CaseOverviewPanelProps {
  widgetContext: any;
  dnaSuggestions: DNASuggestions;
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
