interface RankBadgeProps {
  rank: number;
}

export default function RankBadge({ rank }: RankBadgeProps) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 bg-lb-gold/15 text-lb-gold font-bold text-sm shadow-border-thin">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 bg-lb-silver/15 text-lb-silver font-bold text-sm shadow-border-thin">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 bg-lb-bronze/15 text-lb-bronze font-bold text-sm shadow-border-thin">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 text-lb-text-secondary text-sm font-mono">
      {rank}
    </span>
  );
}
