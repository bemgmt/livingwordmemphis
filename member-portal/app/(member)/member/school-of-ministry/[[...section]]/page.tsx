import { redirect } from "next/navigation";
import { ministrySession } from "@/lib/ministry/server";
import { MinistryPortal } from "@/components/ministry/portal";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "School of Ministry",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  if (!(await ministrySession()))
    redirect("/auth/login?next=%2Fmember%2Fschool-of-ministry");
  const { section } = await params;
  return (
    <MinistryPortal
      initialView={section?.[0] ?? "overview"}
      initialId={section?.[1]}
    />
  );
}
