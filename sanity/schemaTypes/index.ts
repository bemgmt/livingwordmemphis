import { announcement } from "./documents/announcement";
import { churchEvent } from "./documents/churchEvent";
import { knowledgeArticle } from "./documents/knowledgeArticle";
import { sermon } from "./documents/sermon";
import { sermonSeries } from "./documents/sermonSeries";
import { siteSettings } from "./documents/siteSettings";
import { blockContent } from "./objects/blockContent";
import { seo } from "./objects/seo";

export const schemaTypes = [
  blockContent,
  seo,
  siteSettings,
  sermonSeries,
  sermon,
  churchEvent,
  announcement,
  knowledgeArticle,
];
