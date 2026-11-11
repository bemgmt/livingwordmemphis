import type { Enrollment, Snapshot } from "./types";
import { TUITION } from "./program";

// Additional schools share the primary enrollment's tuition account.
export function approvalTuition(
  enrollment: Enrollment,
  enrollments: Enrollment[],
  ledger: Snapshot["ledger"],
) {
  const primary =
    enrollments.find(
      (e) =>
        e.user_id === enrollment.user_id &&
        e.cohort_id === enrollment.cohort_id &&
        e.is_primary &&
        !["declined", "withdrawn"].includes(e.status),
    ) ??
    enrollments.find(
      (e) =>
        e.user_id === enrollment.user_id &&
        e.cohort_id === enrollment.cohort_id &&
        e.is_primary,
    );
  const entries = ledger.filter(
    (l) => l.enrollment_id === primary?.id && l.semester === "spring",
  );
  const hasCharge = entries.some((l) => l.kind === "charge");
  const balance = hasCharge
    ? entries.reduce((n, l) => n + l.cents, 0)
    : TUITION[0].cents;
  const ready =
    hasCharge &&
    balance <= 0 &&
    (enrollment.is_primary ||
      ["approved", "completed"].includes(primary?.status ?? ""));
  return { primary, entries, balance, ready };
}
