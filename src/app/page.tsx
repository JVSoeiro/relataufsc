import { type CampusId } from "@/config/campuses";
import { siteConfig } from "@/config/site";
import { LandingPageShell } from "@/components/layout/landing-page-shell";

export const dynamic = "force-dynamic";

export default function Home() {
  const initialCampusId = siteConfig.defaultCampusId as CampusId;

  return (
    <LandingPageShell
      initialCampusId={initialCampusId}
      initialComplaints={[]}
      initialTotalApprovedComplaints={0}
    />
  );
}
