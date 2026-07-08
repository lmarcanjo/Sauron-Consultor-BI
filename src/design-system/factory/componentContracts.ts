/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BaseSauronProps {
  id?: string;
  className?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
}

export interface InteractiveSauronProps extends BaseSauronProps {
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
}
