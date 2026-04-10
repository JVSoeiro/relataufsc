import { NextResponse } from "next/server";

import { bootstrapApp } from "@/db/bootstrap";
import { getApprovedComplaintCount } from "@/services/complaints";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
}
