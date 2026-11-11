import { MinistryPortal } from "@/components/ministry/portal";
export const metadata = {
  title: "School administration",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <MinistryPortal initialView="admin" />;
}
