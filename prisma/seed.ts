import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  if (url.startsWith("file:")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaPg } = require("@prisma/adapter-pg");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

const prisma = createClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Admin ───────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@2024!", 12);
  const admin = await prisma.user.upsert({
    where: { identifier: "admin" },
    update: {},
    create: {
      identifier: "admin",
      firstName: "Laurent",
      lastName: "Moreau",
      email: "admin@deax.fr",
      phone: "06 10 00 00 00",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
      mustChangePassword: false,
      commissionRate: 0,
    },
  });
  console.log("✅ Admin créé : admin / Admin@2024!");

  // ─── Opérateurs ──────────────────────────────────────────
  const op1Password = await bcrypt.hash("Operateur@1!", 12);
  const op1 = await prisma.user.upsert({
    where: { identifier: "jean.dupont" },
    update: {},
    create: {
      identifier: "jean.dupont",
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean.dupont@exemple.fr",
      phone: "06 20 30 40 50",
      passwordHash: op1Password,
      role: "OPERATOR",
      status: "ACTIVE",
      mustChangePassword: false,
      commissionRate: 30,
      createdById: admin.id,
      lastLoginAt: new Date(Date.now() - 2 * 3600 * 1000),
    },
  });

  const op2Password = await bcrypt.hash("Operateur@2!", 12);
  const op2 = await prisma.user.upsert({
    where: { identifier: "marie.martin" },
    update: {},
    create: {
      identifier: "marie.martin",
      firstName: "Marie",
      lastName: "Martin",
      email: "marie.martin@exemple.fr",
      phone: "06 60 70 80 90",
      passwordHash: op2Password,
      role: "OPERATOR",
      status: "ACTIVE",
      mustChangePassword: false,
      commissionRate: 32,
      createdById: admin.id,
      lastLoginAt: new Date(Date.now() - 24 * 3600 * 1000),
    },
  });

  const op3Password = await bcrypt.hash("Operateur@3!", 12);
  const op3 = await prisma.user.upsert({
    where: { identifier: "thomas.bernard" },
    update: {},
    create: {
      identifier: "thomas.bernard",
      firstName: "Thomas",
      lastName: "Bernard",
      email: "thomas.bernard@exemple.fr",
      phone: "06 11 22 33 44",
      passwordHash: op3Password,
      role: "OPERATOR",
      status: "ACTIVE",
      mustChangePassword: true,
      commissionRate: 28,
      createdById: admin.id,
    },
  });

  const op4Password = await bcrypt.hash("Operateur@4!", 12);
  await prisma.user.upsert({
    where: { identifier: "sophie.leroy" },
    update: {},
    create: {
      identifier: "sophie.leroy",
      firstName: "Sophie",
      lastName: "Leroy",
      email: "sophie.leroy@exemple.fr",
      phone: "06 55 66 77 88",
      passwordHash: op4Password,
      role: "OPERATOR",
      status: "SUSPENDED",
      mustChangePassword: false,
      commissionRate: 30,
      createdById: admin.id,
    },
  });

  console.log("✅ Opérateurs créés");

  // ─── Campagne ─────────────────────────────────────────────
  const campaign = await prisma.campaign.upsert({
    where: { id: "camp1" },
    update: {},
    create: {
      id: "camp1",
      name: "Campagne Restauration Île-de-France",
      description: "Prospection restaurants et hôtels en IDF",
      sector: "Restauration & Alimentation",
      zone: "Île-de-France",
      isActive: true,
    },
  });

  // ─── Catégories de documents ──────────────────────────────
  const docCategories = [
    { slug: "presentation", name: "Présentation de DeaX", order: 1 },
    { slug: "services", name: "Services DeaX", order: 2 },
    { slug: "besoins", name: "Comprendre les besoins", order: 3 },
    { slug: "guide-prospection", name: "Guide de prospection", order: 4 },
    { slug: "scripts", name: "Scripts d'appel", order: 5 },
    { slug: "objections", name: "Réponses aux objections", order: 6 },
    { slug: "crm", name: "Utilisation du CRM", order: 7 },
    { slug: "commissions", name: "Fonctionnement des commissions", order: 8 },
    { slug: "qualite", name: "Charte qualité", order: 9 },
    { slug: "bonnes-pratiques", name: "Bonnes pratiques", order: 10 },
    { slug: "rgpd", name: "Règles RGPD", order: 11 },
    { slug: "admin-docs", name: "Documents administratifs", order: 12 },
    { slug: "catalogue", name: "Catalogue des prestations", order: 13 },
  ];

  const createdCats: Record<string, string> = {};
  for (const cat of docCategories) {
    const c = await prisma.documentCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCats[cat.slug] = c.id;
  }

  // ─── Documents ────────────────────────────────────────────
  const docs = [
    {
      title: "Présentation DeaX — Qui sommes-nous ?",
      description: "Découvrez DeaX, notre histoire, nos valeurs et nos expertises.",
      version: "2.1",
      categorySlug: "presentation",
      isMandatory: true,
      status: "PUBLISHED",
    },
    {
      title: "Catalogue complet des prestations",
      description: "Tous nos services avec descriptions et tarifs indicatifs.",
      version: "3.0",
      categorySlug: "catalogue",
      isMandatory: true,
      status: "PUBLISHED",
    },
    {
      title: "Guide du parfait prospecteur",
      description: "Méthodes et conseils pour réussir vos appels commerciaux.",
      version: "1.5",
      categorySlug: "guide-prospection",
      isMandatory: false,
      status: "PUBLISHED",
    },
    {
      title: "Script d'appel — Prise de contact",
      description: "Script complet pour la première prise de contact avec un prospect.",
      version: "1.2",
      categorySlug: "scripts",
      isMandatory: false,
      status: "PUBLISHED",
    },
    {
      title: "Réponses aux 30 objections les plus courantes",
      description: "Guide pratique pour surmonter les refus et objections.",
      version: "2.0",
      categorySlug: "objections",
      isMandatory: false,
      status: "PUBLISHED",
    },
    {
      title: "Manuel utilisateur du CRM DeaX",
      description: "Guide complet d'utilisation de la plateforme.",
      version: "1.0",
      categorySlug: "crm",
      isMandatory: true,
      status: "PUBLISHED",
    },
    {
      title: "Comprendre le système de commissions",
      description: "Explication détaillée du calcul et versement des commissions.",
      version: "1.3",
      categorySlug: "commissions",
      isMandatory: true,
      status: "PUBLISHED",
    },
    {
      title: "Règles RGPD pour les opérateurs",
      description: "Obligations légales et bonnes pratiques en matière de données personnelles.",
      version: "1.1",
      categorySlug: "rgpd",
      isMandatory: true,
      status: "PUBLISHED",
    },
  ];

  for (const doc of docs) {
    const existing = await prisma.document.findFirst({ where: { title: doc.title } });
    if (!existing) {
      await prisma.document.create({
        data: {
          title: doc.title,
          description: doc.description,
          version: doc.version,
          categoryId: createdCats[doc.categorySlug],
          isMandatory: doc.isMandatory,
          status: doc.status as any,
          publishedAt: new Date(),
        },
      });
    }
  }
  console.log("✅ Documents créés");

  // ─── FAQ ──────────────────────────────────────────────────
  const faqs = [
    {
      category: "Démarrage",
      question: "Comment créer mon premier appel ?",
      answer: "Rendez-vous dans 'Mes appels' puis cliquez sur 'Nouvel appel'. Remplissez les informations du contact, choisissez le statut et enregistrez.",
      order: 1,
    },
    {
      category: "Démarrage",
      question: "Qu'est-ce qu'un prospect ?",
      answer: "Un prospect est une entreprise ou un contact qui a montré un intérêt pour les services DeaX. Les prospects se créent automatiquement lorsque vous enregistrez un appel avec un statut positif (intéressé, RDV, devis).",
      order: 2,
    },
    {
      category: "Appels",
      question: "Que faire si le numéro est incorrect ?",
      answer: "Sélectionnez le statut 'Numéro incorrect' lors de l'enregistrement de l'appel. Essayez de trouver le bon numéro via le site internet de l'entreprise ou une recherche Google.",
      order: 1,
    },
    {
      category: "Commissions",
      question: "Quand est-ce que ma commission est payée ?",
      answer: "Votre commission est payée dans les 24 heures suivant la réception du paiement intégral du client par DeaX. L'administrateur valide la commission et procède au virement.",
      order: 1,
    },
    {
      category: "Commissions",
      question: "Comment est calculée ma commission ?",
      answer: "Votre commission est calculée sur le montant HT encaissé par DeaX, multiplié par votre taux de commission (par défaut 30%). Exemple : devis de 2000€ HT → commission = 2000 × 30% = 600€.",
      order: 2,
    },
    {
      category: "Devis",
      question: "Puis-je créer un devis moi-même ?",
      answer: "Non, vous ne pouvez pas créer un devis. Vous transmettez les informations commerciales à l'administrateur via votre fiche prospect ou par le support. L'administrateur crée ensuite le devis officiel.",
      order: 1,
    },
    {
      category: "Utilisation du CRM",
      question: "Puis-je modifier un appel après l'avoir enregistré ?",
      answer: "Oui, vous pouvez modifier vos notes tant que le dossier n'est pas verrouillé par l'administrateur. Une fois verrouillé, contactez l'administrateur si vous avez besoin d'une correction.",
      order: 1,
    },
    {
      category: "Règles internes",
      question: "Y a-t-il un quota minimum d'appels à réaliser ?",
      answer: "Non, il n'y a aucun quota minimum. Votre rémunération dépend uniquement des ventes réellement encaissées. Plus vous prospectez efficacement, plus vous augmentez vos chances de commissions.",
      order: 1,
    },
  ];

  for (const faq of faqs) {
    const existing = await prisma.fAQ.findFirst({ where: { question: faq.question } });
    if (!existing) {
      await prisma.fAQ.create({ data: { ...faq, isPublished: true } });
    }
  }
  console.log("✅ FAQ créée");

  // ─── Prospects ────────────────────────────────────────────
  const prospects = [
    {
      companyName: "Restaurant Le Provençal",
      contactName: "Michel Blanc",
      email: "contact@leprovencal.fr",
      phone: "01 42 00 00 01",
      sector: "Restauration & Alimentation",
      city: "Paris 11e",
      website: "www.leprovencal.fr",
      status: "INTERESTED",
      serviceNeeded: "Site e-commerce",
      operatorId: op1.id,
    },
    {
      companyName: "Plomberie Dupuis",
      contactName: "Henri Dupuis",
      phone: "01 43 00 00 02",
      sector: "BTP & Construction",
      city: "Vincennes",
      status: "MEETING_SCHEDULED",
      serviceNeeded: "Site vitrine",
      operatorId: op1.id,
    },
    {
      companyName: "Cabinet Juridique Moreau",
      contactName: "Maître Sophie Moreau",
      email: "contact@moreau-avocats.fr",
      phone: "01 44 00 00 03",
      sector: "Services aux entreprises",
      city: "Paris 8e",
      status: "QUOTE_SENT",
      serviceNeeded: "CRM sur mesure",
      operatorId: op1.id,
    },
    {
      companyName: "Boutique Mode Élégance",
      contactName: "Isabelle Fontaine",
      email: "isabelle@mode-elegance.fr",
      phone: "01 45 00 00 04",
      sector: "Mode & Beauté",
      city: "Boulogne-Billancourt",
      status: "NEW",
      serviceNeeded: "Site e-commerce",
      operatorId: op2.id,
    },
    {
      companyName: "Garage Auto Prestige",
      contactName: "Frédéric Noir",
      phone: "01 46 00 00 05",
      sector: "Commerce & Distribution",
      city: "Versailles",
      status: "CONTACTED",
      serviceNeeded: "Site vitrine",
      operatorId: op2.id,
    },
    {
      companyName: "Agence Immobilière Horizon",
      contactName: "Claire Bertrand",
      email: "c.bertrand@horizon-immo.fr",
      phone: "01 47 00 00 06",
      sector: "Immobilier",
      city: "Neuilly-sur-Seine",
      status: "INTERESTED",
      serviceNeeded: "Application web",
      operatorId: op2.id,
    },
  ];

  const createdProspects: Record<string, string> = {};
  for (const p of prospects) {
    const existing = await prisma.prospect.findFirst({ where: { companyName: p.companyName } });
    if (!existing) {
      const created = await prisma.prospect.create({ data: p as any });
      createdProspects[p.companyName] = created.id;
    } else {
      createdProspects[p.companyName] = existing.id;
    }
  }
  console.log("✅ Prospects créés");

  // ─── Appels ───────────────────────────────────────────────
  const now = new Date();
  const callsData = [
    {
      companyName: "Restaurant Le Provençal",
      contactName: "Michel Blanc",
      phone: "01 42 00 00 01",
      sector: "Restauration & Alimentation",
      city: "Paris 11e",
      status: "INTERESTED",
      interestLevel: 4,
      callSummary: "M. Blanc est très intéressé par un site avec commande en ligne. Il souhaite en discuter plus en détail. RDV la semaine prochaine.",
      callDate: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
      operatorId: op1.id,
      prospectId: createdProspects["Restaurant Le Provençal"],
    },
    {
      companyName: "Plomberie Dupuis",
      contactName: "Henri Dupuis",
      phone: "01 43 00 00 02",
      sector: "BTP & Construction",
      city: "Vincennes",
      status: "MEETING_SCHEDULED",
      interestLevel: 5,
      callSummary: "Henri est très motivé. Son site actuel est une vieille page HTML de 2010. RDV mercredi à 14h pour présentation.",
      callbackDate: new Date(now.getTime() + 3 * 24 * 3600 * 1000),
      callDate: new Date(now.getTime() - 24 * 3600 * 1000),
      operatorId: op1.id,
      prospectId: createdProspects["Plomberie Dupuis"],
    },
    {
      companyName: "Brasserie des Arts",
      contactName: "Jean-Claude Petit",
      phone: "01 48 00 00 07",
      sector: "Restauration & Alimentation",
      city: "Montmartre",
      status: "NOT_INTERESTED",
      interestLevel: 1,
      callSummary: "Pas intéressé, vient de refaire son site avec un prestataire local.",
      callDate: new Date(now.getTime() - 3 * 24 * 3600 * 1000),
      operatorId: op1.id,
    },
    {
      companyName: "Boutique Mode Élégance",
      contactName: "Isabelle Fontaine",
      phone: "01 45 00 00 04",
      sector: "Mode & Beauté",
      status: "TO_CALLBACK",
      interestLevel: 3,
      callSummary: "Intéressée mais en déplacement. Rappeler jeudi matin.",
      callbackDate: new Date(now.getTime() + 2 * 24 * 3600 * 1000),
      callDate: new Date(now.getTime() - 12 * 3600 * 1000),
      operatorId: op2.id,
      prospectId: createdProspects["Boutique Mode Élégance"],
    },
    {
      companyName: "Agence Immobilière Horizon",
      contactName: "Claire Bertrand",
      phone: "01 47 00 00 06",
      sector: "Immobilier",
      status: "QUOTE_REQUESTED",
      interestLevel: 5,
      callSummary: "Claire a besoin d'une application pour gérer son portefeuille de biens. Budget autour de 8000€. Très motivée.",
      callDate: new Date(now.getTime() - 5 * 24 * 3600 * 1000),
      operatorId: op2.id,
      prospectId: createdProspects["Agence Immobilière Horizon"],
    },
    {
      companyName: "Taxi Martin",
      contactName: "Éric Martin",
      phone: "06 12 34 56 78",
      sector: "Transport & Logistique",
      city: "Montreuil",
      status: "NO_ANSWER",
      callDate: new Date(now.getTime() - 6 * 3600 * 1000),
      operatorId: op2.id,
    },
  ];

  for (const call of callsData) {
    const existing = await prisma.call.findFirst({
      where: { companyName: call.companyName, operatorId: call.operatorId },
    });
    if (!existing) {
      await prisma.call.create({ data: call as any });
    }
  }
  console.log("✅ Appels créés");

  // ─── Devis ────────────────────────────────────────────────
  const quotesData = [
    {
      quoteNumber: "DEV-202507-0001",
      clientName: "Cabinet Juridique Moreau",
      service: "CRM sur mesure — gestion dossiers clients",
      amountHT: 6500,
      amountTTC: 7800,
      vatRate: 20,
      status: "SIGNED",
      sentAt: new Date(now.getTime() - 15 * 24 * 3600 * 1000),
      validUntil: new Date(now.getTime() + 15 * 24 * 3600 * 1000),
      amountReceived: 6500,
      receivedAt: new Date(now.getTime() - 3 * 24 * 3600 * 1000),
      operatorComment: "Félicitations Jean, super travail !",
      operatorId: op1.id,
      prospectId: createdProspects["Cabinet Juridique Moreau"],
    },
    {
      quoteNumber: "DEV-202507-0002",
      clientName: "Agence Immobilière Horizon",
      service: "Application web — gestion portefeuille immobilier",
      amountHT: 8200,
      amountTTC: 9840,
      vatRate: 20,
      status: "WAITING_RESPONSE",
      sentAt: new Date(now.getTime() - 5 * 24 * 3600 * 1000),
      validUntil: new Date(now.getTime() + 25 * 24 * 3600 * 1000),
      operatorComment: "Mme Bertrand est très motivée, suivi à faire mercredi.",
      operatorId: op2.id,
      prospectId: createdProspects["Agence Immobilière Horizon"],
    },
    {
      quoteNumber: "DEV-202506-0005",
      clientName: "Restaurant Le Soleil d'Or",
      service: "Site vitrine + réservation en ligne",
      amountHT: 2800,
      amountTTC: 3360,
      vatRate: 20,
      status: "FULLY_PAID",
      sentAt: new Date(now.getTime() - 45 * 24 * 3600 * 1000),
      amountReceived: 2800,
      receivedAt: new Date(now.getTime() - 20 * 24 * 3600 * 1000),
      operatorId: op2.id,
    },
  ];

  for (const q of quotesData) {
    const existing = await prisma.quote.findFirst({ where: { quoteNumber: q.quoteNumber } });
    if (!existing) {
      const { prospectId, ...rest } = q;
      const quote = await prisma.quote.create({
        data: {
          ...rest,
          status: rest.status as any,
          prospectId: prospectId || null,
        },
      });

      const baseAmount = q.amountReceived || q.amountHT;
      const rate = q.operatorId === op1.id ? 30 : 32;
      const commStatus = q.status === "FULLY_PAID" ? "PAID" :
        q.status === "SIGNED" ? "TO_VALIDATE" : "ESTIMATION";

      await prisma.commission.create({
        data: {
          quoteId: quote.id,
          operatorId: q.operatorId,
          baseAmount,
          rate,
          amount: baseAmount * (rate / 100),
          status: commStatus as any,
          paidAt: commStatus === "PAID" ? new Date(now.getTime() - 19 * 24 * 3600 * 1000) : null,
        },
      });
    }
  }
  console.log("✅ Devis et commissions créés");

  // ─── Notifications ────────────────────────────────────────
  const notifData = [
    {
      userId: op1.id,
      type: "QUOTE_SIGNED",
      title: "Devis signé !",
      message: "Le devis pour le Cabinet Juridique Moreau a été signé. Félicitations !",
      link: "/operator/quotes",
      isRead: false,
    },
    {
      userId: op1.id,
      type: "COMMISSION_VALIDATED",
      title: "Commission à valider",
      message: "Votre commission de 1 950 € pour le Cabinet Juridique Moreau est en attente de validation.",
      link: "/operator/commissions",
      isRead: false,
    },
    {
      userId: op2.id,
      type: "COMMISSION_PAID",
      title: "Commission payée !",
      message: "Votre commission de 896 € pour le Restaurant Le Soleil d'Or a été virée.",
      link: "/operator/commissions",
      isRead: true,
    },
    {
      userId: op2.id,
      type: "RECALL_TODAY",
      title: "Rappel prévu aujourd'hui",
      message: "Vous avez un rappel prévu avec Boutique Mode Élégance.",
      link: "/operator/calls?filter=TO_CALLBACK",
      isRead: false,
    },
    {
      userId: op1.id,
      type: "NEW_DOCUMENT",
      title: "Nouveau document disponible",
      message: "Manuel utilisateur du CRM DeaX vient d'être publié.",
      link: "/operator/documents",
      isRead: false,
    },
  ];

  for (const n of notifData) {
    const existing = await prisma.notification.findFirst({
      where: { userId: n.userId, title: n.title },
    });
    if (!existing) {
      await prisma.notification.create({ data: n as any });
    }
  }

  // ─── Paramètres ───────────────────────────────────────────
  const settingsData = [
    { key: "app_name", value: "DeaX CRM", group: "general", label: "Nom de l'application" },
    { key: "company_name", value: "DeaX", group: "general", label: "Nom de la société" },
    { key: "company_email", value: "contact@deax.fr", group: "general", label: "Email de contact" },
    { key: "company_phone", value: "01 00 00 00 00", group: "general", label: "Téléphone" },
    { key: "default_commission_rate", value: "30", group: "commission", label: "Taux de commission par défaut (%)" },
    { key: "payment_delay_hours", value: "24", group: "commission", label: "Délai de paiement (heures)" },
    { key: "ranking_enabled", value: "true", group: "ranking", label: "Activer le classement" },
    { key: "ranking_show_amounts", value: "false", group: "ranking", label: "Afficher les montants dans le classement" },
    { key: "email_notifications", value: "false", group: "notifications", label: "Notifications par email" },
    { key: "session_duration_hours", value: "8", group: "security", label: "Durée de session (heures)" },
    { key: "max_login_attempts", value: "5", group: "security", label: "Tentatives de connexion max" },
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log("✅ Paramètres créés");

  // ─── Page de contenu ──────────────────────────────────────
  const pages = [
    {
      slug: "home",
      title: "Bienvenue chez DeaX",
      subtitle: "Votre plateforme de prospection",
      content: "Bienvenue sur votre espace opérateur DeaX. Ici, vous pouvez gérer vos appels, suivre vos prospects, consulter vos devis et vos commissions. En cas de question, consultez la FAQ ou contactez le support.",
      status: "PUBLISHED",
    },
    {
      slug: "comment-commencer",
      title: "Comment commencer",
      subtitle: "Vos premiers pas en tant qu'opérateur",
      content: "1. Consultez le guide de prospection dans la bibliothèque de documents\n2. Familiarisez-vous avec les scripts d'appel\n3. Enregistrez votre premier appel dans 'Mes appels'\n4. En cas de prospect intéressé, transmettez les informations à l'administrateur pour création d'un devis",
      status: "PUBLISHED",
    },
    {
      slug: "conditions-programme",
      title: "Conditions du programme partenaire",
      subtitle: "Règles et fonctionnement",
      content: "Commission standard : 30% du montant HT encaissé\nPaiement : dans les 24h suivant l'encaissement final\nAucun quota minimum d'appels\nRémunération uniquement sur ventes encaissées\nToute modification importante est tracée\nLes PDF de formation sont accessibles 24h/24",
      status: "PUBLISHED",
    },
  ];

  for (const p of pages) {
    await prisma.pageContent.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, status: p.status as any },
    });
  }

  console.log("\n✅ Seeding terminé avec succès !\n");
  console.log("═══════════════════════════════════════════");
  console.log("  COMPTES DE DÉMONSTRATION");
  console.log("═══════════════════════════════════════════");
  console.log("  ADMINISTRATEUR");
  console.log("  Identifiant : admin");
  console.log("  Mot de passe : Admin@2024!");
  console.log("───────────────────────────────────────────");
  console.log("  OPÉRATEUR 1");
  console.log("  Identifiant : jean.dupont");
  console.log("  Mot de passe : Operateur@1!");
  console.log("───────────────────────────────────────────");
  console.log("  OPÉRATEUR 2");
  console.log("  Identifiant : marie.martin");
  console.log("  Mot de passe : Operateur@2!");
  console.log("───────────────────────────────────────────");
  console.log("  OPÉRATEUR 3 (doit changer mot de passe)");
  console.log("  Identifiant : thomas.bernard");
  console.log("  Mot de passe : Operateur@3!");
  console.log("═══════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
