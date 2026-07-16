import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { identifier } = await req.json();

  if (!identifier) {
    return NextResponse.json({ error: "Identifiant requis" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ identifier }, { email: identifier }],
      role: "OPERATOR",
      status: "ACTIVE",
    },
    select: { id: true, email: true, firstName: true },
  });

  // Always return success to avoid user enumeration
  if (!user || !user.email) {
    return NextResponse.json({ success: true });
  }

  // In production, send email with reset link here
  // For now, just log and return success
  console.log(`[FORGOT PASSWORD] Reset requested for: ${user.email}`);

  return NextResponse.json({ success: true });
}
