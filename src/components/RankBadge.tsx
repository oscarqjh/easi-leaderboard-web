interface RankBadgeProps {
  rank: number;
}

export default function RankBadge({ rank }: RankBadgeProps) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-lb-gold/[0.08] text-lb-gold font-bold text-sm border border-lb-gold/[0.15]">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-lb-silver/[0.08] text-lb-silver font-bold text-sm border border-lb-silver/[0.12]">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-lb-bronze/[0.08] text-lb-bronze font-bold text-sm border border-lb-bronze/[0.12]">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 text-lb-text-muted text-sm font-mono">
      {rank}
    </span>
  );
}
