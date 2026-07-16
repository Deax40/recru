import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { userId, title, message, type = "INFO", link } = await req.json();

  if (!userId || !title || !message) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const notification = await prisma.notification.create({
    data: { userId, title, message, type: type as any, link: link || null },
  });

  return NextResponse.json(notification, { status: 201 });
}
