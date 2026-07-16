import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTicketNumber } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  category: z.string().min(1),
  subject: z.string().min(3),
  message: z.string().min(10),
  priority: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        category: data.category,
        subject: data.subject,
        priority: data.priority as any,
        userId: session.user.id,
        messages: {
          create: {
            message: data.message,
            userId: session.user.id,
          },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "SupportTicket",
        entityId: ticket.id,
        description: `Ticket support créé : ${data.subject}`,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
