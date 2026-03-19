export type ModelType = "pretrained" | "finetuned" | "instruction" | "rl";
export type Precision = "bfloat16" | "float16" | "float32" | "int8";
export type Protocol = "EASI-8" | "ALL";
export type SortDirection = "asc" | "desc";

export interface BenchmarkMeta {
  id: string;
  name: string;
  metric: string;
  isEasi8: boolean;
}

export interface ModelEntry {
  name: string;
  displayName?: string;
  link?: string;
  type: ModelType;
  precision: Precision;
  scores: Record<string, number | null>;
}

export interface FilterState {
  search: string;
  precision: Precision | "all";
  protocol: Protocol;
  visibleColumns: string[];
  sortColumn: string;
  sortDirection: SortDirection;
}

export interface RankedModel extends ModelEntry {
  rank: number;
  average: number | null;
}
