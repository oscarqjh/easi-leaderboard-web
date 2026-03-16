import OverviewClient from "@/components/OverviewClient";
import leaderboardData from "@/data/leaderboard.json";
import { ModelEntry } from "@/lib/types";

export const metadata = {
  title: "Leaderboard",
};

export default function LeaderboardPage() {
  const data = leaderboardData as ModelEntry[];

  return (
    <div className="max-w-7xl mx-auto px-md py-lg">
      <div className="mb-lg animate-fade-in-up">
        <h1 className="font-heading text-heading font-semibold text-lb-text">
          EASI: Evaluation of MLLMs
          <br />
          <em className="text-lb-primary italic">on Spatial Intelligence</em>
        </h1>
        <p className="mt-sm text-sm text-lb-text-muted">
          Last updated: 2025-03-15  &middot; {data.length} models evaluated
        </p>
      </div>
      <OverviewClient data={data} />
    </div>
  );
}
