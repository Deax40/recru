import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { name, description, sector, zone, isActive } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      name,
      description: description || null,
      sector: sector || null,
      zone: zone || null,
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
