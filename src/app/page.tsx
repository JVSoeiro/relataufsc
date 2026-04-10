import { type CampusId } from "@/config/campuses";
import { siteConfig } from "@/config/site";
import { LandingPageShell } from "@/components/layout/landing-page-shell";
import { bootstrapApp } from "@/db/bootstrap";
import {
  getApprovedComplaintCount,
  listPublicComplaintsByCampus,
} from "@/services/complaints";

export const dynamic = "force-dynamic";

export default async function Home() {
  await bootstrapApp();

  const initialCampusId = siteConfig.defaultCampusId as CampusId;
  const [initialComplaints, initialTotalApprovedComplaints] = await Promise.all([
    Promise.resolve(listPublicComplaintsByCampus(initialCampusId)),
    Promise.resolve(getApprovedComplaintCount()),
  ]);

  return (
    <LandingPageShell
      initialCampusId={initialCampusId}
      initialComplaints={initialComplaints}
      initialTotalApprovedComplaints={initialTotalApprovedComplaints}
    />
  );
}
