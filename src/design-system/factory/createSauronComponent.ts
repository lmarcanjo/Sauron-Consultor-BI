/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { classComposer } from "./classComposer";

export function createSauronComponent<Props>(
  displayName: string,
  Component: React.FC<Props>
): React.FC<Props> {
  const WrappedComponent: React.FC<Props> = (props) => {
    // We can add global telemetry checks, audit compliance checks, or focus trackers here
    return React.createElement(Component, props);
  };
  WrappedComponent.displayName = `Sauron(${displayName})`;
  return WrappedComponent;
}
