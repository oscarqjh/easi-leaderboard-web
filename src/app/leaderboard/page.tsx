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
        <h1 className="font-heading text-heading font-bold text-lb-text">
          EASI: Holistic Evaluation of MLLMs
          <br />
          <span className="text-lb-primary">on Spatial Intelligence</span>
        </h1>
        <p className="mt-sm text-sm text-lb-text-secondary">
          Last updated: 2025-03-15 &middot; {data.length} models evaluated
        </p>
      </div>
      <OverviewClient data={data} />
    </div>
  );
}
