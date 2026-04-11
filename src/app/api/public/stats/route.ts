import { NextResponse } from "next/server";

import { bootstrapApp } from "@/db/bootstrap";
import { getApprovedComplaintCount } from "@/services/complaints";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await bootstrapApp();

    return NextResponse.json(
      {
        totalApprovedComplaints: await getApprovedComplaintCount(),
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Falha ao carregar a contagem pública de relatos; retornando fallback vazio.",
      error,
    );

    return NextResponse.json(
      {
        totalApprovedComplaints: 0,
        degraded: true,
      },
      {
        headers: {
          "cache-control": "no-store",
          "x-relataufsc-degraded": "true",
        },
      },
    );
  }
}
