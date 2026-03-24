import { RankedModel } from "./types";
import { BENCHMARKS } from "./constants";
import { ModelCapabilityRow } from "./capability-scores";

const benchmarkMap = new Map(BENCHMARKS.map((b) => [b.id, b.name]));

function formatScore(v: number | null): string {
  return v !== null && v !== undefined ? v.toFixed(1) : "-";
}

function formatSubKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\baccuracy\b/gi, "")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .trim();
}

function getSubKeys(models: RankedModel[], benchId: string): string[] {
  const keys = new Set<string>();
  for (const m of models) {
    const subs = m.subScores?.[benchId];
    if (subs) for (const k of Object.keys(subs)) keys.add(k);
  }
  return Array.from(keys);
}

// Build the flat column list respecting expanded columns
function buildColumnHeaders(
  models: RankedModel[],
  columns: string[],
  expandedColumns: string[]
): { id: string; label: string; benchId: string; subKey?: string }[] {
  const result: { id: string; label: string; benchId: string; subKey?: string }[] = [];
  for (const colId of columns) {
    const benchName = benchmarkMap.get(colId) ?? colId;
    if (expandedColumns.includes(colId)) {
      const subKeys = getSubKeys(models, colId);
      if (subKeys.length > 0) {
        for (const sk of subKeys) {
          result.push({ id: `${colId}:${sk}`, label: `${benchName} - ${formatSubKey(sk)}`, benchId: colId, subKey: sk });
        }
        continue;
      }
    }
    result.push({ id: colId, label: benchName, benchId: colId });
  }
  return result;
}

function getCellValue(m: RankedModel, col: { benchId: string; subKey?: string }): number | null {
  if (col.subKey) return m.subScores?.[col.benchId]?.[col.subKey] ?? null;
  return m.scores[col.benchId] ?? null;
}

