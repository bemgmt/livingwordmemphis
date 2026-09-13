import { SECTIONS, visible, type Answers } from "@/lib/youth-forms/schema";

export function AnswerReview({ answers, sections = SECTIONS }: { answers: Answers; sections?: typeof SECTIONS }) {
  return <div className="space-y-6">{sections.map(section => <section key={section.title}>
    <h3 className="mb-3 font-semibold">{section.title}</h3>
    <dl className="space-y-3">{section.fields.filter(f => visible(f, answers)).map(field => {
      const value = answers[field.key];
      return <div key={field.key} className="break-words rounded-lg bg-secondary/60 p-3">
        <dt className="text-sm text-muted-foreground">{field.label}</dt>
        <dd className="mt-1 whitespace-pre-wrap text-sm">{Array.isArray(value) ? value.join(", ") || "Not provided" : value || "Not provided"}</dd>
      </div>;
    })}</dl>
  </section>)}</div>;
}
