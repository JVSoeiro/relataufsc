import { NextRequest, NextResponse } from "next/server";

import { bootstrapApp } from "@/db/bootstrap";
import { listPublicComplaintsByCampus } from "@/services/complaints";
import { publicComplaintsQuerySchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await bootstrapApp();

  const parsedQuery = publicComplaintsQuerySchema.safeParse({
    campusId: request.nextUrl.searchParams.get("campusId"),
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "Campus inválido.",
      },
      {
        status: 400,
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  }

  return NextResponse.json(
    {
      complaints: await listPublicComplaintsByCampus(parsedQuery.data.campusId),
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
