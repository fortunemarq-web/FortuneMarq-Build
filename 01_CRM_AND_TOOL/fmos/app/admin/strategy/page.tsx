import { fetchAcquisitionTargets } from "@/app/admin/growth/actions";
import { fetchStrategyTeam } from "@/app/admin/strategy/actions";
import StrategyEngineClient from "./page.client";

export const metadata = {
  title: "Strategy API Engine — FortuneMarq",
};

export default async function StrategyEnginePage() {
  const [team, targets] = await Promise.all([
    fetchStrategyTeam(),
    fetchAcquisitionTargets()
  ]);

  const organicDestinations = [
    { id: "agency_growth.instagram", label: "Agency Growth — Instagram" },
    { id: "agency_growth.linkedin", label: "Agency Growth — LinkedIn" },
    { id: "agency_growth.facebook", label: "Agency Growth — Facebook" },
    { id: "agency_growth.gmb", label: "Agency Growth — Google My Business" },
    { id: "agency_growth.seo", label: "Agency Growth — Website & SEO" },
    { id: "project_delivery.general", label: "Project Delivery — General" },
    { id: "finance.admin", label: "Finance & Admin" },
  ];

  const acquisitionDestinations = targets.map((t: any) => ({
    id: `acquisition.${t.city_slug}.${t.niche.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    label: `Client Acquisition — ${t.city} — ${t.niche}`
  }));

  return (
    <StrategyEngineClient 
      team={team} 
      organicDestinations={organicDestinations} 
      acquisitionDestinations={acquisitionDestinations} 
    />
  );
}
