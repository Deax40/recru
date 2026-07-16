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

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
    },
    include: { user: true },
  });

  if (body.status === "RESOLVED") {
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        type: "SUPPORT_REPLY",
        title: "Votre ticket a été résolu",
        message: `Votre demande "${ticket.subject}" a été marquée comme résolue.`,
        link: `/operator/support/${id}`,
      },
    });
  }

  return NextResponse.json(ticket);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const message = await prisma.supportMessage.create({
    data: {
      ticketId: id,
      userId: session.user.id,
      message: body.message,
      isInternal: body.isInternal || false,
    },
  });

  if (!body.isInternal) {
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        type: "SUPPORT_REPLY",
        title: "Nouvelle réponse à votre ticket",
        message: `L'administrateur a répondu à votre demande "${ticket.subject}".`,
        link: `/operator/support/${id}`,
      },
    });
  }

  return NextResponse.json(message, { status: 201 });
}
