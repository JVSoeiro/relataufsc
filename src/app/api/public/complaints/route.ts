import { NextRequest, NextResponse } from "next/server";

import { bootstrapApp } from "@/db/bootstrap";
import { listPublicComplaintsByCampus } from "@/services/complaints";
import { publicComplaintsQuerySchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

  try {
    await bootstrapApp();

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
  } catch (error) {
    console.error(
      `Falha ao carregar relatos públicos do campus ${parsedQuery.data.campusId}; retornando fallback vazio.`,
      error,
    );

    return NextResponse.json(
      {
        complaints: [],
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
