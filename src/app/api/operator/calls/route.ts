import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const callSchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")).or(z.null()),
  sector: z.string().optional(),
  city: z.string().optional(),
  website: z.string().optional(),
  source: z.string().optional(),
  serviceNeeded: z.string().optional(),
  callSummary: z.string().optional(),
  interestLevel: z.number().min(1).max(5).optional(),
  status: z.string(),
  nextAction: z.string().optional(),
  callbackDate: z.string().optional(),
  comments: z.string().optional(),
  prospectId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = callSchema.parse(body);

    const call = await prisma.call.create({
      data: {
        companyName: data.companyName,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email || null,
        sector: data.sector,
        city: data.city,
        website: data.website,
        source: data.source,
        serviceNeeded: data.serviceNeeded,
        callSummary: data.callSummary,
        interestLevel: data.interestLevel,
        status: data.status as any,
        nextAction: data.nextAction,
        callbackDate: data.callbackDate ? new Date(data.callbackDate) : null,
        comments: data.comments,
        operatorId: session.user.id,
        prospectId: data.prospectId || null,
      },
    });

    // If status indicates a prospect should be created/updated
    if (["INTERESTED", "MEETING_SCHEDULED", "QUOTE_REQUESTED"].includes(data.status) && !data.prospectId) {
      await prisma.prospect.create({
        data: {
          companyName: data.companyName,
          contactName: data.contactName,
          phone: data.phone,
          email: data.email || null,
          sector: data.sector,
          city: data.city,
          website: data.website,
          source: data.source,
          serviceNeeded: data.serviceNeeded,
          operatorId: session.user.id,
          status: data.status === "INTERESTED" ? "INTERESTED" :
            data.status === "MEETING_SCHEDULED" ? "MEETING_SCHEDULED" : "CONTACTED",
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Call",
        entityId: call.id,
        description: `Appel enregistré pour ${data.companyName}`,
      },
    });

    return NextResponse.json(call, { status: 201 });
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
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const filter = searchParams.get("filter") || "";

  const where = {
    ...(session.user.role === "OPERATOR" ? { operatorId: session.user.id } : {}),
    ...(search && {
      OR: [
        { companyName: { contains: search } },
        { contactName: { contains: search } },
        { phone: { contains: search } },
      ],
    }),
    ...(filter && { status: filter as any }),
  };

  const [calls, total] = await Promise.all([
    prisma.call.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.call.count({ where }),
  ]);

  return NextResponse.json({ calls, total, page, limit });
}
