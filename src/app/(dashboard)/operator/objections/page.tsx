import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const OBJECTIONS = [
  {
    objection: "Je n'ai pas le temps",
    category: "Timing",
    response: `« Je comprends tout à fait — c'est exactement pour ça que je vous appelle ! Notre processus est conçu pour prendre un minimum de votre temps. On fait tout le travail technique à votre place.

Est-ce qu'on peut fixer un rendez-vous de 20 minutes à un moment qui vous convient mieux, la semaine prochaine par exemple ? »`,
  },
  {
    objection: "C'est trop cher",
    category: "Budget",
    response: `« Je vous comprends. Avant de parler budget, est-ce que vous pouvez me dire ce qui vous semble cher ?

Ce que nos clients constatent, c'est que leur site web ramène généralement 3 à 10 nouveaux clients par mois. Sur un an, c'est rentabilisé en quelques semaines. Est-ce que vous seriez intéressé par une analyse de retour sur investissement pour votre activité spécifique ? »`,
  },
  {
    objection: "J'ai déjà un site",
    category: "Concurrence",
    response: `« Très bien ! Est-ce qu'il vous ramène des clients régulièrement ?

Beaucoup de nos clients avaient déjà un site mais il ne leur rapportait pas grand-chose. On a souvent pu multiplier par 3 leur trafic et leurs contacts. Est-ce que vous seriez curieux de voir comment votre site se positionne par rapport à vos concurrents ? »`,
  },
  {
    objection: "Je dois en parler à mon associé / mon conjoint",
    category: "Décision",
    response: `« Bien sûr, c'est une décision importante à prendre ensemble. Est-ce que je peux vous envoyer une présentation par email que vous pourrez lui montrer ?

Et est-ce qu'on pourrait planifier un appel tous ensemble la semaine prochaine pour répondre à vos questions ? »`,
  },
  {
    objection: "Je n'ai pas besoin d'un site web",
    category: "Besoin",
    response: `« Je comprends cette position. Juste pour curiosité, comment est-ce que vos clients potentiels vous trouvent aujourd'hui quand ils cherchent [secteur] dans votre ville ?

De plus en plus, 80% des gens cherchent sur Google avant de contacter une entreprise. Sans présence en ligne, vous risquez de passer à côté de nombreux clients sans même le savoir. »`,
  },
  {
    objection: "Envoyez-moi un email",
    category: "Report",
    response: `« Bien sûr, je vais vous envoyer notre présentation. Pour personnaliser les informations à votre situation, est-ce que vous pouvez me dire rapidement quelle est votre principale priorité en ce moment pour votre activité ?

Et pour être sûr que vous allez bien le recevoir, quelle est votre adresse email ? »`,
  },
];

const categoryColors: Record<string, string> = {
  Timing: "bg-blue-100 text-blue-700",
  Budget: "bg-amber-100 text-amber-700",
  Concurrence: "bg-purple-100 text-purple-700",
  Décision: "bg-orange-100 text-orange-700",
  Besoin: "bg-rose-100 text-rose-700",
  Report: "bg-slate-100 text-slate-700",
};

export default async function ObjectionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") redirect("/login");

  return (
    <>
      <DashboardHeader title="Réponses aux objections" role="OPERATOR" />
      <PageContent>
        <div className="max-w-3xl space-y-4">
          <p className="text-sm text-muted-foreground">
            Les objections sont normales — elles signifient souvent que le prospect est impliqué dans la conversation. Voici comment les transformer en opportunités.
          </p>
          <Accordion multiple className="space-y-3">
            {OBJECTIONS.map((item, i) => (
              <Card key={i} className="overflow-hidden">
                <AccordionItem value={String(i)} className="border-0">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <Badge className={`${categoryColors[item.category]} border-0 text-xs shrink-0`}>
                        {item.category}
                      </Badge>
                      <span className="font-medium">« {item.objection} »</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="pt-0 pb-5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Réponse suggérée :
                      </p>
                      <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-emerald-500">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed font-mono">
                          {item.response}
                        </p>
                      </div>
                    </CardContent>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            ))}
          </Accordion>
        </div>
      </PageContent>
    </>
  );
}
