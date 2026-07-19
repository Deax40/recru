-- ============================================================
-- DeaX CRM — Import complet pour Neon PostgreSQL
-- Importer via : Neon Dashboard → SQL Editor → coller et exécuter
-- ============================================================

-- Enums
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_PASSWORD_CHANGE');
CREATE TYPE "CallStatus" AS ENUM ('TO_CALL', 'CALLED', 'NO_ANSWER', 'WRONG_NUMBER', 'TO_CALLBACK', 'NOT_INTERESTED', 'INTERESTED', 'MEETING_SCHEDULED', 'QUOTE_REQUESTED', 'QUOTE_IN_PROGRESS', 'QUOTE_SENT', 'QUOTE_SIGNED', 'QUOTE_REFUSED', 'LOST_CLIENT', 'FINALIZED_CLIENT');
CREATE TYPE "ProspectStatus" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'MEETING_SCHEDULED', 'QUOTE_SENT', 'CLIENT', 'LOST', 'ARCHIVED');
CREATE TYPE "QuoteStatus" AS ENUM ('INFO_TO_COMPLETE', 'IN_PREPARATION', 'SENT', 'WAITING_RESPONSE', 'FOLLOW_UP_NEEDED', 'ACCEPTED', 'SIGNED', 'DEPOSIT_RECEIVED', 'PARTIALLY_PAID', 'FULLY_PAID', 'REFUSED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "CommissionStatus" AS ENUM ('ESTIMATION', 'WAITING_SIGNATURE', 'WAITING_PAYMENT', 'TO_VALIDATE', 'VALIDATED', 'PAYMENT_SCHEDULED', 'PAID', 'CANCELLED', 'SUSPENDED');
CREATE TYPE "NotificationType" AS ENUM ('NEW_PROSPECT', 'RECALL_TODAY', 'QUOTE_CREATED', 'QUOTE_SENT', 'QUOTE_SIGNED', 'PAYMENT_RECEIVED', 'COMMISSION_VALIDATED', 'COMMISSION_PAID', 'NEW_DOCUMENT', 'MANDATORY_DOCUMENT', 'ADMIN_MESSAGE', 'ACCOUNT_WARNING', 'IMPORTANT_INFO', 'SUPPORT_REPLY', 'NEW_ATTRIBUTION');
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED');
CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "DocumentStatus" AS ENUM ('PUBLISHED', 'DRAFT', 'ARCHIVED');
CREATE TYPE "ContentStatus" AS ENUM ('PUBLISHED', 'DRAFT', 'SCHEDULED', 'ARCHIVED');
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- Tables
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_identifier_key" ON "User"("identifier");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_status_idx" ON "User"("status");

CREATE TABLE "LoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LoginHistory_userId_idx" ON "LoginHistory"("userId");

CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sector" TEXT,
    "zone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "sector" TEXT,
    "city" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'France',
    "status" "ProspectStatus" NOT NULL DEFAULT 'NEW',
    "urgencyLevel" TEXT,
    "estimatedBudget" DOUBLE PRECISION,
    "serviceNeeded" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "isAnonymized" BOOLEAN NOT NULL DEFAULT false,
    "nextFollowUp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operatorId" TEXT,
    "campaignId" TEXT,
    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Prospect_operatorId_idx" ON "Prospect"("operatorId");
CREATE INDEX "Prospect_status_idx" ON "Prospect"("status");
CREATE INDEX "Prospect_companyName_idx" ON "Prospect"("companyName");

CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "callDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "sector" TEXT,
    "city" TEXT,
    "website" TEXT,
    "source" TEXT,
    "serviceNeeded" TEXT,
    "callSummary" TEXT,
    "interestLevel" INTEGER,
    "status" "CallStatus" NOT NULL DEFAULT 'CALLED',
    "nextAction" TEXT,
    "callbackDate" TIMESTAMP(3),
    "comments" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operatorId" TEXT NOT NULL,
    "prospectId" TEXT,
    "campaignId" TEXT,
    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Call_operatorId_idx" ON "Call"("operatorId");
CREATE INDEX "Call_status_idx" ON "Call"("status");
CREATE INDEX "Call_callDate_idx" ON "Call"("callDate");

CREATE TABLE "CallEditHistory" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "editedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CallEditHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Assignment_prospectId_operatorId_key" ON "Assignment"("prospectId", "operatorId");

CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "amountHT" DOUBLE PRECISION NOT NULL,
    "amountTTC" DOUBLE PRECISION NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "status" "QuoteStatus" NOT NULL DEFAULT 'IN_PREPARATION',
    "sentAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "amountReceived" DOUBLE PRECISION,
    "receivedAt" TIMESTAMP(3),
    "internalComment" TEXT,
    "operatorComment" TEXT,
    "pdfPath" TEXT,
    "invoicePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operatorId" TEXT NOT NULL,
    "prospectId" TEXT,
    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");
CREATE INDEX "Quote_operatorId_idx" ON "Quote"("operatorId");
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "baseAmount" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'ESTIMATION',
    "scheduledAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Commission_quoteId_key" ON "Commission"("quoteId");
CREATE INDEX "Commission_operatorId_idx" ON "Commission"("operatorId");
CREATE INDEX "Commission_status_idx" ON "Commission"("status");

CREATE TABLE "DocumentCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DocumentCategory_slug_key" ON "DocumentCategory"("slug");

CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" "DocumentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "updatedFileAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoryId" TEXT,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentRead" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    CONSTRAINT "DocumentRead_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DocumentRead_documentId_userId_key" ON "DocumentRead"("documentId", "userId");

CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "priority" "SupportPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "prospectId" TEXT,
    "quoteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "callId" TEXT,
    "prospectId" TEXT,
    "quoteId" TEXT,
    "ticketId" TEXT,
    "messageId" TEXT,
    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PageContent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "content" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "scheduledAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PageContent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PageContent_slug_key" ON "PageContent"("slug");

CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'general',
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX "ActivityLog_entity_idx" ON "ActivityLog"("entity");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "errorReport" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Call" ADD CONSTRAINT "Call_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Call" ADD CONSTRAINT "Call_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Call" ADD CONSTRAINT "Call_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CallEditHistory" ADD CONSTRAINT "CallEditHistory_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DocumentCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentRead" ADD CONSTRAINT "DocumentRead_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentRead" ADD CONSTRAINT "DocumentRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "SupportMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- DONNÉES DE DÉMONSTRATION
-- ============================================================

-- Utilisateurs
INSERT INTO "User" ("id","identifier","email","phone","firstName","lastName","passwordHash","role","status","mustChangePassword","commissionRate","createdAt","updatedAt") VALUES
('cgf6mcfrmrr6sagi7qg','admin','admin@deax.fr','06 10 00 00 00','Laurent','Moreau','$2b$12$E8kq1J16vfnUfeWKNDuqL.NPHJ1bFaR2iFEFFsHg5bhPqiMV8wecm','ADMIN','ACTIVE',false,0,NOW(),NOW()),
('c2ylqak5mrr6sagiweo','jean.dupont','jean.dupont@exemple.fr','06 20 30 40 50','Jean','Dupont','$2b$12$v5RUGdo6E/CTaYrPhHviX.x70AmpCo6opK4DN1UHHsEUJ68zGl0bS','OPERATOR','ACTIVE',false,30,NOW(),NOW()),
('cre9sp88mrr6sagiqhs','marie.martin','marie.martin@exemple.fr','06 60 70 80 90','Marie','Martin','$2b$12$HWfDvyNrYcFEQD8Uive5FuIMlts4L/BXT4PnDkjgpl/PugLdyLHOW','OPERATOR','ACTIVE',false,32,NOW(),NOW()),
('c7uajw5omrr6sagipsw','thomas.bernard','thomas.bernard@exemple.fr','06 11 22 33 44','Thomas','Bernard','$2b$12$rY1rmLeW4cBZpMUW7sIYvu.kw2Dy/CPnYf/umVvAzh8ihIwotPYfK','OPERATOR','ACTIVE',true,28,NOW(),NOW()),
('cibch6r4mrr6sagiysa','sophie.leroy','sophie.leroy@exemple.fr','06 55 66 77 88','Sophie','Leroy','$2b$12$SDeKgiI3mgdUaFXn5cRZqu2B5ZlnZmrY.J3.HB82KS0EHN6.6Krb2','OPERATOR','SUSPENDED',false,30,NOW(),NOW());

UPDATE "User" SET "createdById" = 'cgf6mcfrmrr6sagi7qg' WHERE "id" IN ('c2ylqak5mrr6sagiweo','cre9sp88mrr6sagiqhs','c7uajw5omrr6sagipsw','cibch6r4mrr6sagiysa');

-- Campagne
INSERT INTO "Campaign" ("id","name","description","sector","zone","isActive","createdAt","updatedAt") VALUES
('ci8bnk3imrr6sagikjv','Campagne Restauration Île-de-France','Prospection restaurants et hôtels en IDF','Restauration & Alimentation','Île-de-France',true,NOW(),NOW());

-- Prospects
INSERT INTO "Prospect" ("id","companyName","contactName","email","phone","sector","city","website","status","serviceNeeded","operatorId","createdAt","updatedAt") VALUES
('cv9yp0i7mrr6sagiiyf','Restaurant Le Provençal','Michel Blanc','contact@leprovencal.fr','01 42 00 00 01','Restauration & Alimentation','Paris 11e','www.leprovencal.fr','INTERESTED','Site e-commerce','c2ylqak5mrr6sagiweo',NOW(),NOW()),
('cz1ggu1bmrr6sagilrm','Plomberie Dupuis','Henri Dupuis',NULL,'01 43 00 00 02','BTP & Construction','Vincennes',NULL,'MEETING_SCHEDULED','Site vitrine','c2ylqak5mrr6sagiweo',NOW(),NOW()),
('cbjh6r5fmrr6sagitar','Cabinet Juridique Moreau','Maître Sophie Moreau','contact@moreau-avocats.fr','01 44 00 00 03','Services aux entreprises','Paris 8e',NULL,'QUOTE_SENT','CRM sur mesure','c2ylqak5mrr6sagiweo',NOW(),NOW()),
('cg4v596xmrr6sagiiyo','Boutique Mode Élégance','Isabelle Fontaine','isabelle@mode-elegance.fr','01 45 00 00 04','Mode & Beauté','Boulogne-Billancourt',NULL,'NEW','Site e-commerce','cre9sp88mrr6sagiqhs',NOW(),NOW()),
('c72pt2xymrr6sagid1e','Garage Auto Prestige','Frédéric Noir',NULL,'01 46 00 00 05','Commerce & Distribution','Versailles',NULL,'CONTACTED','Site vitrine','cre9sp88mrr6sagiqhs',NOW(),NOW()),
('ctr2kd2umrr6sagif6y','Agence Immobilière Horizon','Claire Bertrand','c.bertrand@horizon-immo.fr','01 47 00 00 06','Immobilier','Neuilly-sur-Seine',NULL,'INTERESTED','Application web','cre9sp88mrr6sagiqhs',NOW(),NOW());

-- Appels
INSERT INTO "Call" ("id","companyName","contactName","phone","sector","city","status","interestLevel","callSummary","callDate","operatorId","prospectId","createdAt","updatedAt") VALUES
('clc9q17pmrr6sagi4a1','Restaurant Le Provençal','Michel Blanc','01 42 00 00 01','Restauration & Alimentation','Paris 11e','INTERESTED',4,'M. Blanc est très intéressé par un site avec commande en ligne. Il souhaite en discuter plus en détail. RDV la semaine prochaine.',NOW() - INTERVAL '2 days','c2ylqak5mrr6sagiweo','cv9yp0i7mrr6sagiiyf',NOW(),NOW()),
('cyp1bngqmrr6sagik6u','Plomberie Dupuis','Henri Dupuis','01 43 00 00 02','BTP & Construction','Vincennes','MEETING_SCHEDULED',5,'Henri est très motivé. Son site actuel est une vieille page HTML de 2010. RDV mercredi à 14h pour présentation.',NOW() - INTERVAL '1 day','c2ylqak5mrr6sagiweo','cz1ggu1bmrr6sagilrm',NOW(),NOW()),
('clsms3j1mrr6sagi1f7','Brasserie des Arts','Jean-Claude Petit','01 48 00 00 07','Restauration & Alimentation','Montmartre','NOT_INTERESTED',1,'Pas intéressé, vient de refaire son site avec un prestataire local.',NOW() - INTERVAL '3 days','c2ylqak5mrr6sagiweo',NULL,NOW(),NOW()),
('cy7lgqj8mrr6sagigv4','Boutique Mode Élégance','Isabelle Fontaine','01 45 00 00 04','Mode & Beauté',NULL,'TO_CALLBACK',3,'Intéressée mais en déplacement. Rappeler jeudi matin.',NOW() - INTERVAL '12 hours','cre9sp88mrr6sagiqhs','cg4v596xmrr6sagiiyo',NOW(),NOW()),
('cz484nhmmrr6sagifrs','Agence Immobilière Horizon','Claire Bertrand','01 47 00 00 06','Immobilier',NULL,'QUOTE_REQUESTED',5,'Claire a besoin d''une application pour gérer son portefeuille de biens. Budget autour de 8000€. Très motivée.',NOW() - INTERVAL '5 days','cre9sp88mrr6sagiqhs','ctr2kd2umrr6sagif6y',NOW(),NOW()),
('clryxytimrr6sagijsx','Taxi Martin','Éric Martin','06 12 34 56 78','Transport & Logistique','Montreuil','NO_ANSWER',NULL,NULL,NOW() - INTERVAL '6 hours','cre9sp88mrr6sagiqhs',NULL,NOW(),NOW());

-- Devis
INSERT INTO "Quote" ("id","quoteNumber","clientName","service","amountHT","amountTTC","vatRate","status","sentAt","validUntil","amountReceived","receivedAt","operatorComment","operatorId","prospectId","createdAt","updatedAt") VALUES
('cylwgceomrr6sagi66z','DEV-202507-0001','Cabinet Juridique Moreau','CRM sur mesure — gestion dossiers clients',6500,7800,20,'SIGNED',NOW() - INTERVAL '15 days',NOW() + INTERVAL '15 days',6500,NOW() - INTERVAL '3 days','Félicitations Jean, super travail !','c2ylqak5mrr6sagiweo','cbjh6r5fmrr6sagitar',NOW(),NOW()),
('c3kjj8w9mrr6sagi72y','DEV-202507-0002','Agence Immobilière Horizon','Application web — gestion portefeuille immobilier',8200,9840,20,'WAITING_RESPONSE',NOW() - INTERVAL '5 days',NOW() + INTERVAL '25 days',NULL,NULL,'Mme Bertrand est très motivée, suivi à faire mercredi.','cre9sp88mrr6sagiqhs','ctr2kd2umrr6sagif6y',NOW(),NOW()),
('cosw0hdymrr6sagiw3i','DEV-202506-0005','Restaurant Le Soleil d''Or','Site vitrine + réservation en ligne',2800,3360,20,'FULLY_PAID',NOW() - INTERVAL '45 days',NULL,2800,NOW() - INTERVAL '20 days',NULL,'cre9sp88mrr6sagiqhs',NULL,NOW(),NOW());

-- Commissions
INSERT INTO "Commission" ("id","quoteId","operatorId","baseAmount","rate","amount","status","paidAt","createdAt","updatedAt") VALUES
('cdx55dlgmrr6sagiv4d','cylwgceomrr6sagi66z','c2ylqak5mrr6sagiweo',6500,30,1950,'TO_VALIDATE',NULL,NOW(),NOW()),
('cb5qb7jomrr6sagigj0','c3kjj8w9mrr6sagi72y','cre9sp88mrr6sagiqhs',8200,32,2624,'ESTIMATION',NULL,NOW(),NOW()),
('ce8nvnddmrr6sagiczw','cosw0hdymrr6sagiw3i','cre9sp88mrr6sagiqhs',2800,32,896,'PAID',NOW() - INTERVAL '19 days',NOW(),NOW());

-- Catégories de documents
INSERT INTO "DocumentCategory" ("id","name","slug","order","createdAt") VALUES
(gen_random_uuid()::text,'Présentation de DeaX','presentation',1,NOW()),
(gen_random_uuid()::text,'Services DeaX','services',2,NOW()),
(gen_random_uuid()::text,'Comprendre les besoins','besoins',3,NOW()),
(gen_random_uuid()::text,'Guide de prospection','guide-prospection',4,NOW()),
(gen_random_uuid()::text,'Scripts d''appel','scripts',5,NOW()),
(gen_random_uuid()::text,'Réponses aux objections','objections',6,NOW()),
(gen_random_uuid()::text,'Utilisation du CRM','crm',7,NOW()),
(gen_random_uuid()::text,'Fonctionnement des commissions','commissions',8,NOW()),
(gen_random_uuid()::text,'Charte qualité','qualite',9,NOW()),
(gen_random_uuid()::text,'Bonnes pratiques','bonnes-pratiques',10,NOW()),
(gen_random_uuid()::text,'Règles RGPD','rgpd',11,NOW()),
(gen_random_uuid()::text,'Documents administratifs','admin-docs',12,NOW()),
(gen_random_uuid()::text,'Catalogue des prestations','catalogue',13,NOW());

-- Documents
INSERT INTO "Document" ("id","title","description","version","status","isMandatory","publishedAt","categoryId","createdAt","updatedAt") VALUES
(gen_random_uuid()::text,'Présentation DeaX — Qui sommes-nous ?','Découvrez DeaX, notre histoire, nos valeurs et nos expertises.','2.1','PUBLISHED',true,NOW(),(SELECT id FROM "DocumentCategory" WHERE slug='presentation'),NOW(),NOW()),
(gen_random_uuid()::text,'Catalogue complet des prestations','Tous nos services avec descriptions et tarifs indicatifs.','3.0','PUBLISHED',true,NOW(),(SELECT id FROM "DocumentCategory" WHERE slug='catalogue'),NOW(),NOW()),
(gen_random_uuid()::text,'Guide du parfait prospecteur','Méthodes et conseils pour réussir vos appels commerciaux.','1.5','PUBLISHED',false,NOW(),(SELECT id FROM "DocumentCategory" WHERE slug='guide-prospection'),NOW(),NOW()),
(gen_random_uuid()::text,'Script d''appel — Prise de contact','Script complet pour la première prise de contact avec un prospect.','1.2','PUBLISHED',false,NOW(),(SELECT id FROM "DocumentCategory" WHERE slug='scripts'),NOW(),NOW()),
(gen_random_uuid()::text,'Réponses aux 30 objections les plus courantes','Guide pratique pour surmonter les refus et objections.','2.0','PUBLISHED',false,NOW(),(SELECT id FROM "DocumentCategory" WHERE slug='objections'),NOW(),NOW()),
(gen_random_uuid()::text,'Manuel utilisateur du CRM DeaX','Guide complet d''utilisation de la plateforme.','1.0','PUBLISHED',true,NOW(),(SELECT id FROM "DocumentCategory" WHERE slug='crm'),NOW(),NOW()),
(gen_random_uuid()::text,'Comprendre le système de commissions','Explication détaillée du calcul et versement des commissions.','1.3','PUBLISHED',true,NOW(),(SELECT id FROM "DocumentCategory" WHERE slug='commissions'),NOW(),NOW()),
(gen_random_uuid()::text,'Règles RGPD pour les opérateurs','Obligations légales et bonnes pratiques en matière de données personnelles.','1.1','PUBLISHED',true,NOW(),(SELECT id FROM "DocumentCategory" WHERE slug='rgpd'),NOW(),NOW());

-- FAQ
INSERT INTO "FAQ" ("id","question","answer","category","order","isPublished","createdAt","updatedAt") VALUES
(gen_random_uuid()::text,'Comment créer mon premier appel ?','Rendez-vous dans ''Mes appels'' puis cliquez sur ''Nouvel appel''. Remplissez les informations du contact, choisissez le statut et enregistrez.','Démarrage',1,true,NOW(),NOW()),
(gen_random_uuid()::text,'Qu''est-ce qu''un prospect ?','Un prospect est une entreprise ou un contact qui a montré un intérêt pour les services DeaX.','Démarrage',2,true,NOW(),NOW()),
(gen_random_uuid()::text,'Que faire si le numéro est incorrect ?','Sélectionnez le statut ''Numéro incorrect'' lors de l''enregistrement de l''appel.','Appels',1,true,NOW(),NOW()),
(gen_random_uuid()::text,'Quand est-ce que ma commission est payée ?','Votre commission est payée dans les 24 heures suivant la réception du paiement intégral du client par DeaX.','Commissions',1,true,NOW(),NOW()),
(gen_random_uuid()::text,'Comment est calculée ma commission ?','Votre commission est calculée sur le montant HT encaissé, multiplié par votre taux (par défaut 30%). Exemple : devis de 2000€ HT → commission = 600€.','Commissions',2,true,NOW(),NOW()),
(gen_random_uuid()::text,'Puis-je créer un devis moi-même ?','Non, vous transmettez les informations à l''administrateur qui crée le devis officiel.','Devis',1,true,NOW(),NOW()),
(gen_random_uuid()::text,'Puis-je modifier un appel après l''avoir enregistré ?','Oui, tant que le dossier n''est pas verrouillé par l''administrateur.','Utilisation du CRM',1,true,NOW(),NOW()),
(gen_random_uuid()::text,'Y a-t-il un quota minimum d''appels à réaliser ?','Non, il n''y a aucun quota minimum. Votre rémunération dépend uniquement des ventes encaissées.','Règles internes',1,true,NOW(),NOW());

-- Notifications
INSERT INTO "Notification" ("id","userId","type","title","message","link","isRead","createdAt") VALUES
(gen_random_uuid()::text,'c2ylqak5mrr6sagiweo','QUOTE_SIGNED','Devis signé !','Le devis pour le Cabinet Juridique Moreau a été signé. Félicitations !','/operator/quotes',false,NOW()),
(gen_random_uuid()::text,'c2ylqak5mrr6sagiweo','COMMISSION_VALIDATED','Commission à valider','Votre commission de 1 950 € pour le Cabinet Juridique Moreau est en attente de validation.','/operator/commissions',false,NOW()),
(gen_random_uuid()::text,'cre9sp88mrr6sagiqhs','COMMISSION_PAID','Commission payée !','Votre commission de 896 € pour le Restaurant Le Soleil d''Or a été virée.','/operator/commissions',true,NOW()),
(gen_random_uuid()::text,'cre9sp88mrr6sagiqhs','RECALL_TODAY','Rappel prévu aujourd''hui','Vous avez un rappel prévu avec Boutique Mode Élégance.','/operator/calls?filter=TO_CALLBACK',false,NOW()),
(gen_random_uuid()::text,'c2ylqak5mrr6sagiweo','NEW_DOCUMENT','Nouveau document disponible','Manuel utilisateur du CRM DeaX vient d''être publié.','/operator/documents',false,NOW());

-- Paramètres
INSERT INTO "Setting" ("id","key","value","group","label","createdAt","updatedAt") VALUES
(gen_random_uuid()::text,'app_name','DeaX CRM','general','Nom de l''application',NOW(),NOW()),
(gen_random_uuid()::text,'company_name','DeaX','general','Nom de la société',NOW(),NOW()),
(gen_random_uuid()::text,'company_email','contact@deax.fr','general','Email de contact',NOW(),NOW()),
(gen_random_uuid()::text,'company_phone','01 00 00 00 00','general','Téléphone',NOW(),NOW()),
(gen_random_uuid()::text,'default_commission_rate','30','commission','Taux de commission par défaut (%)',NOW(),NOW()),
(gen_random_uuid()::text,'payment_delay_hours','24','commission','Délai de paiement (heures)',NOW(),NOW()),
(gen_random_uuid()::text,'ranking_enabled','true','ranking','Activer le classement',NOW(),NOW()),
(gen_random_uuid()::text,'ranking_show_amounts','false','ranking','Afficher les montants dans le classement',NOW(),NOW()),
(gen_random_uuid()::text,'email_notifications','false','notifications','Notifications par email',NOW(),NOW()),
(gen_random_uuid()::text,'session_duration_hours','8','security','Durée de session (heures)',NOW(),NOW()),
(gen_random_uuid()::text,'max_login_attempts','5','security','Tentatives de connexion max',NOW(),NOW());

-- Pages de contenu
INSERT INTO "PageContent" ("id","slug","title","subtitle","content","status","createdAt","updatedAt") VALUES
(gen_random_uuid()::text,'home','Bienvenue chez DeaX','Votre plateforme de prospection','Bienvenue sur votre espace opérateur DeaX. Ici, vous pouvez gérer vos appels, suivre vos prospects, consulter vos devis et vos commissions.','PUBLISHED',NOW(),NOW()),
(gen_random_uuid()::text,'comment-commencer','Comment commencer','Vos premiers pas en tant qu''opérateur','1. Consultez le guide de prospection dans la bibliothèque de documents
2. Familiarisez-vous avec les scripts d''appel
3. Enregistrez votre premier appel dans ''Mes appels''
4. En cas de prospect intéressé, transmettez les informations à l''administrateur','PUBLISHED',NOW(),NOW()),
(gen_random_uuid()::text,'conditions-programme','Conditions du programme partenaire','Règles et fonctionnement','Commission standard : 30% du montant HT encaissé
Paiement : dans les 24h suivant l''encaissement final
Aucun quota minimum d''appels
Rémunération uniquement sur ventes encaissées','PUBLISHED',NOW(),NOW());
