import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { visible, type Answers, type Submission } from "./schema";

let fontBytes: Promise<Buffer> | undefined;
function loadFont() {
  return fontBytes ??= readFile(path.join(process.cwd(), "assets/fonts/NotoSans-Regular.ttf")).catch(error => { fontBytes = undefined; throw error; });
}
export async function validateArchiveText(answers: Answers, signature: string) {
  const supported = new Set(fontkit.create(await loadFont()).characterSet);
  for (const text of [signature, ...Object.values(answers).flat()]) for (const char of text) {
    if (!/[\r\n\t]/.test(char) && !supported.has(char.codePointAt(0)!)) throw new Error("The archive font cannot display a character in this form. Please contact the church for help preserving the original spelling.");
  }
}

// Font is bundled locally so archiving does not depend on a remote font service.
export async function renderSignedForm(submission: Submission): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  await validateArchiveText(submission.answers, submission.signature_name);
  const font = await doc.embedFont(await loadFont(), { subset: true });
  doc.setTitle(`Living Word Memphis - signed nursery form - ${submission.id}`);
  doc.setAuthor("Living Word Memphis");
  doc.setCreationDate(new Date(submission.signed_at));
  doc.setModificationDate(new Date(submission.signed_at));
  let page = doc.addPage([612, 792]);
  let y = 735;
  const newPage = () => { page = doc.addPage([612, 792]); y = 735; };
  const write = (text: string, size = 10, space = 8) => {
    const lineHeight = size * 1.5;
    for (const paragraph of text.replace(/\r/g, "").replace(/\t/g, "    ").split("\n")) {
      // Wrap by characters as well as words, including very long emergency notes.
      let line = "";
      const flush = () => {
        if (y < 65 + lineHeight) newPage();
        page.drawText(line, { x: 48, y, font, size, color: rgb(.12, .16, .19) });
        y -= lineHeight; line = "";
      };
      for (const word of paragraph.split(/(\s+)/)) {
        if (line && font.widthOfTextAtSize(line + word, size) > 516) flush();
        for (const char of word) {
          if (font.widthOfTextAtSize(line + char, size) > 516) flush();
          if (line || char.trim()) line += char;
        }
      }
      flush();
    }
    y -= space;
  };
  const heading = (text: string) => { if (y < 130) newPage(); write(text, 14, 10); };
  write("LIVING WORD MEMPHIS", 18);
  write(submission.terms.title, 14);
  write("Completed questionnaire and electronic signature record", 10, 18);
  for (const section of submission.terms.sections) {
    heading(section.title);
    for (const field of section.fields.filter(f => visible(f, submission.answers))) {
      const value = submission.answers[field.key];
      write(`${field.label}: ${Array.isArray(value) ? value.join(", ") || "Not provided" : value || "Not provided"}`);
    }
  }
  newPage();
  heading("Nursery Rules & Expectations");
  submission.terms.rules.forEach((rule, i) => write(`${i + 1}. ${rule}`));
  heading("Liability Waiver & Release");
  submission.terms.waiver.forEach(p => write(p));
  heading("Parent/Guardian Acknowledgment");
  write(submission.terms.acknowledgment);
  write(submission.terms.electronicConsent);
  heading("Electronic signature");
  write(`Signed by: ${submission.signature_name}`, 13);
  write(`Signed at: ${new Date(submission.signed_at).toISOString()} (UTC)`);
  write(`Verified account email: ${submission.signer_email}`);
  write(`Guardian account ID: ${submission.guardian_id}`);
  write(`Submission ID: ${submission.id}`);
  write(`Document version: ${submission.form_version} | Questionnaire revision: ${submission.revision}`);
  write("Signature method: typed full name with affirmative electronic consent.");
  write("This copy preserves the answers and terms accepted at signing. Subsequent updates require a new signed submission. Staff notes are maintained separately.");
  const pages = doc.getPages();
  pages.forEach((p, i) => p.drawText(`Living Word Memphis | Nursery | ${i + 1} / ${pages.length}`, { x: 48, y: 32, font, size: 8, color: rgb(.4, .4, .4) }));
  return doc.save();
}
