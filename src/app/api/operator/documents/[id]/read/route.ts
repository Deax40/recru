import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  await prisma.documentRead.upsert({
    where: { documentId_userId: { documentId: id, userId: session.user.id } },
    create: { documentId: id, userId: session.user.id, readAt: new Date() },
    update: { readAt: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "READ",
      entity: "Document",
      entityId: id,
      description: "Document consulté",
    },
  });

  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  await prisma.documentRead.upsert({
    where: { documentId_userId: { documentId: id, userId: session.user.id } },
    create: { documentId: id, userId: session.user.id, confirmed: true, confirmedAt: new Date() },
    update: { confirmed: true, confirmedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
