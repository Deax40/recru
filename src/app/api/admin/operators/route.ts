import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  identifier: z.string().min(3).regex(/^[a-zA-Z0-9._-]+$/),
  email: z.string().email().optional().or(z.literal("")).or(z.null()),
  phone: z.string().optional(),
  temporaryPassword: z.string().min(8),
  commissionRate: z.number().min(0).max(100).default(30),
  mustChangePassword: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existingIdentifier = await prisma.user.findUnique({
      where: { identifier: data.identifier },
    });
    if (existingIdentifier) {
      return NextResponse.json({ error: "Cet identifiant est déjà utilisé" }, { status: 400 });
    }

    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(data.temporaryPassword, 12);

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        identifier: data.identifier,
        email: data.email || null,
        phone: data.phone || null,
        passwordHash,
        role: "OPERATOR",
        status: "ACTIVE",
        commissionRate: data.commissionRate,
        mustChangePassword: data.mustChangePassword,
        createdById: session.user.id,
      },
      select: {
        id: true, firstName: true, lastName: true, identifier: true,
        email: true, phone: true, status: true, commissionRate: true, createdAt: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "User",
        entityId: user.id,
        description: `Opérateur créé : ${data.firstName} ${data.lastName} (@${data.identifier})`,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const operators = await prisma.user.findMany({
    where: { role: "OPERATOR" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, firstName: true, lastName: true, identifier: true,
      email: true, phone: true, status: true, commissionRate: true,
      createdAt: true, lastLoginAt: true,
    },
  });

  return NextResponse.json(operators);
}
