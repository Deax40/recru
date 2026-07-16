import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const schema = z.object({
    email: z.string().email().optional().or(z.literal("")).or(z.null()),
    phone: z.string().optional(),
  });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email: data.email || null,
        phone: data.phone || null,
      },
      select: { id: true, email: true, phone: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
