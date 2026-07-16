import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const commission = await prisma.commission.findUnique({
    where: { id },
    include: { operator: true, quote: true },
  });

  if (!commission) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (body.status !== undefined) updateData.status = body.status;
  if (body.rate !== undefined) updateData.rate = body.rate;
  if (body.amount !== undefined) updateData.amount = body.amount;
  if (body.paidAt !== undefined) updateData.paidAt = body.paidAt ? new Date(body.paidAt) : null;
  if (body.scheduledAt !== undefined) updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  if (body.comment !== undefined) updateData.comment = body.comment;

  const updated = await prisma.commission.update({
    where: { id },
    data: updateData,
  });

  // Send notification to operator when commission status changes to key statuses
  if (body.status === "VALIDATED") {
    await prisma.notification.create({
      data: {
        userId: commission.operatorId,
        type: "COMMISSION_VALIDATED",
        title: "Commission validée",
        message: `Votre commission de ${commission.amount.toFixed(2)} € pour ${commission.quote.clientName} a été validée.`,
        link: "/operator/commissions",
      },
    });
  }

  if (body.status === "PAID") {
    await prisma.notification.create({
      data: {
        userId: commission.operatorId,
        type: "COMMISSION_PAID",
        title: "Commission payée !",
        message: `Votre commission de ${(body.amount || commission.amount).toFixed(2)} € pour ${commission.quote.clientName} a été payée.`,
        link: "/operator/commissions",
      },
    });
    if (!updateData.paidAt) updateData.paidAt = new Date();
    await prisma.commission.update({ where: { id }, data: { paidAt: new Date() } });
  }

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entity: "Commission",
      entityId: id,
      description: `Commission modifiée : ${body.status || "données"} — ${commission.operator.firstName} ${commission.operator.lastName}`,
    },
  });

  return NextResponse.json(updated);
}
