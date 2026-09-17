"use server";

import { revalidatePath } from "next/cache";
import { archiveService, assertId, formSession } from "@/lib/youth-forms/server";
import { archiveSubmission } from "@/lib/youth-forms/archive";
import { validateArchiveText } from "@/lib/youth-forms/pdf";
import { FORM_VERSION, TERMS, normalizeAnswers, type Child, type Submission } from "@/lib/youth-forms/schema";

function refresh() {
  revalidatePath("/member/youth/forms");
  revalidatePath("/admin/youth-forms");
}
export async function addChild(id: string, name: string) {
  try {
    assertId(id);
    const { user } = await formSession();
    const displayName = name.trim();
    if (!displayName || displayName.length > 200) throw new Error("Enter your child's full name (up to 200 characters).");
    const service = archiveService();
    const { error } = await service.from("youth_children").insert({ id, guardian_id: user.id, display_name: displayName });
    if (error) {
      const { data } = await service.from("youth_children").select("id").eq("id", id).eq("guardian_id", user.id).maybeSingle();
      if (!data) throw new Error("Unable to add this child. Please try again.");
    }
    refresh();
    return { id };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to add child." }; }
}
export async function saveDraft(childId: string, revision: number, input: unknown) {
  try {
    assertId(childId);
    if (!Number.isSafeInteger(revision) || revision < 0) throw new Error("Reload this form and try again.");
    const { user } = await formSession();
    const answers = normalizeAnswers(input);
    const service = archiveService();
    const { data: raw, error: readError } = await service.from("youth_children").select("*").eq("id", childId).eq("guardian_id", user.id).single();
    if (readError || !raw) throw new Error("Child record unavailable.");
    const child = raw as Child;
    if (child.revision !== revision) throw new Error("This draft changed in another window. Reload it before continuing.");
    if (JSON.stringify(normalizeAnswers(child.draft)) === JSON.stringify(answers) && child.revision > 0) return { revision: child.revision };
    const { data, error } = await service.from("youth_children").update({ draft: answers, display_name: answers.childName || child.display_name, revision: revision + 1 }).eq("id", childId).eq("guardian_id", user.id).eq("revision", revision).select("revision").maybeSingle();
    if (error || !data) throw new Error("Unable to save. The draft may have changed in another window; reload before trying again.");
    refresh();
    return { revision: data.revision as number };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to save draft." }; }
}
export async function signForm(childId: string, revision: number, signature: string, consent: boolean, version: string) {
  try {
    assertId(childId);
    const { user } = await formSession();
    if (version !== FORM_VERSION) throw new Error("The form has changed. Reload and review the current terms before signing.");
    if (consent !== true) throw new Error("Please confirm the electronic signature acknowledgment.");
    const name = signature.trim();
    if (!name || name.length > 200 || /[\u0000-\u001f]/.test(name)) throw new Error("Enter your full name as your signature.");
    const service = archiveService();
    const { data: child } = await service.from("youth_children").select("*").eq("id", childId).eq("guardian_id", user.id).single();
    if (!child || child.revision !== revision) throw new Error("The draft changed. Reload and review it again before signing.");
    const answers = normalizeAnswers(child.draft, true);
    if (name.normalize("NFKC").toLocaleLowerCase() !== String(answers.guardianName).normalize("NFKC").toLocaleLowerCase()) throw new Error("Your signature must match the parent/guardian full name on the form.");
    await validateArchiveText(answers, name);
    const { data, error } = await service.rpc("freeze_youth_form", { p_child: childId, p_guardian: user.id, p_revision: revision, p_version: FORM_VERSION, p_terms: TERMS, p_signature: name, p_email: user.email! });
    if (error || !data) throw new Error("Unable to record your signature. Reload and review the form before trying again.");
    const submission = data as Submission;
    try { await archiveSubmission(submission); }
    catch { refresh(); return { id: submission.id, pending: true }; }
    refresh();
    return { id: submission.id, pending: false };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to submit form." }; }
}
export async function retryArchive(id: string) {
  try {
    assertId(id);
    const { supabase } = await formSession();
    // RLS allows only the signing guardian or archive administrators.
    const { data, error } = await supabase.from("youth_form_submissions").select("*").eq("id", id).single();
    if (error || !data) throw new Error("Submission unavailable.");
    await archiveSubmission(data as Submission);
    refresh();
    return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to archive. Please try again." }; }
}
