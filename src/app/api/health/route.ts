import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok", env: {
    hasDb: !!process.env.DATABASE_URL,
    hasSecret: !!process.env.AUTH_SECRET,
  }});
}
