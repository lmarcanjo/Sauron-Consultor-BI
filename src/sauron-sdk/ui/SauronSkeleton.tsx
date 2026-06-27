/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { classComposer } from "../../design-system/factory/classComposer";

export interface SauronSkeletonProps {
  className?: string;
  variant?: "text" | "rect" | "circle";
  height?: string | number;
  width?: string | number;
}

const SkeletonComponent: React.FC<SauronSkeletonProps> = ({
  className,
  variant = "rect",
  height,
  width,
}) => {
  const styles = {
    width: width,
    height: height,
  };

  return (
    <div
      className={classComposer(
        "animate-pulse bg-slate-200 dark:bg-slate-800",
        variant === "circle" ? "rounded-full" : variant === "text" ? "rounded-sm h-3 w-5/6" : "rounded-lg",
        className
      )}
      style={styles}
    />
  );
};

export const SauronSkeleton = createSauronComponent("SauronSkeleton", SkeletonComponent);
