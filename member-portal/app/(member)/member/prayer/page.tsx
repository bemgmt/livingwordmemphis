import { PrayerForm } from "./prayer-form";

export default function PrayerPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Prayer request
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose who may see your request. Default is the most private option.
        </p>
      </div>
      <PrayerForm />
    </div>
  );
}
