import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Lightbulb, Target, Phone } from "lucide-react";

export default async function GuidePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") redirect("/login");

  return (
    <>
      <DashboardHeader title="Guide de prospection" role="OPERATOR" />
      <PageContent>
        <div className="max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Les 5 étapes d'un appel réussi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { step: "1", title: "La préparation", desc: "Renseignez-vous sur l'entreprise avant l'appel. Visitez leur site web, comprenez leur activité et identifiez leurs besoins potentiels." },
                { step: "2", title: "La prise de contact", desc: "Présentez-vous clairement : votre nom, DeaX et l'objet de votre appel. Soyez direct et professionnel." },
                { step: "3", title: "La découverte des besoins", desc: "Posez des questions ouvertes pour comprendre les problématiques actuelles du prospect. Écoutez activement." },
                { step: "4", title: "La proposition de valeur", desc: "Expliquez comment DeaX peut répondre à leurs besoins spécifiques. Utilisez des exemples concrets." },
                { step: "5", title: "La conclusion", desc: "Proposez une suite concrète : envoi d'informations, rendez-vous de présentation ou demande de devis." },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Conseils pratiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "Appelez aux bonnes heures : entre 9h-11h30 et 14h-17h en semaine",
                  "Ne dépassez pas 5 tentatives sur le même numéro sans réponse",
                  "Notez toujours un résumé de l'appel immédiatement après",
                  "Si la personne est occupée, proposez un rappel à un moment précis",
                  "Soyez positif même face aux refus — chaque non vous rapproche d'un oui",
                  "Concentrez-vous sur un secteur à la fois pour maîtriser le discours",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-500" />
                Secteurs à prioriser
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["Restauration & Alimentation", "BTP & Construction", "Commerce & Distribution",
                  "Services aux entreprises", "Immobilier", "Santé & Bien-être",
                  "Mode & Beauté", "Artisanat"].map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Ces secteurs présentent les meilleurs taux de conversion pour les services DeaX.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}
