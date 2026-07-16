import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(";"),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h];
        const str = val instanceof Date ? val.toISOString() : String(val ?? "");
        return `"${str.replace(/"/g, '""')}"`;
      }).join(";")
    ),
  ];
  return lines.join("\r\n");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as "prospects" | "calls" | "commissions";
  const operatorId = searchParams.get("operatorId") || undefined;

  let csv = "";
  let filename = `deax-${type}.csv`;

  if (type === "prospects") {
    const rows = await prisma.prospect.findMany({
      where: operatorId ? { operatorId } : undefined,
      include: { operator: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    });
    csv = toCSV(rows.map((r) => ({
      entreprise: r.companyName,
      contact: r.contactName ?? "",
      email: r.email ?? "",
      telephone: r.phone ?? "",
      secteur: r.sector ?? "",
      ville: r.city ?? "",
      site_web: r.website ?? "",
      statut: r.status,
      service_souhaite: r.serviceNeeded ?? "",
      operateur: r.operator ? `${r.operator.firstName} ${r.operator.lastName}` : "",
      cree_le: r.createdAt,
    })));
  } else if (type === "calls") {
    const rows = await prisma.call.findMany({
      where: operatorId ? { operatorId } : undefined,
      include: { operator: { select: { firstName: true, lastName: true } } },
      orderBy: { callDate: "desc" },
    });
    csv = toCSV(rows.map((r) => ({
      entreprise: r.companyName,
      contact: r.contactName ?? "",
      telephone: r.phone ?? "",
      secteur: r.sector ?? "",
      ville: r.city ?? "",
      statut: r.status,
      niveau_interet: r.interestLevel ?? "",
      resume: r.callSummary?.replace(/\r?\n/g, " ") ?? "",
      service_souhaite: r.serviceNeeded ?? "",
      date_appel: r.callDate,
      date_rappel: r.callbackDate ?? "",
      operateur: r.operator ? `${r.operator.firstName} ${r.operator.lastName}` : "",
    })));
  } else if (type === "commissions") {
    const rows = await prisma.commission.findMany({
      where: operatorId ? { operatorId } : undefined,
      include: {
        operator: { select: { firstName: true, lastName: true } },
        quote: { select: { quoteNumber: true, clientName: true, amountHT: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    csv = toCSV(rows.map((r) => ({
      operateur: r.operator ? `${r.operator.firstName} ${r.operator.lastName}` : "",
      client: r.quote?.clientName ?? "",
      devis: r.quote?.quoteNumber ?? "",
      montant_ht: r.baseAmount,
      taux_commission: r.rate,
      montant_commission: r.amount,
      statut: r.status,
      date_paiement: r.paidAt ?? "",
      cree_le: r.createdAt,
    })));
  } else {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
