import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const call = await prisma.call.findFirst({
    where: {
      id,
      ...(session.user.role === "OPERATOR" ? { operatorId: session.user.id } : {}),
    },
    include: {
      prospect: true,
      editHistory: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!call) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(call);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const call = await prisma.call.findFirst({
    where: {
      id,
      ...(session.user.role === "OPERATOR" ? { operatorId: session.user.id } : {}),
    },
  });

  if (!call) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (call.isLocked && session.user.role === "OPERATOR") {
    return NextResponse.json({ error: "Ce dossier est verrouillé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updated = await prisma.call.update({
      where: { id },
      data: {
        ...body,
        callbackDate: body.callbackDate ? new Date(body.callbackDate) : null,
        updatedAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "Call",
        entityId: id,
        description: `Appel modifié pour ${call.companyName}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
