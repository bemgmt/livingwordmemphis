import Link from "next/link";
import { redirect } from "next/navigation";
import { sundaySchoolSession } from "@/lib/auth/sunday-school";
import { CurriculumUpload } from "./upload-form";

export const dynamic = "force-dynamic";
export default async function UploadPage() {
  const session = await sundaySchoolSession();
  if (!session) redirect("/auth/login?next=/member/sunday-school/upload");
  if (!session.canUpload) redirect("/member/sunday-school");
  return <div className="mx-auto max-w-2xl space-y-6"><Link href="/member/sunday-school" className="text-sm text-primary underline">← Sunday School</Link><header><h1 className="font-serif text-3xl">Upload weekly curriculum</h1><p className="mt-2 text-muted-foreground">Choose the class and Sunday. Published files are available to all signed-in members.</p></header><CurriculumUpload /></div>;
}
