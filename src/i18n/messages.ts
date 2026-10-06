import type { Locale } from "@/types/foundation";

export const messages = {
  fr: {
    "app.name": "EDXSTORE Scolarité",
    "nav.dashboard": "Tableau de bord",
    "nav.settings": "Paramètres",
    "nav.users": "Utilisateurs",
    "home.title": "Fondation SaaS scolaire, sécurisée et multi-tenant",
    "home.subtitle":
      "Sprint 0 met en place l'authentification, les tenants, les rôles, l'audit et l'interface d'administration.",
    "auth.login.title": "Connexion",
    "auth.login.description": "Connectez-vous avec votre compte Supabase.",
    "auth.email": "Adresse e-mail",
    "auth.password": "Mot de passe",
    "auth.submit": "Se connecter",
    "auth.reset": "Demander une réinitialisation",
    "onboarding.title": "Créer votre institution",
    "onboarding.description": "Ces informations initialisent le tenant et ses paramètres.",
    "dashboard.title": "Tableau de bord fondation",
    "dashboard.subtitle": "Vue de Sprint 0 sans indicateurs financiers simulés.",
    "settings.title": "Paramètres du tenant",
    "users.title": "Administration des membres",
    "users.invite": "Inviter un membre",
    "state.empty": "Aucune donnée à afficher pour le moment.",
    "state.permissionDenied": "Vous n'avez pas la permission d'accéder à cette section.",
  },
  en: {
    "app.name": "EDXSTORE Schooling",
    "nav.dashboard": "Dashboard",
    "nav.settings": "Settings",
    "nav.users": "Users",
    "home.title": "Secure multi-tenant school SaaS foundation",
    "home.subtitle":
      "Sprint 0 establishes authentication, tenants, roles, audit, and the administration interface.",
    "auth.login.title": "Sign in",
    "auth.login.description": "Sign in with your Supabase account.",
    "auth.email": "Email address",
    "auth.password": "Password",
    "auth.submit": "Sign in",
    "auth.reset": "Request password reset",
    "onboarding.title": "Create your institution",
    "onboarding.description": "These details initialize the tenant and settings.",
    "dashboard.title": "Foundation dashboard",
    "dashboard.subtitle": "Sprint 0 view without fabricated financial metrics.",
    "settings.title": "Tenant settings",
    "users.title": "Member administration",
    "users.invite": "Invite member",
    "state.empty": "No data to display yet.",
    "state.permissionDenied": "You do not have permission to access this section.",
  },
} as const;

export type MessageKey = keyof typeof messages.fr;

export function t(locale: Locale, key: MessageKey) {
  return messages[locale][key] ?? messages.fr[key];
}

export function getLocale(input?: string | null): Locale {
  return input === "en" ? "en" : "fr";
}
