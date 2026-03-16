interface ScoreCellProps {
  value: number | null;
  isBest: boolean;
}

export default function ScoreCell({ value, isBest }: ScoreCellProps) {
  if (value === null || value === undefined) {
    return (
      <span className="text-lb-text-muted font-mono text-sm">-/-</span>
    );
  }

  return (
    <span
      className={`font-mono text-sm ${
        isBest
          ? "text-lb-best font-bold underline underline-offset-2 decoration-lb-best/40"
          : "text-lb-text"
      }`}
    >
      {value.toFixed(1)}
    </span>
  );
}
