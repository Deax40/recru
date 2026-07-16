import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQ_CATEGORIES = [
  "Démarrage", "Prospection", "Appels", "Prospects", "Devis",
  "Commissions", "Paiements", "Utilisation du CRM",
  "Problèmes techniques", "Règles internes",
];

export default async function FAQPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const search = params.search || "";
  const category = params.category || "";

  const faqs = await prisma.fAQ.findMany({
    where: {
      isPublished: true,
      ...(search && {
        OR: [
          { question: { contains: search } },
          { answer: { contains: search } },
        ],
      }),
      ...(category && { category }),
    },
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });

  const grouped = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, typeof faqs>);

  return (
    <>
      <DashboardHeader title="FAQ" subtitle="Questions fréquentes" role={session.user.role as "ADMIN" | "OPERATOR"} />
      <PageContent>
        {faqs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-muted-foreground">Aucune question disponible</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, items]) => (
              <Card key={cat}>
                <CardContent className="p-0">
                  <div className="p-4 pb-0">
                    <h3 className="font-semibold text-base">{cat}</h3>
                  </div>
                  <Accordion multiple className="px-4 pb-2">
                    {items.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="text-sm text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContent>
    </>
  );
}
