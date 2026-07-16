import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  question: z.string().min(5),
  answer: z.string().min(10),
  category: z.string().min(1),
  isPublished: z.boolean().default(true),
  order: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const data = schema.parse(body);

  const faq = await prisma.fAQ.create({
    data: {
      question: data.question,
      answer: data.answer,
      category: data.category,
      isPublished: data.isPublished,
      order: data.order || 0,
    },
  });

  return NextResponse.json(faq, { status: 201 });
}