export function exportCsv(
  models: RankedModel[],
  columns: string[],
  expandedColumns: string[] = []
): string {
  const cols = buildColumnHeaders(models, columns, expandedColumns);
  const header = ["Rank", "Model", "Type", "Precision", "Avg", ...cols.map((c) => c.label)];
  const rows = models.map((m) => [
    m.rank,
    m.displayName || m.name,
    m.type,
    m.precision,
    formatScore(m.average),
    ...cols.map((c) => formatScore(getCellValue(m, c))),
  ]);
  return [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function exportJsonl(
  models: RankedModel[],
  columns: string[],
  expandedColumns: string[] = []
): string {
  return models
    .map((m) => {
      const scores: Record<string, number | null | Record<string, number | null>> = {};
      for (const c of columns) {
        const benchName = benchmarkMap.get(c) ?? c;
        if (expandedColumns.includes(c)) {
          const subKeys = getSubKeys(models, c);
          if (subKeys.length > 0) {
            const subs: Record<string, number | null> = {};
            for (const sk of subKeys) subs[formatSubKey(sk)] = m.subScores?.[c]?.[sk] ?? null;
            scores[benchName] = subs;
            continue;
          }
        }
        scores[benchName] = m.scores[c] ?? null;
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

export function exportLatex(
  models: RankedModel[],
  columns: string[],
  expandedColumns: string[] = [],
  capabilityMap?: Record<string, Record<string, string[]>>
): string {
  const cols = buildColumnHeaders(models, columns, expandedColumns);
  const totalDataCols = cols.length + 1; // +1 for Avg
  const colSpec = "rl" + "r".repeat(totalDataCols);

  // Check if we need a two-tier header
  const hasExpanded = expandedColumns.some((ec) => {
    const subKeys = getSubKeys(models, ec);
    return columns.includes(ec) && subKeys.length > 0;
  });

  const showCaps = hasExpanded && !!capabilityMap;
  const multirowCount = showCaps ? 3 : 2;

  const lines: string[] = [
    "\\usepackage{booktabs}",
    "\\usepackage{adjustbox}",
    "\\usepackage{multirow}",
    "",
    "\\begin{table}[htbp]",
    "\\centering",
    "\\caption{EASI Leaderboard Results}",
    "\\label{tab:easi-leaderboard}",
    "\\begin{adjustbox}{width=\\textwidth}",
    `\\begin{tabular}{${colSpec}}`,
    "\\toprule",
  ];

  if (hasExpanded) {
    // Row 1: group headers
    const row1Parts: string[] = [`\\multirow{${multirowCount}}{*}{\\textbf{\\#}}`, `\\multirow{${multirowCount}}{*}{\\textbf{Model}}`, `\\multirow{${multirowCount}}{*}{\\textbf{Avg}}`];
    // Row 2: sub-headers
    const row2Parts: string[] = [];

    for (const colId of columns) {
      const benchName = (benchmarkMap.get(colId) ?? colId).replace(/_/g, "\\_");
      const subKeys = expandedColumns.includes(colId) ? getSubKeys(models, colId) : [];

      if (subKeys.length > 0) {
        row1Parts.push(`\\multicolumn{${subKeys.length}}{c}{\\textbf{${benchName}}}`);
        for (const sk of subKeys) {
          row2Parts.push(`\\textit{${formatSubKey(sk).replace(/_/g, "\\_")}}`);
        }
      } else {
        row1Parts.push(`\\multirow{${multirowCount}}{*}{\\textbf{${benchName}}}`);
      }
    }

    lines.push(row1Parts.join(" & ") + " \\\\");
    if (row2Parts.length > 0) {
      let colIdx = 4; // 1=#, 2=Model, 3=Avg, 4=first data col
      const cmidrules: string[] = [];
      const row2Full: string[] = [];

      for (const colId of columns) {
        const subKeys = expandedColumns.includes(colId) ? getSubKeys(models, colId) : [];
        if (subKeys.length > 0) {
          cmidrules.push(`\\cmidrule(lr){${colIdx}-${colIdx + subKeys.length - 1}}`);
          for (const sk of subKeys) {
            row2Full.push(`\\textit{${formatSubKey(sk).replace(/_/g, "\\_")}}`);
          }
          colIdx += subKeys.length;
        } else {
          row2Full.push(""); // placeholder for multirow
          colIdx += 1;
        }
      }

      lines.push(cmidrules.join(" "));
      lines.push("& & & " + row2Full.join(" & ") + " \\\\");

      // Row 3: capability labels
      if (showCaps) {
        const capRow: string[] = [];
        for (const colId of columns) {
          const subKeys = expandedColumns.includes(colId) ? getSubKeys(models, colId) : [];
          if (subKeys.length > 0) {
            for (const sk of subKeys) {
              const caps = capabilityMap[colId]?.[sk] ?? [];
              capRow.push(caps.length > 0 ? `\\textsc{${caps.join(", ")}}` : "--");
            }
          } else {
            capRow.push("");
          }
        }
        lines.push("& & & " + capRow.join(" & ") + " \\\\");
      }
    }
  } else {
    const headerCols = cols.map((c) => `\\textbf{${c.label.replace(/_/g, "\\_")}}`);
    lines.push(`\\textbf{\\#} & \\textbf{Model} & \\textbf{Avg} & ${headerCols.join(" & ")} \\\\`);
  }

  lines.push("\\midrule");

  for (const m of models) {
    const displayName = (m.displayName || m.name).replace(/_/g, "\\_");
    const values = cols.map((c) => formatScore(getCellValue(m, c)));
    lines.push(`${m.rank} & ${displayName} & ${formatScore(m.average)} & ${values.join(" & ")} \\\\`);
  }

  lines.push("\\bottomrule", "\\end{tabular}", "\\end{adjustbox}", "\\end{table}");

  return lines.join("\n");
}

/* ── Capability view exports ── */

export function exportCapabilityCsv(rows: ModelCapabilityRow[], capLabels: string[]): string {
  const header = ["Rank", "Model", "Avg", ...capLabels.map((c) => c.toUpperCase())];
  const dataRows = rows.map((r) => [
    r.rank,
    r.model.displayName || r.model.name,
    formatScore(r.capAverage),
    ...capLabels.map((c) => formatScore(r.capabilities[c]?.value ?? null)),
  ]);
  return [header.join(","), ...dataRows.map((r) => r.join(","))].join("\n");
}

export function exportCapabilityJsonl(rows: ModelCapabilityRow[], capLabels: string[]): string {
  return rows
    .map((r) => {
      const caps: Record<string, number | null> = {};
      for (const c of capLabels) caps[c.toUpperCase()] = r.capabilities[c]?.value ?? null;
      return JSON.stringify({
        rank: r.rank,
        model: r.model.displayName || r.model.name,
        average: r.capAverage,
        capabilities: caps,
      });
    })
    .join("\n");
}

export function exportCapabilityLatex(rows: ModelCapabilityRow[], capLabels: string[]): string {
  const colSpec = "rl" + "r".repeat(capLabels.length + 1);
  const lines: string[] = [
    "\\usepackage{booktabs}",
    "\\usepackage{adjustbox}",
    "",
    "\\begin{table}[htbp]",
    "\\centering",
    "\\caption{EASI Leaderboard — Taxonomy Scores}",
    "\\label{tab:easi-taxonomy}",
    "\\begin{adjustbox}{width=\\textwidth}",
    `\\begin{tabular}{${colSpec}}`,
    "\\toprule",
    `\\textbf{\\#} & \\textbf{Model} & \\textbf{Avg} & ${capLabels.map((c) => `\\textbf{${c.toUpperCase()}}`).join(" & ")} \\\\`,
    "\\midrule",
  ];

  for (const r of rows) {
    const displayName = (r.model.displayName || r.model.name).replace(/_/g, "\\_");
    const values = capLabels.map((c) => formatScore(r.capabilities[c]?.value ?? null));
    lines.push(`${r.rank} & ${displayName} & ${formatScore(r.capAverage)} & ${values.join(" & ")} \\\\`);
  }

  lines.push("\\bottomrule", "\\end{tabular}", "\\end{adjustbox}", "\\end{table}");
  return lines.join("\n");
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
