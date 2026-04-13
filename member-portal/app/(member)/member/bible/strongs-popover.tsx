"use client";

import { useCallback, useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { getStrongsDefinition } from "./actions";

type StrongsData = {
  id: string;
  language: string;
  lemma: string | null;
  transliteration: string | null;
  definition: string;
  kjv_usage: string | null;
};

export function StrongsPopover({
  code,
  children,
}: {
  code: string;
  children: React.ReactNode;
}) {
  const [data, setData] = useState<StrongsData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = useCallback(
    async (open: boolean) => {
      if (!open || data) return;
      setLoading(true);
      const result = await getStrongsDefinition(code);
      setData(result);
      setLoading(false);
    },
    [code, data],
  );

  return (
    <Popover onOpenChange={handleOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 text-sm">
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : data ? (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs font-semibold text-primary">
                {data.id}
              </span>
              <span className="text-xs capitalize text-muted-foreground">
                {data.language}
              </span>
            </div>
            {data.lemma && (
              <p className="text-lg leading-tight">{data.lemma}</p>
            )}
            {data.transliteration && (
              <p className="text-xs italic text-muted-foreground">
                {data.transliteration}
              </p>
            )}
            <p className="text-foreground">{data.definition}</p>
            {data.kjv_usage && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">KJV:</span> {data.kjv_usage}
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No definition found for {code}.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
