import { BenchmarkMeta } from "./types";

export const BENCHMARKS: BenchmarkMeta[] = [
  { id: "vsi_bench", name: "VSI-Bench", metric: "Acc.", isEasi8: true },
  { id: "mmsi_bench", name: "MMSI-Bench", metric: "Acc.", isEasi8: true },
  { id: "mindcube_tiny", name: "MindCube-Tiny", metric: "Acc.", isEasi8: true },
  { id: "viewspatial", name: "ViewSpatial", metric: "Acc.", isEasi8: true },
  { id: "site", name: "SITE", metric: "CAA", isEasi8: true },
  { id: "blink", name: "BLINK", metric: "Acc.", isEasi8: true },
  { id: "3dsrbench", name: "3DSRBench", metric: "Acc.", isEasi8: true },
  { id: "embspatial", name: "EmbSpatial", metric: "Acc.", isEasi8: true },
  { id: "dsrbench", name: "DSRBench", metric: "Acc.", isEasi8: false },
  { id: "eriq", name: "ERIQ", metric: "Acc.", isEasi8: false },
  { id: "erqa", name: "ERQA", metric: "Acc.", isEasi8: false },
  { id: "robospatialhome", name: "RoboSpatialHome", metric: "Acc.", isEasi8: false },
  { id: "sti_bench", name: "STI-Bench", metric: "Acc.", isEasi8: false },
  { id: "muirbench", name: "MUIRBench", metric: "Acc.", isEasi8: false },
];

export const EASI8_IDS = BENCHMARKS.filter((b) => b.isEasi8).map((b) => b.id);
export const ALL_IDS = BENCHMARKS.map((b) => b.id);

export const MODEL_TYPE_LABELS: Record<string, string> = {
  pretrained: "Pretrained",
  finetuned: "Fine-tuned",
  instruction: "Instruction-tuned",
  rl: "RL-tuned",
};

export const PRECISION_OPTIONS = ["all", "bfloat16", "float16", "float32", "int8"] as const;
