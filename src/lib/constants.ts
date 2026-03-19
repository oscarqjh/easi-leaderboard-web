import { BenchmarkMeta } from "./types";

export interface Capability {
  abbr: string;
  title: string;
  description: string;
}

export const CAPABILITIES: Capability[] = [
  {
    abbr: "MM",
    title: "Metric Measurement",
    description: "Inferring 3D dimensions such as depth and length from 2D observations.",
  },
  {
    abbr: "MR",
    title: "Mental Reconstruction",
    description: "Constructing complete 3D structure from limited viewpoints.",
  },
  {
    abbr: "SR",
    title: "Spatial Relations",
    description: "Understanding relative positions and orientations of objects.",
  },
  {
    abbr: "PT",
    title: "Perspective-taking",
    description: "Reasoning about scenes across different viewpoints.",
  },
  {
    abbr: "DA",
    title: "Deformation & Assembly",
    description: "Understanding structural changes, folding, and assembly.",
  },
  {
    abbr: "CR",
    title: "Comprehensive Reasoning",
    description: "Multi-stage spatial reasoning combining multiple capabilities.",
  },
];

export const BENCHMARKS: BenchmarkMeta[] = [
  { id: "vsi_bench", name: "VSI-Bench", metric: "Acc.", isEasi8: true },
  { id: "mmsi_bench", name: "MMSI-Bench", metric: "Acc.", isEasi8: true },
  { id: "mindcube_tiny", name: "MindCube-Tiny", metric: "Acc.", isEasi8: true },
  { id: "viewspatial", name: "ViewSpatial", metric: "Acc.", isEasi8: true },
  { id: "site", name: "SITE", metric: "CAA", isEasi8: true },
  { id: "blink", name: "BLINK", metric: "Acc.", isEasi8: true },
  { id: "3dsrbench", name: "3DSRBench", metric: "Acc.", isEasi8: true },
  { id: "embspatial", name: "EmbSpatial", metric: "Acc.", isEasi8: true },
  { id: "mmsi_video_bench", name: "MMSI-Video-Bench", metric: "Acc.", isEasi8: false },
  { id: "omnispatial_(manual_cot)", name: "OmniSpatial (Manual CoT)", metric: "Acc.", isEasi8: false },
  { id: "spar_bench", name: "SPAR-Bench", metric: "Acc.", isEasi8: false },
  { id: "vsi_debiased", name: "VSI-Debiased", metric: "Acc.", isEasi8: false },
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
