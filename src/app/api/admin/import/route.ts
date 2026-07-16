import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(";").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(";").map((v) => v.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const operatorId = formData.get("operatorId") as string | null;

  if (!file || !operatorId) {
    return NextResponse.json({ error: "Fichier et opérateur requis" }, { status: 400 });
  }

  const operator = await prisma.user.findUnique({ where: { id: operatorId, role: "OPERATOR" } });
  if (!operator) {
    return NextResponse.json({ error: "Opérateur introuvable" }, { status: 404 });
  }

  const text = await file.text();
  const rows = parseCSV(text);

  let successRows = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const companyName = row.companyname || row.entreprise || row.company;
    if (!companyName) {
      errors.push(`Ligne ${i + 2} : nom d'entreprise manquant`);
      continue;
    }
    try {
      await prisma.prospect.create({
        data: {
          companyName,
          contactName: row.contactname || row.contact || null,
          email: row.email || null,
          phone: row.telephone || row.phone || null,
          sector: row.secteur || row.sector || null,
          city: row.ville || row.city || null,
          website: row.site_web || row.website || null,
          serviceNeeded: row.service_souhaite || row.service || null,
          operatorId,
          status: "NEW",
        },
      });
      successRows++;
    } catch (e) {
      errors.push(`Ligne ${i + 2} : erreur lors de l'import`);
    }
  }

  await prisma.importLog.create({
    data: {
      status: errors.length === rows.length ? "FAILED" : "COMPLETED",
      fileName: file.name,
      totalRows: rows.length,
      importedRows: successRows,
      errorRows: errors.length,
      errorReport: errors.length > 0 ? errors.slice(0, 20).join("\n") : null,
    },
  });

  return NextResponse.json({ successRows, errorRows: errors.length, errors: errors.slice(0, 5) });
}
