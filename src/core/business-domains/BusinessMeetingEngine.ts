/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { businessDomainRegistry } from "./BusinessDomainRegistry";
import { BusinessMeetingTemplate } from "./BusinessDomainTypes";

export class BusinessMeetingEngine {
  public getMeetingTemplate(domainId: string): BusinessMeetingTemplate | null {
    const pack = businessDomainRegistry.get(domainId);
    if (!pack) return null;
    return pack.meeting;
  }
}

export const businessMeetingEngine = new BusinessMeetingEngine();
export default businessMeetingEngine;
