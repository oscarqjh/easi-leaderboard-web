import { RankedModel } from "./types";
import { BENCHMARKS } from "./constants";

const benchmarkMap = new Map(BENCHMARKS.map((b) => [b.id, b.name]));

function formatScore(v: number | null): string {
  return v !== null && v !== undefined ? v.toFixed(1) : "-";
}

export function exportCsv(models: RankedModel[], columns: string[]): string {
  const header = ["Rank", "Model", "Type", "Precision", "Avg", ...columns.map((c) => benchmarkMap.get(c) ?? c)];
  const rows = models.map((m) => [
    m.rank,
    m.displayName || m.name,
    m.type,
    m.precision,
    formatScore(m.average),
    ...columns.map((c) => formatScore(m.scores[c] ?? null)),
  ]);

  return [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function exportJsonl(models: RankedModel[], columns: string[]): string {
  return models
    .map((m) => {
      const scores: Record<string, number | null> = {};
      for (const c of columns) {
        scores[benchmarkMap.get(c) ?? c] = m.scores[c] ?? null;
      }
      return JSON.stringify({
        rank: m.rank,
        model: m.displayName || m.name,
        type: m.type,
        precision: m.precision,
        average: m.average,
        scores,
      });
    })
    .join("\n");
}

export function exportLatex(models: RankedModel[], columns: string[]): string {
  const colNames = columns.map((c) => benchmarkMap.get(c) ?? c);
  const colSpec = "rl" + "r".repeat(columns.length + 1); // rank, model(left), avg, ...scores(right)

  const header = [
    "\\usepackage{booktabs}",
    "\\usepackage{adjustbox}",
    "",
    "\\begin{table}[htbp]",
    "\\centering",
    "\\caption{EASI Leaderboard Results}",
    "\\label{tab:easi-leaderboard}",
    "\\begin{adjustbox}{width=\\textwidth}",
    `\\begin{tabular}{${colSpec}}`,
    "\\toprule",
    `\\textbf{\\#} & \\textbf{Model} & \\textbf{Avg} & ${colNames.map((n) => `\\textbf{${n}}`).join(" & ")} \\\\`,
    "\\midrule",
  ];

  const rows = models.map((m) => {
    const scores = columns.map((c) => formatScore(m.scores[c] ?? null));
    const displayName = (m.displayName || m.name).replace(/_/g, "\\_");
    return `${m.rank} & ${displayName} & ${formatScore(m.average)} & ${scores.join(" & ")} \\\\`;
  });

  const footer = [
    "\\bottomrule",
    "\\end{tabular}",
    "\\end{adjustbox}",
    "\\end{table}",
  ];

  return [...header, ...rows, ...footer].join("\n");
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
