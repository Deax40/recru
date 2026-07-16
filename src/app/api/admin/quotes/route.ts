import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQuoteNumber } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  quoteNumber: z.string().min(1),
  clientName: z.string().min(1),
  service: z.string().min(1),
  amountHT: z.number().min(0),
  amountTTC: z.number().min(0),
  vatRate: z.number().min(0).max(100),
  status: z.string(),
  sentAt: z.string().optional(),
  validUntil: z.string().optional(),
  internalComment: z.string().optional(),
  operatorComment: z.string().optional(),
  operatorId: z.string(),
  prospectId: z.string().optional(),
  commissionRate: z.number().min(0).max(100),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const commissionAmount = data.amountHT * (data.commissionRate / 100);

    const quote = await prisma.quote.create({
      data: {
        quoteNumber: data.quoteNumber || generateQuoteNumber(),
        clientName: data.clientName,
        service: data.service,
        amountHT: data.amountHT,
        amountTTC: data.amountTTC,
        vatRate: data.vatRate,
        status: data.status as any,
        sentAt: data.sentAt ? new Date(data.sentAt) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        internalComment: data.internalComment,
        operatorComment: data.operatorComment,
        operatorId: data.operatorId,
        prospectId: data.prospectId || null,
        commission: {
          create: {
            operatorId: data.operatorId,
            baseAmount: data.amountHT,
            rate: data.commissionRate,
            amount: commissionAmount,
            status: "ESTIMATION",
          },
        },
      },
      include: { commission: true },
    });

    // Notify operator
    await prisma.notification.create({
      data: {
        userId: data.operatorId,
        type: "QUOTE_CREATED",
        title: "Nouveau devis créé",
        message: `Un devis a été créé pour ${data.clientName} — ${data.service}`,
        link: `/operator/quotes/${quote.id}`,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Quote",
        entityId: quote.id,
        description: `Devis créé : ${data.quoteNumber} pour ${data.clientName}`,
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
