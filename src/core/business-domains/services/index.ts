import { BusinessDomainPack } from "../BusinessDomainTypes";
import { manifest } from "./manifest";
import { vocabulary } from "./vocabulary";
import { hierarchy } from "./hierarchy";
import { kpis } from "./kpis";
import { meeting } from "./meeting";
import { presentation } from "./presentation";
import { rules } from "./rules";
import { mapping } from "./mapping";
import { terminology } from "./terminology";

export const servicesPack: BusinessDomainPack = {
  manifest,
  vocabulary,
  hierarchy,
  kpis,
  meeting,
  presentation,
  rules,
  mapping,
  terminology
};

export default servicesPack;
