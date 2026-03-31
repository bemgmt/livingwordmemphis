import {
  BookIcon,
  CalendarIcon,
  CogIcon,
  DocumentTextIcon,
} from "@sanity/icons";
import type { StructureResolver } from "sanity/structure";

/** Types with custom list items above — hide from auto list at bottom. */
const STRUCTURED_TYPES = new Set([
  "siteSettings",
  "sermonSeries",
  "sermon",
  "churchEvent",
  "announcement",
  "knowledgeArticle",
]);

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Living Word Memphis")
    .items([
      S.listItem()
        .title("Site settings")
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType("siteSettings")
            .documentId("siteSettings")
            .title("Site settings"),
        ),

      S.divider(),

      S.listItem()
        .title("Teaching")
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title("Teaching")
            .items([
              S.documentTypeListItem("sermonSeries").title("Sermon series"),
              S.documentTypeListItem("sermon").title("Sermons"),
            ]),
        ),

      S.listItem()
        .title("Events & news")
        .icon(CalendarIcon)
        .child(
          S.list()
            .title("Events & news")
            .items([
              S.documentTypeListItem("churchEvent").title("Events"),
              S.documentTypeListItem("announcement").title("Announcements"),
            ]),
        ),

      S.listItem()
        .title("Knowledge base")
        .icon(BookIcon)
        .child(
          S.documentTypeList("knowledgeArticle").title("Articles"),
        ),

      S.divider(),

      ...S.documentTypeListItems().filter(
        (item) => !STRUCTURED_TYPES.has(item.getId() as string),
      ),
    ]);
