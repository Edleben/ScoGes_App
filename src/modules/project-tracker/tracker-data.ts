export type FeatureStatus = "done" | "in_progress" | "planned" | "blocked";

export type ProjectFeature = {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  progress: number;
  ownerArea: string;
};

export type SprintTracker = {
  id: string;
  label: string;
  objective: string;
  status: FeatureStatus;
  progress: number;
  summary: string;
  features: ProjectFeature[];
};

export const sprintTrackers: SprintTracker[] = [
  {
    id: "sprint-0",
    label: "Sprint 0",
    objective: "Fondations plateforme",
    status: "done",
    progress: 100,
    summary:
      "Base Next.js, Supabase, auth, tenant model, RBAC, audit baseline, shell UI, tests et CI.",
    features: [
      {
        id: "workspace-quality",
        title: "Workspace et qualite",
        description: "Next.js 16, TypeScript strict, pnpm, lint, tests, build et CI.",
        status: "done",
        progress: 100,
        ownerArea: "Engineering",
      },
      {
        id: "tenant-rbac",
        title: "Tenant, membership et RBAC",
        description: "Tables fondation, roles, permissions, helpers serveur et RLS.",
        status: "done",
        progress: 100,
        ownerArea: "Security",
      },
      {
        id: "onboarding-audit",
        title: "Onboarding et audit",
        description: "Creation institutionnelle, role tenant admin et evenements critiques.",
        status: "done",
        progress: 100,
        ownerArea: "Platform",
      },
      {
        id: "foundation-ui",
        title: "Shell UI administration",
        description: "Routes initiales, navigation, pages settings/users et smoke E2E.",
        status: "done",
        progress: 100,
        ownerArea: "Product UI",
      },
    ],
  },
  {
    id: "sprint-1",
    label: "Sprint 1",
    objective: "Academique, eleves, responsables et imports",
    status: "planned",
    progress: 0,
    summary:
      "Configuration academique, dossiers eleves, responsables, inscriptions et import CSV/XLSX.",
    features: [
      {
        id: "academic-references",
        title: "References academiques",
        description: "Annees, programmes, niveaux, classes et statuts configurables.",
        status: "planned",
        progress: 0,
        ownerArea: "Academics",
      },
      {
        id: "students-guardians",
        title: "Eleves et responsables",
        description: "CRUD tenant-safe, liens famille-eleve et recherche admin.",
        status: "planned",
        progress: 0,
        ownerArea: "People",
      },
      {
        id: "enrollments",
        title: "Inscriptions",
        description: "Historique d'inscription par annee, niveau et classe.",
        status: "planned",
        progress: 0,
        ownerArea: "Academics",
      },
      {
        id: "imports",
        title: "Imports CSV/XLSX",
        description: "Validation, dry-run, erreurs ligne par ligne et recapitulatif.",
        status: "planned",
        progress: 0,
        ownerArea: "Operations",
      },
    ],
  },
  {
    id: "sprint-2",
    label: "Sprint 2",
    objective: "Frais, facturation et echeanciers",
    status: "planned",
    progress: 0,
    summary:
      "Configuration des frais, remises, penalites, factures, lignes et plans de paiement.",
    features: [
      {
        id: "fee-configuration",
        title: "Configuration des frais",
        description: "Frais par annee, programme, niveau, classe, categorie ou eleve.",
        status: "planned",
        progress: 0,
        ownerArea: "Billing",
      },
      {
        id: "invoices",
        title: "Factures",
        description: "Brouillons, emission, statuts, lignes et calculs de soldes derivables.",
        status: "planned",
        progress: 0,
        ownerArea: "Billing",
      },
      {
        id: "installments",
        title: "Echeanciers",
        description: "Montants, dates dues, statuts et regles de paiement partiel.",
        status: "planned",
        progress: 0,
        ownerArea: "Billing",
      },
    ],
  },
  {
    id: "sprint-3",
    label: "Sprint 3",
    objective: "Paiements, rapprochement et recus",
    status: "planned",
    progress: 0,
    summary:
      "Abstraction provider, paiements offline, allocations, rapprochement, recus et webhooks idempotents.",
    features: [
      {
        id: "payment-abstraction",
        title: "Abstraction paiement",
        description: "Interfaces provider-portable pour offline, online et mobile money futur.",
        status: "planned",
        progress: 0,
        ownerArea: "Payments",
      },
      {
        id: "allocations-reconciliation",
        title: "Allocations et rapprochement",
        description: "Paiements partiels, doublons, exceptions et transactions reconciliables.",
        status: "planned",
        progress: 0,
        ownerArea: "Finance",
      },
      {
        id: "receipts-webhooks",
        title: "Recus et webhooks",
        description: "Generation de recus bilingues et traitement idempotent des webhooks.",
        status: "planned",
        progress: 0,
        ownerArea: "Payments",
      },
    ],
  },
  {
    id: "sprint-4",
    label: "Sprint 4",
    objective: "Recouvrement et communications",
    status: "planned",
    progress: 0,
    summary:
      "Suivi des impayes, relances, preferences de communication, email et SMS.",
    features: [
      {
        id: "collections",
        title: "Workflow recouvrement",
        description: "Aging, statuts d'escalade, notes internes et historique.",
        status: "planned",
        progress: 0,
        ownerArea: "Collections",
      },
      {
        id: "reminders",
        title: "Relances automatisees",
        description: "Evenements, anti-doublons, email/SMS et templates bilingues.",
        status: "planned",
        progress: 0,
        ownerArea: "Communications",
      },
    ],
  },
  {
    id: "sprint-5",
    label: "Sprint 5",
    objective: "Reporting et administration avancee",
    status: "planned",
    progress: 0,
    summary:
      "Rapports, exports, permissions fines, vues audit et administration operationnelle.",
    features: [
      {
        id: "reports",
        title: "Rapports",
        description: "Encaissement, impayes, canaux, classes, exceptions et filtres.",
        status: "planned",
        progress: 0,
        ownerArea: "Reporting",
      },
      {
        id: "exports",
        title: "Exports",
        description: "CSV, XLSX, PDF tenant-safe avec permissions serveur.",
        status: "planned",
        progress: 0,
        ownerArea: "Reporting",
      },
      {
        id: "advanced-admin",
        title: "Administration avancee",
        description: "Permissions fines, audit enrichi et operations support autorisees.",
        status: "planned",
        progress: 0,
        ownerArea: "Administration",
      },
    ],
  },
];

