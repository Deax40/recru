import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd/MM/yyyy", { locale: fr });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: fr });
}

export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value}%`;
}

export function generateTicketNumber(): string {
  const date = format(new Date(), "yyyyMMdd");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `TKT-${date}-${random}`;
}

export function generateQuoteNumber(): string {
  const date = format(new Date(), "yyyyMM");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `DEV-${date}-${random}`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export const CALL_STATUS_LABELS: Record<string, string> = {
  TO_CALL: "À appeler",
  CALLED: "Appel effectué",
  NO_ANSWER: "Pas de réponse",
  WRONG_NUMBER: "Numéro incorrect",
  TO_CALLBACK: "À rappeler",
  NOT_INTERESTED: "Pas intéressé",
  INTERESTED: "Intéressé",
  MEETING_SCHEDULED: "Rendez-vous obtenu",
  QUOTE_REQUESTED: "Devis demandé",
  QUOTE_IN_PROGRESS: "Devis en cours",
  QUOTE_SENT: "Devis envoyé",
  QUOTE_SIGNED: "Devis signé",
  QUOTE_REFUSED: "Devis refusé",
  LOST_CLIENT: "Client perdu",
  FINALIZED_CLIENT: "Client finalisé",
};

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  INFO_TO_COMPLETE: "Informations à compléter",
  IN_PREPARATION: "Devis en préparation",
  SENT: "Devis envoyé",
  WAITING_RESPONSE: "En attente de réponse",
  FOLLOW_UP_NEEDED: "Relance à effectuer",
  ACCEPTED: "Accepté",
  SIGNED: "Signé",
  DEPOSIT_RECEIVED: "Acompte reçu",
  PARTIALLY_PAID: "Payé partiellement",
  FULLY_PAID: "Payé intégralement",
  REFUSED: "Refusé",
  CANCELLED: "Annulé",
  EXPIRED: "Expiré",
};

export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  ESTIMATION: "Estimation",
  WAITING_SIGNATURE: "En attente de signature",
  WAITING_PAYMENT: "En attente du paiement client",
  TO_VALIDATE: "À valider",
  VALIDATED: "Validée",
  PAYMENT_SCHEDULED: "Paiement programmé",
  PAID: "Payée",
  CANCELLED: "Annulée",
  SUSPENDED: "Suspendue",
};

export const PROSPECT_STATUS_LABELS: Record<string, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  INTERESTED: "Intéressé",
  MEETING_SCHEDULED: "RDV planifié",
  QUOTE_SENT: "Devis envoyé",
  CLIENT: "Client",
  LOST: "Perdu",
  ARCHIVED: "Archivé",
};

export const SUPPORT_STATUS_LABELS: Record<string, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  WAITING: "En attente",
  RESOLVED: "Résolu",
  CLOSED: "Fermé",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Faible",
  NORMAL: "Normal",
  HIGH: "Haute",
  URGENT: "Urgent",
};

export const SECTORS = [
  "Commerce & Distribution",
  "Restauration & Alimentation",
  "Immobilier",
  "BTP & Construction",
  "Santé & Bien-être",
  "Services aux entreprises",
  "Artisanat",
  "Transport & Logistique",
  "Tourisme & Hôtellerie",
  "Éducation & Formation",
  "Informatique & Digital",
  "Finance & Assurance",
  "Agriculture",
  "Industrie",
  "Mode & Beauté",
  "Sport & Loisirs",
  "Autre",
];

export const SERVICES = [
  "Site vitrine",
  "Site e-commerce",
  "Application web",
  "Application mobile",
  "CRM sur mesure",
  "Logiciel métier",
  "Refonte de site",
  "Maintenance & Évolution",
  "Référencement SEO",
  "Solutions digitales",
  "Autre",
];
