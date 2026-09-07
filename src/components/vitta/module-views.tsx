"use client";

import type { ComponentType } from "react";
import Dashboard from "./modules/dashboard";
import Accounting from "./modules/accounting";
import Knowledge from "./modules/knowledge";
import Sign from "./modules/sign";
import Crm from "./modules/crm";
import Studio from "./modules/studio";
import Subscriptions from "./modules/subscriptions";
import Ai from "./modules/ai";
import Pos from "./modules/pos";
import Discuss from "./modules/discuss";
import Documents from "./modules/documents";
import Project from "./modules/project";
import Timesheets from "./modules/timesheets";
import FieldService from "./modules/fieldservice";
import Planning from "./modules/planning";
import Helpdesk from "./modules/helpdesk";
import Ecommerce from "./modules/ecommerce";
import Website from "./modules/website";
import Email from "./modules/email";
import Purchase from "./modules/purchase";
import Inventory from "./modules/inventory";
import Manufacturing from "./modules/manufacturing";
import Sales from "./modules/sales";
import Hr from "./modules/hr";

export const MODULE_VIEWS: Record<string, ComponentType> = {
  dashboard: Dashboard,
  accounting: Accounting,
  knowledge: Knowledge,
  sign: Sign,
  crm: Crm,
  studio: Studio,
  subscriptions: Subscriptions,
  ai: Ai,
  pos: Pos,
  discuss: Discuss,
  documents: Documents,
  project: Project,
  timesheets: Timesheets,
  fieldservice: FieldService,
  planning: Planning,
  helpdesk: Helpdesk,
  ecommerce: Ecommerce,
  website: Website,
  email: Email,
  purchase: Purchase,
  inventory: Inventory,
  manufacturing: Manufacturing,
  sales: Sales,
  hr: Hr,
};
