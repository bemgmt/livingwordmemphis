import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, ChevronDown, Download, FolderOpen } from "lucide-react";
import { sundaySchoolSession } from "@/lib/auth/sunday-school";
import { sanityWriteClient } from "@/lib/sanity/client";
import { SCHOOL_CLASSES, schoolMonths, monthLabel, sundayDates, lessonDateLabel, type SchoolLesson } from "@/lib/sunday-school";

export const dynamic = "force-dynamic";
export default async function SundaySchoolPage() {
  const session = await sundaySchoolSession();
  if (!session) redirect("/auth/login?next=/member/sunday-school");
  let lessons: SchoolLesson[];
  try {
    lessons = await sanityWriteClient.fetch<SchoolLesson[]>(`*[_type == "sundaySchoolLesson" && !(_id in path("drafts.**"))] | order(lessonDate asc, title asc) {_id,title,month,classGroup,lessonDate,description,protectedFile{originalFilename}}`, {}, { cache: "no-store", perspective: "published" });
  } catch {
    return <div className="rounded-xl border bg-card p-6"><h1 className="font-serif text-3xl">Sunday School</h1><p role="alert" className="mt-3">The curriculum list is temporarily unavailable. Please refresh in a moment.</p></div>;
  }
  const months = schoolMonths(lessons.map(l => l.month));
  return <div className="mx-auto max-w-5xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="flex items-center gap-3 font-serif text-3xl"><BookOpen className="size-8 text-primary" aria-hidden />Sunday School</h1><p className="mt-2 text-muted-foreground">Weekly lessons for every age, organized by month and class.</p></div>
      {session.canUpload && <Link href="/member/sunday-school/upload" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Upload curriculum</Link>}
    </header>
    <p className="text-sm text-muted-foreground">Curriculum begins October 2026. Choose a month, class, and Sunday to download available materials.</p>
    {months.map(month => <details key={month} className="group rounded-xl border bg-card" open={months.length === 1 ? true : undefined}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 p-5"><FolderOpen className="size-5 shrink-0 text-primary" aria-hidden /><h2 className="flex-1 text-lg font-semibold">{monthLabel(month)}</h2><ChevronDown className="size-4" aria-hidden /></summary>
      <div className="space-y-3 border-t p-3 sm:p-5">{SCHOOL_CLASSES.map(group => {
        const classLessons = lessons.filter(l => l.month === month && l.classGroup === group.value);
        return <details key={group.value} className="rounded-lg border">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 p-4"><FolderOpen className="size-4 shrink-0 text-muted-foreground" aria-hidden /><h3 className="flex-1 font-medium">{group.label}</h3><span className="text-xs text-muted-foreground">{classLessons.length} {classLessons.length === 1 ? "file" : "files"}</span><ChevronDown className="size-4" aria-hidden /></summary>
          <div className="space-y-3 border-t p-3 sm:p-4">{sundayDates(month).map((date, index) => {
            const weekly = classLessons.filter(l => l.lessonDate === date);
            return <details key={date} className="rounded-lg bg-secondary/60">
              <summary className="min-h-11 cursor-pointer p-3 text-sm font-medium">Week {index + 1} · {lessonDateLabel(date)} <span className="font-normal text-muted-foreground">({weekly.length} {weekly.length === 1 ? "file" : "files"})</span></summary>
              <div className="space-y-3 px-3 pb-3">{weekly.length ? weekly.map(lesson => <article key={lesson._id} className="rounded-lg border bg-card p-4">
                <h4 className="break-words font-medium">{lesson.title}</h4>{lesson.description && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{lesson.description}</p>}
                <a className="mt-2 inline-flex min-h-11 max-w-full items-center gap-2 text-sm font-medium text-primary underline underline-offset-4" href={`/api/sunday-school/resources/${encodeURIComponent(lesson._id)}`}><Download className="size-4 shrink-0" aria-hidden /><span className="break-all">{lesson.protectedFile?.originalFilename || "Download lesson"}</span></a>
              </article>) : <p className="p-2 text-sm text-muted-foreground">No curriculum uploaded for this Sunday yet.</p>}</div>
            </details>;
          })}</div>
        </details>;
      })}</div>
    </details>)}
  </div>;
}