export function getProjectTrackerSummary() {
  const features = sprintTrackers.flatMap((sprint) => sprint.features);
  const doneFeatures = features.filter((feature) => feature.status === "done").length;
  const inProgressFeatures = features.filter((feature) => feature.status === "in_progress").length;
  const plannedFeatures = features.filter((feature) => feature.status === "planned").length;
  const blockedFeatures = features.filter((feature) => feature.status === "blocked").length;
  const progress =
    features.length === 0
      ? 0
      : Math.round(features.reduce((total, feature) => total + feature.progress, 0) / features.length);

  return {
    totalSprints: sprintTrackers.length,
    totalFeatures: features.length,
    doneFeatures,
    inProgressFeatures,
    plannedFeatures,
    blockedFeatures,
    progress,
  };
}

export function getStatusLabel(status: FeatureStatus) {
  const labels: Record<FeatureStatus, string> = {
    done: "Termine",
    in_progress: "En cours",
    planned: "Planifie",
    blocked: "Bloque",
  };

  return labels[status];
}

export function getStatusClassName(status: FeatureStatus) {
  const classes: Record<FeatureStatus, string> = {
    done: "border-emerald-200 bg-emerald-50 text-emerald-800",
    in_progress: "border-blue-200 bg-blue-50 text-blue-800",
    planned: "border-slate-200 bg-slate-50 text-slate-700",
    blocked: "border-red-200 bg-red-50 text-red-800",
  };

  return classes[status];
}
