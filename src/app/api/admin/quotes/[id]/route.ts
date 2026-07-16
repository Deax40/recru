import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      operator: { select: { id: true, firstName: true, lastName: true, commissionRate: true } },
      prospect: true,
      commission: true,
    },
  });

  if (!quote) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(quote);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const quote = await prisma.quote.update({
    where: { id },
    data: {
      ...(body.clientName && { clientName: body.clientName }),
      ...(body.service && { service: body.service }),
      ...(body.amountHT !== undefined && { amountHT: body.amountHT }),
      ...(body.amountTTC !== undefined && { amountTTC: body.amountTTC }),
      ...(body.status && { status: body.status }),
      ...(body.sentAt !== undefined && { sentAt: body.sentAt ? new Date(body.sentAt) : null }),
      ...(body.validUntil !== undefined && { validUntil: body.validUntil ? new Date(body.validUntil) : null }),
      ...(body.amountReceived !== undefined && { amountReceived: body.amountReceived }),
      ...(body.receivedAt !== undefined && { receivedAt: body.receivedAt ? new Date(body.receivedAt) : null }),
      ...(body.internalComment !== undefined && { internalComment: body.internalComment }),
      ...(body.operatorComment !== undefined && { operatorComment: body.operatorComment }),
    },
    include: { commission: true },
  });

  // Update commission if payment received
  if (body.amountReceived && quote.commission) {
    const commissionAmount = body.amountReceived * (quote.commission.rate / 100);
    await prisma.commission.update({
      where: { id: quote.commission.id },
      data: {
        baseAmount: body.amountReceived,
        amount: commissionAmount,
        status: "TO_VALIDATE",
      },
    });

    // Notify operator
    await prisma.notification.create({
      data: {
        userId: quote.operatorId,
        type: "PAYMENT_RECEIVED",
        title: "Paiement client reçu",
        message: `Paiement reçu pour ${quote.clientName} — votre commission sera calculée`,
        link: `/operator/commissions`,
      },
    });
  }

  // Notify on status change
  if (body.status) {
    const notifMap: Record<string, { type: string; title: string; message: string }> = {
      SIGNED: {
        type: "QUOTE_SIGNED",
        title: "Devis signé !",
        message: `Le devis pour ${quote.clientName} a été signé. Félicitations !`,
      },
      SENT: {
        type: "QUOTE_SENT",
        title: "Devis envoyé",
        message: `Le devis pour ${quote.clientName} a été envoyé au client.`,
      },
    };

    const notif = notifMap[body.status];
    if (notif) {
      await prisma.notification.create({
        data: {
          userId: quote.operatorId,
          type: notif.type as any,
          title: notif.title,
          message: notif.message,
          link: `/operator/quotes/${id}`,
        },
      });
    }
  }

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entity: "Quote",
      entityId: id,
      description: `Devis modifié : ${quote.quoteNumber}`,
    },
  });

  return NextResponse.json(quote);
}
