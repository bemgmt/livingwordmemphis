import { definePlugin } from "sanity";
import { BookIcon } from "@sanity/icons";
import { MinistryPortal } from "../../member-portal/components/ministry/portal";
function MinistryTool() {
  return <MinistryPortal initialView="editor" studio />;
}
export const ministryTool = definePlugin({
  name: "ministry-curriculum",
  tools: [
    {
      name: "ministry",
      title: "Ministry curriculum",
      icon: BookIcon,
      component: MinistryTool,
    },
  ],
});
