import type { Locale } from "@/types/foundation";

const fr = {
  login: "Connexion",
  signup: "Créer un compte",
  recovery: "Mot de passe oublié",
  loginSubmit: "Se connecter",
  role: "Rôle",
  tenant_admin: "Administrateur",
  finance_manager: "Responsable finance",
  cashier: "Caissier",
  registrar: "Scolarité",
  auditor: "Auditeur",
  reset: "Choisir un nouveau mot de passe",
  invitation: "Accepter une invitation",
  email: "Adresse e-mail",
  password: "Mot de passe",
  confirm: "Confirmer le mot de passe",
  submit: "Continuer",
  pending: "Veuillez patienter…",
  signout: "Se déconnecter",
  accept: "Accepter l’invitation",
  capture: "Ouvrir l’invitation",
  invite: "Envoyer l’invitation",
  invitedEmail:
    "Connectez-vous ou créez un compte avec l’adresse e-mail invitée, puis acceptez l’invitation.",
  invalid:
    "Vérifiez les informations saisies. Le mot de passe doit contenir au moins 8 caractères et les deux mots de passe doivent correspondre.",
  credentials:
    "Adresse e-mail ou mot de passe incorrect, ou compte non confirmé.",
  unavailable:
    "Le service est temporairement indisponible. Réessayez plus tard.",
  emailRateLimited:
    "La limite d’envoi des e-mails a été atteinte. Patientez avant de réessayer. Si le problème persiste, contactez l’administrateur.",
  rateLimited:
    "Trop de demandes ont été effectuées. Patientez avant de réessayer.",
  emailUnavailable:
    "L’envoi de l’e-mail de confirmation est indisponible. Contactez l’administrateur.",
  signupUnavailable:
    "La création de comptes est actuellement désactivée. Contactez l’administrateur.",
  passwordRejected: "Choisissez un mot de passe plus robuste, puis réessayez.",
  checkEmail:
    "Si la demande peut être traitée, un e-mail vous indiquera la marche à suivre. Vérifiez aussi vos courriers indésirables.",
  invalidLink:
    "Ce lien est invalide, expiré ou déjà utilisé. Demandez un nouveau lien.",
  passwordUpdated:
    "Mot de passe modifié. Reconnectez-vous avec votre nouveau mot de passe.",
  denied: "Vous n’avez pas la permission d’effectuer cette action.",
  inviteFailed:
    "L’invitation n’a pas pu être créée. Vérifiez l’adresse, le rôle et les invitations existantes, puis réessayez après une minute.",
  deliveryFailed:
    "L’invitation a été enregistrée mais l’envoi a échoué. Réessayez après une minute pour envoyer un nouveau lien.",
  delivered:
    "Le serveur de messagerie a accepté l’invitation. La réception dans la boîte du destinataire reste à vérifier.",
  smtpMissing:
    "La messagerie n’est pas configurée. Aucun e-mail n’a été envoyé.",
  acceptanceFailed:
    "Impossible d’accepter cette invitation. Vérifiez l’adresse du compte et sa confirmation. Le lien peut être expiré, révoqué ou déjà utilisé.",
  verified: "Confirmez votre adresse e-mail avant de continuer.",
  passwordSignoutFailed:
    "Le mot de passe a été modifié, mais la fermeture des sessions a échoué. Déconnectez-vous et réessayez.",
};

export type AuthMessageKey = keyof typeof fr;
const en: Record<AuthMessageKey, string> = {
  login: "Sign in",
  signup: "Create an account",
  recovery: "Forgot password",
  loginSubmit: "Sign in",
  role: "Role",
  tenant_admin: "Administrator",
  finance_manager: "Finance manager",
  cashier: "Cashier",
  registrar: "Registrar",
  auditor: "Auditor",
  reset: "Choose a new password",
  invitation: "Accept an invitation",
  email: "Email address",
  password: "Password",
  confirm: "Confirm password",
  submit: "Continue",
  pending: "Please wait…",
  signout: "Sign out",
  accept: "Accept invitation",
  capture: "Open invitation",
  invite: "Send invitation",
  invitedEmail:
    "Sign in or create an account using the invited email address, then accept the invitation.",
  invalid:
    "Check your details. The password must have at least 8 characters and both passwords must match.",
  credentials: "Incorrect email or password, or unconfirmed account.",
  unavailable:
    "The service is temporarily unavailable. Please try again later.",
  emailRateLimited:
    "The email sending limit has been reached. Wait before trying again. If the problem persists, contact the administrator.",
  rateLimited: "Too many requests have been made. Wait before trying again.",
  emailUnavailable:
    "The confirmation email cannot be sent. Contact the administrator.",
  signupUnavailable:
    "Account creation is currently disabled. Contact the administrator.",
  passwordRejected: "Choose a stronger password, then try again.",
  checkEmail:
    "If the request can be processed, an email will explain the next steps. Check your spam folder too.",
  invalidLink:
    "This link is invalid, expired or already used. Request a new link.",
  passwordUpdated: "Password updated. Sign in again with your new password.",
  denied: "You do not have permission to perform this action.",
  inviteFailed:
    "The invitation could not be created. Check the email, role and existing invitations, then retry after one minute.",
  deliveryFailed:
    "The invitation was recorded but delivery failed. Retry after one minute to send a new link.",
  delivered:
    "The mail server accepted the invitation. Inbox delivery still needs to be verified.",
  smtpMissing: "Email delivery is not configured. No email was sent.",
  acceptanceFailed:
    "Unable to accept this invitation. Check the account email and its confirmation. The link may be expired, revoked or already used.",
  verified: "Confirm your email address before continuing.",
  passwordSignoutFailed:
    "The password was changed, but closing sessions failed. Sign out and retry.",
};

export function authText(locale: Locale, key: AuthMessageKey) {
  return (locale === "en" ? en : fr)[key];
}
