export const FORM_VERSION = "nursery-2026-09-12-v1";
export const FORM_TITLE = "Nursery Child Information & Care Questionnaire";
export const RULES = [
  "No personal devices in the nursery for children or caregivers unless needed for an emergency or authorized nursery use.",
  "Diapers will not be changed by nursery staff. If your child needs a diaper change, you will be notified and asked to attend to your child.",
  "Please return all nursery pagers at pickup. Parent/Guardian is responsible for loss, damage, or replacement costs caused by misuse or failure to return the pager.",
  "Please do not bring sick children to nursery, including children with fever, vomiting, diarrhea, contagious illness, or symptoms of illnesses such as hand, foot and mouth disease. When in doubt, please keep your child with you.",
];
export const WAIVER = [
  "I, the undersigned parent/guardian, voluntarily choose to place my child in the Living Word Memphis nursery. I understand that nursery care involves ordinary activities and that minor accidents, injuries, illness, or other incidents may occur despite reasonable precautions. I acknowledge that Living Word Memphis and Gabriela Aristevazquez will use reasonable care and make the child's safety a priority, but I accept the ordinary risks associated with nursery participation.",
  "To the fullest extent permitted by applicable law, I release and agree not to hold liable, sue, or seek damages from Gabriela Aristevazquez or Living Word Memphis, including their staff and volunteers, for claims arising from my child's participation in the nursery, except to the extent caused by conduct that cannot legally be waived or released. I understand this waiver does not eliminate any rights that cannot legally be waived.",
  "I understand that I am responsible for following the nursery rules above and for promptly responding when contacted about my child. I confirm that the information I provided is accurate and that I have disclosed known allergies, medical needs, and relevant care instructions.",
];
export const ACKNOWLEDGMENT = "By signing below, I confirm that I have read, understood, and agree to the Nursery Rules & Liability Waiver above.";
export const ELECTRONIC_CONSENT = "I confirm that I am this child's parent or legal guardian. I consent to sign electronically and intend my typed full name to be my signature on this completed questionnaire and waiver. I can download and retain a copy of the signed document.";
export type Field = { key: string; label: string; type?: "text" | "textarea" | "date" | "tel" | "yesno" | "multi"; options?: string[]; required?: boolean; when?: string; hint?: string };
export const SECTIONS: { title: string; fields: Field[] }[] = [
  { title: "Child & guardian", fields: [
    { key: "childName", label: "Child's full name", required: true },
    { key: "birthday", label: "Child's birthday", type: "date", required: true },
    { key: "guardianName", label: "Parent/guardian full name", required: true },
    { key: "phone", label: "Parent/guardian phone", type: "tel", required: true },
  ] },
  { title: "Health & allergies", fields: [
    { key: "hasAllergies", label: "Does your child have any known allergies?", type: "yesno", required: true },
    { key: "allergies", label: "Allergies (check all that apply)", type: "multi", when: "hasAllergies", options: ["Peanuts", "Tree Nuts", "Dairy/Milk", "Eggs", "Soy", "Gluten/Wheat", "Shellfish", "Fish", "Sesame", "Other"] },
    { key: "allergyDetails", label: "Allergy details / reaction / emergency instructions", type: "textarea", when: "hasAllergies", required: true },
    { key: "hasNeeds", label: "Does your child have any medical, developmental, or sensory needs we should know about?", type: "yesno", required: true },
    { key: "needsDetails", label: "Medical, developmental, or sensory needs", type: "textarea", when: "hasNeeds", required: true },
  ] },
  { title: "Feeding", fields: [
    { key: "feeding", label: "Feeding method", type: "multi", options: ["Formula", "Breastfed/Breastmilk", "Both", "Solid foods", "Other"] },
    { key: "feedingInstructions", label: "Special feeding instructions / other feeding method", type: "textarea", hint: "Please label any formula or breastmilk clearly with your child's name." },
    { key: "foodsToAvoid", label: "Foods/snacks to avoid", type: "textarea" },
  ] },
  { title: "Temperament & development", fields: [
    { key: "preferences", label: "My child generally prefers", type: "multi", options: ["Being held", "Independent/free play", "Both", "Quiet activities", "Active play"] },
    { key: "movement", label: "Movement", type: "multi", options: ["Not yet mobile", "Rolls", "Crawls", "Walks with help", "Walks independently"] },
    { key: "comforts", label: "Comforts my child", type: "multi", options: ["Pacifier", "Bottle", "Lovey/blanket", "Rocking", "Other"] },
    { key: "temperament", label: "Temperament, behavior, fears, routines, communication, or other comforts", type: "textarea" },
  ] },
  { title: "Nursery notes", fields: [
    { key: "contactPermission", label: "I authorize nursery staff to contact me immediately if a concern arises.", type: "yesno", required: true },
    { key: "remainOnPremises", label: "I will remain on church premises while my child is in the nursery.", type: "yesno", required: true },
    { key: "notes", label: "Additional notes", type: "textarea" },
    { key: "bestContact", label: "Best contact number", type: "tel", required: true },
  ] },
];
export const TERMS = { title: FORM_TITLE, sections: SECTIONS, rules: RULES, waiver: WAIVER, acknowledgment: ACKNOWLEDGMENT, electronicConsent: ELECTRONIC_CONSENT };
export type Terms = typeof TERMS;
export type Answers = Record<string, string | string[]>;
export function visible(field: Field, answers: Answers) { return !field.when || answers[field.when] === "Yes"; }
export function normalizeAnswers(input: unknown, complete = false): Answers {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Please complete the questionnaire.");
  const raw = input as Answers;
  const answers: Answers = {};
  for (const field of SECTIONS.flatMap(s => s.fields)) {
    if (!visible(field, raw)) continue;
    const value = raw[field.key];
    if (field.type === "multi") {
      if (value !== undefined && (!Array.isArray(value) || value.some(v => !field.options?.includes(v)))) throw new Error(`Check ${field.label}.`);
      answers[field.key] = [...new Set((value as string[] | undefined) ?? [])];
    } else {
      if (value !== undefined && typeof value !== "string") throw new Error(`Check ${field.label}.`);
      const text = (value as string | undefined)?.trim() ?? "";
      if (text.length > (field.type === "textarea" ? 2000 : 200) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) throw new Error(`${field.label} is too long or contains unsupported characters.`);
      if (field.type === "yesno" && text && !["Yes", "No"].includes(text)) throw new Error(`Check ${field.label}.`);
      if (complete && field.required && !text) throw new Error(`Please complete: ${field.label}.`);
      if (field.type === "date" && text) {
        const date = new Date(`${text}T00:00:00Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== text || date > new Date() || Number(text.slice(0, 4)) < 1900) throw new Error("Enter a valid birthday that is not in the future.");
      }
      if (complete && field.type === "tel" && text.replace(/\D/g, "").length < 7) throw new Error(`Enter a valid ${field.label.toLowerCase()}.`);
      answers[field.key] = text;
    }
  }
  if (complete && (answers.contactPermission !== "Yes" || answers.remainOnPremises !== "Yes")) throw new Error("Nursery participation requires both nursery acknowledgments. Please contact the church if you cannot agree.");
  return answers;
}
export type Child = { id: string; guardian_id: string; display_name: string; draft: Answers; revision: number; created_at: string };
export type Submission = { id: string; child_id: string; guardian_id: string; revision: number; form_version: string; answers: Answers; terms: Terms; signature_name: string; signer_email: string; signed_at: string; status: "pending" | "completed"; storage_path: string | null; pdf_sha256: string | null; archived_at: string | null };
export function childStatus(child: Child, submissions: Submission[]) {
  const latest = submissions.find(s => s.child_id === child.id && s.revision === child.revision);
  return latest ? (latest.status === "completed" ? "Completed" : "Archive pending") : Object.keys(child.draft).length ? "Draft" : "Missing";
}
