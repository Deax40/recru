import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const SCRIPTS = [
  {
    id: "introduction",
    title: "Script d'introduction — Prise de contact",
    content: `« Bonjour, je suis [votre prénom] de DeaX, une agence web spécialisée dans la transformation digitale des entreprises de votre secteur. Je vous contacte car nous travaillons avec plusieurs entreprises dans [secteur] et je souhaitais vous présenter comment nous les aidons à développer leur présence en ligne.

Est-ce que vous avez 2 minutes pour que je vous explique notre approche ? »`,
  },
  {
    id: "decouverte",
    title: "Script de découverte des besoins",
    content: `Après l'introduction :

« Actuellement, est-ce que vous avez un site web ? » (Si non) « Et comment est-ce que vos clients vous trouvent aujourd'hui ? »

« Est-ce que vous recevez des demandes ou des commandes en ligne en ce moment ? »

« Qu'est-ce qui serait pour vous la chose la plus utile qu'un site web pourrait faire pour votre activité ? »

« Si vous aviez un outil digital idéal, à quoi est-ce qu'il ressemblerait ? »`,
  },
  {
    id: "interessé",
    title: "Script pour prospect intéressé",
    content: `Quand le prospect montre de l'intérêt :

« Super ! Je vais noter vos besoins et les transmettre à notre équipe technique pour qu'ils préparent une proposition adaptée.

Est-ce que je peux vous envoyer une présentation par email ? Quelle est votre adresse ?

Et est-ce que vous seriez disponible la semaine prochaine pour un rendez-vous de 30 minutes avec notre expert pour voir concrètement comment on peut vous aider ? »`,
  },
  {
    id: "rdv",
    title: "Script pour planifier un RDV",
    content: `« Excellent ! Quand seriez-vous disponible la semaine prochaine ? Mardi ou jeudi, matin ou après-midi ?

Je vous envoie une invitation et une confirmation par email. Pouvez-vous me confirmer votre email ?

Notre expert [prénom du responsable] vous contactera directement pour ce rendez-vous. En attendant, si vous avez des questions, n'hésitez pas à me contacter au [votre numéro]. »`,
  },
];

export default async function ScriptsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") redirect("/login");

  return (
    <>
      <DashboardHeader title="Scripts d'appel" role="OPERATOR" />
      <PageContent>
        <div className="max-w-3xl space-y-4">
          <p className="text-sm text-muted-foreground">
            Ces scripts sont des guides — adaptez-les à votre style naturel. L'authenticité est plus importante que la perfection du script.
          </p>
          <Accordion multiple className="space-y-3">
            {SCRIPTS.map((script) => (
              <Card key={script.id} className="overflow-hidden">
                <AccordionItem value={script.id} className="border-0">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <span className="font-semibold text-left">{script.title}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="pt-0 pb-5">
                      <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed font-mono">
                          {script.content}
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
