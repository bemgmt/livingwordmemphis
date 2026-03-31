import { GOOGLE_MAPS_EMBED } from "@/components/marketing/constants";

export function MapEmbed() {
  return (
    <div className="w-full overflow-hidden border-t border-border bg-muted/40">
      <iframe
        title="Living Word Memphis on Google Maps"
        src={GOOGLE_MAPS_EMBED}
        width="100%"
        height={420}
        className="min-h-[320px] w-full border-0 md:min-h-[400px]"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
