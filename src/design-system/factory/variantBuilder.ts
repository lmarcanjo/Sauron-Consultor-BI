/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { classComposer } from "./classComposer";

export function variantBuilder<
  Variants extends Record<string, string>,
  Sizes extends Record<string, string>
>(config: {
  base: string;
  variants: Variants;
  sizes: Sizes;
  defaultVariants: {
    variant: keyof Variants;
    size: keyof Sizes;
  };
}) {
  return (options?: {
    variant?: keyof Variants;
    size?: keyof Sizes;
    className?: string;
  }) => {
    const v = options?.variant ?? config.defaultVariants.variant;
    const s = options?.size ?? config.defaultVariants.size;
    
    return classComposer(
      config.base,
      config.variants[v as string],
      config.sizes[s as string],
      options?.className
    );
  };
}
