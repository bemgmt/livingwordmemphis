import { useCallback, useState } from "react";
import { type DocumentActionProps, useDocumentOperation } from "sanity";
import { LinkIcon } from "@sanity/icons";

const BASE_URL =
  typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "http://localhost:3000";

export function generateRegistrationUrlAction(
  props: DocumentActionProps,
) {
  const { id, type, published, draft } = props;
  const { patch, publish } = useDocumentOperation(id, type);
  const [dialogOpen, setDialogOpen] = useState(false);

  const doc = draft || published;
  const slug = (doc as Record<string, unknown>)?.slug as
    | { current?: string }
    | undefined;

  const handleAction = useCallback(() => {
    if (!slug?.current) {
      setDialogOpen(true);
      return;
    }

    const url = `${BASE_URL.replace(/\/+$/, "")}/events/${slug.current}`;

    patch.execute([{ set: { registrationUrl: url } }]);

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }

    setDialogOpen(true);
  }, [slug, patch]);

  if (type !== "churchEvent") return null;

  return {
    label: "Generate Registration Page",
    icon: LinkIcon,
    onHandle: handleAction,
    dialog: dialogOpen
      ? {
          type: "dialog" as const,
          header: slug?.current
            ? "Registration URL Generated"
            : "Slug Required",
          content: slug?.current
            ? `The registration URL has been set and copied to your clipboard:\n\n${BASE_URL.replace(/\/+$/, "")}/events/${slug.current}`
            : "Please set a slug for this event before generating the registration URL.",
          onClose: () => setDialogOpen(false),
        }
      : undefined,
  };
}
