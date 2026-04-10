import { fetchStrategyTeam } from "@/app/admin/strategy/actions";
import ReviewPageClient from "./page.client";

export const metadata = {
  title: "Task Review — Strategy Engine",
};

export default async function StrategyReviewPage() {
  const team = await fetchStrategyTeam();
  return <ReviewPageClient team={team} />;
}
