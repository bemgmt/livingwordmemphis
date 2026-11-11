import { MinistryPortal } from "@/components/ministry/portal";
export const metadata = {
  title: "School administration",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ school?: string }>;
}) {
  const { school } = await searchParams;
  const offering = /^2027-(apostles|prophets|evangelist|pastor|teacher)$/.test(
    school ?? "",
  )
    ? school
    : "";
  return <MinistryPortal initialView="admin" initialOffering={offering} />;
}
