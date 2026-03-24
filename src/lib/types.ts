export type ModelType = "pretrained" | "finetuned" | "instruction" | "rl";
export type Precision = "bfloat16" | "float16" | "float32" | "int8";
export type Protocol = "EASI-8" | "ALL";
export type SortDirection = "asc" | "desc";
export type ViewMode = "benchmark" | "capability";

export interface BenchmarkMeta {
  id: string;
  name: string;
  metric: string;
  isEasi8: boolean;
}

export type Backend = "vlmevalkit" | "lmmseval" | "others";

export interface ModelEntry {
  name: string;
  displayName?: string;
  link?: string;
  backend?: Backend;
  type: ModelType;
  precision: Precision;
  scores: Record<string, number | null>;
  subScores?: Record<string, Record<string, number>>;
}

export interface FilterState {
  search: string;
  precision: Precision | "all";
  protocol: Protocol;
  viewMode: ViewMode;
  visibleColumns: string[];
  expandedColumns: string[];
  showCapabilities: boolean;
  sortColumn: string;
  sortDirection: SortDirection;
}

export interface RankedModel extends ModelEntry {
  rank: number;
  average: number | null;
}
