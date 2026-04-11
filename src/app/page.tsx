import { type CampusId } from "@/config/campuses";
import { siteConfig } from "@/config/site";
import { LandingPageShell } from "@/components/layout/landing-page-shell";
import { bootstrapApp } from "@/db/bootstrap";
import type { PublicComplaint } from "@/lib/types";
import {
  getApprovedComplaintCount,
  listPublicComplaintsByCampus,
} from "@/services/complaints";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialCampusId = siteConfig.defaultCampusId as CampusId;
  let initialComplaints: PublicComplaint[] = [];
  let initialTotalApprovedComplaints = 0;

  try {
    await bootstrapApp();

    [initialComplaints, initialTotalApprovedComplaints] = await Promise.all([
      listPublicComplaintsByCampus(initialCampusId),
      getApprovedComplaintCount(),
    ]);
  } catch (error) {
    console.error(
      "Falha ao carregar os dados públicos iniciais da home; usando fallback vazio.",
      error,
    );
  }

  return (
    <LandingPageShell
      initialCampusId={initialCampusId}
      initialComplaints={initialComplaints}
      initialTotalApprovedComplaints={initialTotalApprovedComplaints}
    />
  );
}
