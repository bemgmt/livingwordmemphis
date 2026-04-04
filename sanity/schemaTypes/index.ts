import { announcement } from "./documents/announcement";
import { approvedBible } from "./documents/approvedBible";
import { churchEvent } from "./documents/churchEvent";
import { knowledgeArticle } from "./documents/knowledgeArticle";
import { sermon } from "./documents/sermon";
import { sermonForumTopic } from "./documents/sermonForumTopic";
import { sermonSeries } from "./documents/sermonSeries";
import { siteSettings } from "./documents/siteSettings";
import { studyKnowledgeBase } from "./documents/studyKnowledgeBase";
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
  sermonForumTopic,
  approvedBible,
  studyKnowledgeBase,
];
