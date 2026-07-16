import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  version: z.string().default("1.0"),
  categoryId: z.string().optional(),
  isMandatory: z.boolean().default(false),
  status: z.string().default("PUBLISHED"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const data = schema.parse(body);

  const doc = await prisma.document.create({
    data: {
      title: data.title,
      description: data.description,
      version: data.version,
      categoryId: data.categoryId || null,
      isMandatory: data.isMandatory,
      status: data.status as any,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
  });

  if (data.status === "PUBLISHED") {
    const operators = await prisma.user.findMany({
      where: { role: "OPERATOR", status: "ACTIVE" },
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: operators.map(op => ({
        userId: op.id,
        type: data.isMandatory ? "MANDATORY_DOCUMENT" : "NEW_DOCUMENT",
        title: data.isMandatory ? "Document obligatoire disponible" : "Nouveau document disponible",
        message: `${data.title} est maintenant disponible dans la bibliothèque.`,
        link: "/operator/documents",
      })),
    });
  }

  return NextResponse.json(doc, { status: 201 });
}
