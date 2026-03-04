import { NextResponse } from "next/server";
import { fetchMissionLeads } from "@/lib/notion-leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leads = await fetchMissionLeads(100);
    return NextResponse.json({ ok: true, leads, source: "notion" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, leads: [], error: message, source: "none" },
      { status: 500 }
    );
  }
}
