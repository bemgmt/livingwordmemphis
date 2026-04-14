import { NextStudio } from "next-sanity/studio";

import config from "../../../../sanity.config";

export const dynamic = "force-dynamic";

export { metadata, viewport } from "next-sanity/studio";

export default function AdminStudioPage() {
  return (
    <div className="h-[calc(100dvh-4.75rem)] w-full min-h-[32rem]">
      <NextStudio config={config} />
    </div>
  );
}
