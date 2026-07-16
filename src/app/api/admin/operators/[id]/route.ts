import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id, role: "OPERATOR" },
    include: {
      _count: { select: { calls: true, prospects: true, quotes: true, commissions: true } },
      loginHistory: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const { passwordHash, ...safeUser } = user;
  return NextResponse.json(safeUser);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  if (body.firstName !== undefined) updateData.firstName = body.firstName;
  if (body.lastName !== undefined) updateData.lastName = body.lastName;
  if (body.email !== undefined) updateData.email = body.email || null;
  if (body.phone !== undefined) updateData.phone = body.phone || null;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.commissionRate !== undefined) updateData.commissionRate = body.commissionRate;
  if (body.newPassword) {
    updateData.passwordHash = await bcrypt.hash(body.newPassword, 12);
    updateData.mustChangePassword = true;
    updateData.loginAttempts = 0;
    updateData.lockedUntil = null;
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, firstName: true, lastName: true, status: true },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entity: "User",
      entityId: id,
      description: `Opérateur modifié : ${body.status ? `statut → ${body.status}` : "informations"}`,
    },
  });

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id, role: "OPERATOR" } });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.user.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entity: "User",
      entityId: id,
      description: `Opérateur supprimé : ${user.firstName} ${user.lastName}`,
    },
  });

  return NextResponse.json({ success: true });
}
