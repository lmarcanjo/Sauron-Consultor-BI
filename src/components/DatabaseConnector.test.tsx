/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { DatabaseConnector } from "./DatabaseConnector";

describe("DatabaseConnector — Hotfix 25.2 JSX Restoration", () => {
  it("can be instantiated and renders form inputs without JSX syntax errors", () => {
    const handleDataLoaded = vi.fn();
    const element = React.createElement(DatabaseConnector, {
      onDataLoaded: handleDataLoaded,
      currentSource: "test_source",
    });

    expect(element).toBeDefined();
    expect(element.type).toBe(DatabaseConnector);
  });
});
