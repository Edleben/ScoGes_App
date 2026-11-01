import type { Locale } from "@/types/foundation";
import { sprintTrackers, type SprintTracker } from "./tracker-data";
const english = [
  [
    "Platform foundations",
    "All six technical milestones are delivered. The closure PR brings together validation and residual risks; owner acceptance is pending. Sprint 1 is not active.",
    [
      [
        "Workspace and quality",
        "Next.js 16, strict TypeScript, pnpm, lint, tests, build and CI.",
      ],
      [
        "Tenants, memberships and RBAC",
        "Foundation tables, roles, permissions, server helpers and RLS.",
      ],
      [
        "Onboarding and audit",
        "Browser onboarding, roles, deactivation/revocation and transactional audit verified.",
      ],
      [
        "Administration shell",
        "Foundation shell, authentication and administration.",
      ],
      [
        "Complete bilingual foundation coverage",
        "Onboarding, shell, dashboard, tracker and errors translated; navigation and document language verified in French and English.",
      ],
      [
        "Validate end-to-end email journeys",
        "Confirmation, recovery, invitation receipt and acceptance verified in French/English; replay rejected and test accounts cleaned up.",
      ],
    ],
  ],
  [
    "Academics, students, guardians and imports",
    "Academic configuration, student records, guardians, enrollments and CSV/XLSX imports.",
    [
      [
        "Academic references",
        "Configurable years, programs, levels, classes and statuses.",
      ],
      [
        "Students and guardians",
        "Tenant-safe CRUD, family/student links and administrative search.",
      ],
      ["Enrollments", "Enrollment history by year, level and class."],
      [
        "CSV/XLSX imports",
        "Validation, dry run, row-level errors and summary.",
      ],
    ],
  ],
  [
    "Fees, billing and installments",
    "Fee configuration, discounts, penalties, invoices, lines and payment plans.",
    [
      [
        "Fee configuration",
        "Fees by year, program, level, class, category or student.",
      ],
      ["Invoices", "Drafts, issuance, statuses, lines and derivable balances."],
      [
        "Installments",
        "Amounts, due dates, statuses and partial payment rules.",
      ],
    ],
  ],
  [
    "Payments, reconciliation and receipts",
    "Provider abstraction, offline payments, allocations, reconciliation, receipts and idempotent webhooks.",
    [
      [
        "Payment abstraction",
        "Portable interfaces for offline, online and future mobile money.",
      ],
      [
        "Allocations and reconciliation",
        "Partial payments, duplicates, exceptions and reconcilable transactions.",
      ],
      [
        "Receipts and webhooks",
        "Bilingual receipts and idempotent webhook handling.",
      ],
    ],
  ],
  [
    "Collections and communications",
    "Unpaid balances, reminders, communication preferences, email and SMS.",
    [
      [
        "Collection workflow",
        "Aging, escalation statuses, internal notes and history.",
      ],
      [
        "Automated reminders",
        "Events, deduplication, email/SMS and bilingual templates.",
      ],
    ],
  ],
  [
    "Reporting and advanced administration",
    "Reports, exports, fine-grained permissions, audit views and operational administration.",
    [
      [
        "Reports",
        "Collections, unpaid balances, channels, classes, exceptions and filters.",
      ],
      ["Exports", "Tenant-safe CSV, XLSX and PDF with server permissions."],
      [
        "Advanced administration",
        "Fine-grained permissions, enriched audit and authorized support operations.",
      ],
    ],
  ],
] as const;
const areas: Record<string, string> = {
  Engineering: "Ingénierie",
  Security: "Sécurité",
  Platform: "Plateforme",
  "Product UI": "Interface produit",
  "Identity / UAT": "Identité / recette",
  Academics: "Scolarité",
  People: "Personnes",
  Operations: "Opérations",
  Billing: "Facturation",
  Payments: "Paiements",
  Finance: "Finance",
  Collections: "Recouvrement",
  Communications: "Communications",
  Reporting: "Rapports",
  Administration: "Administration",
};
export function getLocalizedTrackers(locale: Locale): SprintTracker[] {
  return sprintTrackers.map((sprint, index) => {
    const translation = english[index];
    return {
      ...sprint,
      objective: locale === "en" ? translation[0] : sprint.objective,
      summary: locale === "en" ? translation[1] : sprint.summary,
      features: sprint.features.map((feature, i) => ({
        ...feature,
        title: locale === "en" ? translation[2][i][0] : feature.title,
        description:
          locale === "en" ? translation[2][i][1] : feature.description,
        ownerArea:
          locale === "fr"
            ? (areas[feature.ownerArea] ?? feature.ownerArea)
            : feature.ownerArea,
      })),
    };
  });
}
