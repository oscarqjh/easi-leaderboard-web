"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { BENCHMARKS } from "@/lib/constants";
import ZipUploadZone from "@/components/ZipUploadZone";

/* ── Types ── */

interface HfUser {
  id: string;
  name: string;
  avatar: string;
}

interface FormData {
  modelName: string;
  modelType: string;
  precision: string;
  revision: string;
  weightType: string;
  baseModel: string;
  backend: string;
  scores: Record<string, string>;
  scoreEnabled: Record<string, boolean>;
  subScores: Record<string, Record<string, string>>;
  subScoresExpanded: Record<string, boolean>;
  remarks: string;
  zipFile: File | null;
}

interface SubmitPayload {
  userId: string;
  userName: string;
  modelName: string;
  modelType: string;
  precision: string;
  revision: string;
  weightType: string;
  baseModel: string;
  backend: string;
  scores: Record<string, number | null>;
  subScores: Record<string, Record<string, number | null>>;
  remarks: string;
}

interface SectionConfig {
  id: string;
  sideLabel: string;
  isValid: (form: FormData) => boolean;
}

/* ── Constants ── */

/**
 * Extract sub-score keys per benchmark from leaderboard model data.
 * Scans all models' subScores to build the complete mapping.
 */
function extractSubScoreKeys(
  models: { subScores?: Record<string, Record<string, number>> }[]
): Record<string, string[]> {
  const map: Record<string, Set<string>> = {};
  for (const m of models) {
    if (!m.subScores) continue;
    for (const [benchId, subs] of Object.entries(m.subScores)) {
      if (!map[benchId]) map[benchId] = new Set();
      for (const k of Object.keys(subs)) map[benchId].add(k);
    }
  }
  const result: Record<string, string[]> = {};
  for (const [benchId, keys] of Object.entries(map)) {
    result[benchId] = Array.from(keys).sort();
  }
  return result;
}

function formatSubScoreLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b(accuracy|caa)\b/gi, "")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .trim() || key;
}

const HF_CLIENT_ID = process.env.NEXT_PUBLIC_HF_CLIENT_ID || "";
const HF_REDIRECT_URI = process.env.NEXT_PUBLIC_HF_REDIRECT_URI || "https://easi.lmms-lab.com/api/auth/callback";
const HF_MODEL_RE = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
const LS_KEY = "easi_hf_user";
const LS_TOKEN_KEY = "easi_hf_token";

const SECTIONS: SectionConfig[] = [
  { id: "auth", sideLabel: "AUTH", isValid: () => true }, // controlled by hfUser state, not form
  { id: "model", sideLabel: "MODEL", isValid: (f) => HF_MODEL_RE.test(f.modelName) },
  {
    id: "config",
    sideLabel: "CONFIG",
    isValid: (f) =>
      f.modelType !== "" &&
      f.precision !== "" &&
      f.revision.trim() !== "" &&
      f.weightType !== "" &&
      f.backend !== "",
  },
  {
    id: "scores",
    sideLabel: "SCORES",
    isValid: (f) =>
      Object.entries(f.scoreEnabled).some(
        ([id, enabled]) => enabled && f.scores[id] !== "" && !isNaN(parseFloat(f.scores[id]))
      ) && f.zipFile !== null,
  },
  { id: "remarks", sideLabel: "REMARKS", isValid: () => true },
  { id: "review", sideLabel: "REVIEW", isValid: () => true },
];

const INITIAL_FORM: FormData = {
  modelName: "",
  modelType: "",
  precision: "",
  revision: "",
  weightType: "",
  baseModel: "",
  backend: "",
  scores: Object.fromEntries(BENCHMARKS.map((b) => [b.id, ""])),
  scoreEnabled: Object.fromEntries(BENCHMARKS.map((b) => [b.id, false])),
  subScores: {},
  subScoresExpanded: Object.fromEntries(BENCHMARKS.map((b) => [b.id, false])),
  remarks: "",
  zipFile: null,
};

/* ── HuggingFace auto-fill helpers ── */

function inferModelType(data: Record<string, unknown>): string | null {
  const pipeline = data.pipeline_tag as string | undefined;
  const tags = (data.tags as string[]) ?? [];
  const tagsLower = tags.map((t) => t.toLowerCase());

  if (tagsLower.some((t) => t.includes("rl") || t.includes("rlhf"))) return "rl";
  if (tagsLower.some((t) => t.includes("fine-tuned") || t.includes("finetuned"))) return "finetuned";
  if (pipeline === "text-generation") {
    if (tagsLower.some((t) => t.includes("chat") || t.includes("instruct"))) return "instruction";
    return "pretrained";
  }
  return null;
}

function inferPrecision(configJson: Record<string, unknown>): string | null {
  const dtype = (configJson.torch_dtype as string) ?? "";
  const map: Record<string, string> = {
    bfloat16: "bfloat16",
    float16: "float16",
    float32: "float32",
  };
  if (map[dtype]) return map[dtype];
  if (dtype.includes("int8") || dtype.includes("quantiz")) return "int8";
  return null;
}

function inferBaseModel(data: Record<string, unknown>): string | null {
  const cardData = data.cardData as Record<string, unknown> | undefined;
  const val = cardData?.base_model ?? data.base_model;
  if (!val) return null;
  if (Array.isArray(val)) return (val[0] as string) ?? null;
  return typeof val === "string" ? val : null;
}

/* ── HF Logo SVG (official brand asset) ── */

function HfLogo({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="95" height="88" viewBox="0 0 95 88" fill="none">
      <path fill="#FFD21E" d="M47.21 76.5a34.75 34.75 0 1 0 0-69.5 34.75 34.75 0 0 0 0 69.5Z" />
      <path fill="#FF9D0B" d="M81.96 41.75a34.75 34.75 0 1 0-69.5 0 34.75 34.75 0 0 0 69.5 0Zm-73.5 0a38.75 38.75 0 1 1 77.5 0 38.75 38.75 0 0 1-77.5 0Z" />
      <path fill="#3A3B45" d="M58.5 32.3c1.28.44 1.78 3.06 3.07 2.38a5 5 0 1 0-6.76-2.07c.61 1.15 2.55-.72 3.7-.32ZM34.95 32.3c-1.28.44-1.79 3.06-3.07 2.38a5 5 0 1 1 6.76-2.07c-.61 1.15-2.56-.72-3.7-.32Z" />
      <path fill="#FF323D" d="M46.96 56.29c9.83 0 13-8.76 13-13.26 0-2.34-1.57-1.6-4.09-.36-2.33 1.15-5.46 2.74-8.9 2.74-7.19 0-13-6.88-13-2.38s3.16 13.26 13 13.26Z" />
      <path fill="#3A3B45" fillRule="evenodd" d="M39.43 54a8.7 8.7 0 0 1 5.3-4.49c.4-.12.81.57 1.24 1.28.4.68.82 1.37 1.24 1.37.45 0 .9-.68 1.33-1.35.45-.7.89-1.38 1.32-1.25a8.61 8.61 0 0 1 5 4.17c3.73-2.94 5.1-7.74 5.1-10.7 0-2.34-1.57-1.6-4.09-.36l-.14.07c-2.31 1.15-5.39 2.67-8.77 2.67s-6.45-1.52-8.77-2.67c-2.6-1.29-4.23-2.1-4.23.29 0 3.05 1.46 8.06 5.47 10.97Z" clipRule="evenodd" />
      <path fill="#FF9D0B" d="M70.71 37a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM24.21 37a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM17.52 48c-1.62 0-3.06.66-4.07 1.87a5.97 5.97 0 0 0-1.33 3.76 7.1 7.1 0 0 0-1.94-.3c-1.55 0-2.95.59-3.94 1.66a5.8 5.8 0 0 0-.8 7 5.3 5.3 0 0 0-1.79 2.82c-.24.9-.48 2.8.8 4.74a5.22 5.22 0 0 0-.37 5.02c1.02 2.32 3.57 4.14 8.52 6.1 3.07 1.22 5.89 2 5.91 2.01a44.33 44.33 0 0 0 10.93 1.6c5.86 0 10.05-1.8 12.46-5.34 3.88-5.69 3.33-10.9-1.7-15.92-2.77-2.78-4.62-6.87-5-7.77-.78-2.66-2.84-5.62-6.25-5.62a5.7 5.7 0 0 0-4.6 2.46c-1-1.26-1.98-2.25-2.86-2.82A7.4 7.4 0 0 0 17.52 48Zm0 4c.51 0 1.14.22 1.82.65 2.14 1.36 6.25 8.43 7.76 11.18.5.92 1.37 1.31 2.14 1.31 1.55 0 2.75-1.53.15-3.48-3.92-2.93-2.55-7.72-.68-8.01.08-.02.17-.02.24-.02 1.7 0 2.45 2.93 2.45 2.93s2.2 5.52 5.98 9.3c3.77 3.77 3.97 6.8 1.22 10.83-1.88 2.75-5.47 3.58-9.16 3.58-3.81 0-7.73-.9-9.92-1.46-.11-.03-13.45-3.8-11.76-7 .28-.54.75-.76 1.34-.76 2.38 0 6.7 3.54 8.57 3.54.41 0 .7-.17.83-.6.79-2.85-12.06-4.05-10.98-8.17.2-.73.71-1.02 1.44-1.02 3.14 0 10.2 5.53 11.68 5.53.11 0 .2-.03.24-.1.74-1.2.33-2.04-4.9-5.2-5.21-3.16-8.88-5.06-6.8-7.33.24-.26.58-.38 1-.38 3.17 0 10.66 6.82 10.66 6.82s2.02 2.1 3.25 2.1c.28 0 .52-.1.68-.38.86-1.46-8.06-8.22-8.56-11.01-.34-1.9.24-2.85 1.31-2.85Z" />
      <path fill="#FFD21E" d="M38.6 76.69c2.75-4.04 2.55-7.07-1.22-10.84-3.78-3.77-5.98-9.3-5.98-9.3s-.82-3.2-2.69-2.9c-1.87.3-3.24 5.08.68 8.01 3.91 2.93-.78 4.92-2.29 2.17-1.5-2.75-5.62-9.82-7.76-11.18-2.13-1.35-3.63-.6-3.13 2.2.5 2.79 9.43 9.55 8.56 11-.87 1.47-3.93-1.71-3.93-1.71s-9.57-8.71-11.66-6.44c-2.08 2.27 1.59 4.17 6.8 7.33 5.23 3.16 5.64 4 4.9 5.2-.75 1.2-12.28-8.53-13.36-4.4-1.08 4.11 11.77 5.3 10.98 8.15-.8 2.85-9.06-5.38-10.74-2.18-1.7 3.21 11.65 6.98 11.76 7.01 4.3 1.12 15.25 3.49 19.08-2.12Z" />
      <path fill="#FF9D0B" d="M77.4 48c1.62 0 3.07.66 4.07 1.87a5.97 5.97 0 0 1 1.33 3.76 7.1 7.1 0 0 1 1.95-.3c1.55 0 2.95.59 3.94 1.66a5.8 5.8 0 0 1 .8 7 5.3 5.3 0 0 1 1.78 2.82c.24.9.48 2.8-.8 4.74a5.22 5.22 0 0 1 .37 5.02c-1.02 2.32-3.57 4.14-8.51 6.1-3.08 1.22-5.9 2-5.92 2.01a44.33 44.33 0 0 1-10.93 1.6c-5.86 0-10.05-1.8-12.46-5.34-3.88-5.69-3.33-10.9 1.7-15.92 2.78-2.78 4.63-6.87 5.01-7.77.78-2.66 2.83-5.62 6.24-5.62a5.7 5.7 0 0 1 4.6 2.46c1-1.26 1.98-2.25 2.87-2.82A7.4 7.4 0 0 1 77.4 48Zm0 4c-.51 0-1.13.22-1.82.65-2.13 1.36-6.25 8.43-7.76 11.18a2.43 2.43 0 0 1-2.14 1.31c-1.54 0-2.75-1.53-.14-3.48 3.91-2.93 2.54-7.72.67-8.01a1.54 1.54 0 0 0-.24-.02c-1.7 0-2.45 2.93-2.45 2.93s-2.2 5.52-5.97 9.3c-3.78 3.77-3.98 6.8-1.22 10.83 1.87 2.75 5.47 3.58 9.15 3.58 3.82 0 7.73-.9 9.93-1.46.1-.03 13.45-3.8 11.76-7-.29-.54-.75-.76-1.34-.76-2.38 0-6.71 3.54-8.57 3.54-.42 0-.71-.17-.83-.6-.8-2.85 12.05-4.05 10.97-8.17-.19-.73-.7-1.02-1.44-1.02-3.14 0-10.2 5.53-11.68 5.53-.1 0-.19-.03-.23-.1-.74-1.2-.34-2.04 4.88-5.2 5.23-3.16 8.9-5.06 6.8-7.33-.23-.26-.57-.38-.98-.38-3.18 0-10.67 6.82-10.67 6.82s-2.02 2.1-3.24 2.1a.74.74 0 0 1-.68-.38c-.87-1.46 8.05-8.22 8.55-11.01.34-1.9-.24-2.85-1.31-2.85Z" />
      <path fill="#FFD21E" d="M56.33 76.69c-2.75-4.04-2.56-7.07 1.22-10.84 3.77-3.77 5.97-9.3 5.97-9.3s.82-3.2 2.7-2.9c1.86.3 3.23 5.08-.68 8.01-3.92 2.93.78 4.92 2.28 2.17 1.51-2.75 5.63-9.82 7.76-11.18 2.13-1.35 3.64-.6 3.13 2.2-.5 2.79-9.42 9.55-8.55 11 .86 1.47 3.92-1.71 3.92-1.71s9.58-8.71 11.66-6.44c2.08 2.27-1.58 4.17-6.8 7.33-5.23 3.16-5.63 4-4.9 5.2.75 1.2 12.28-8.53 13.36-4.4 1.08 4.11-11.76 5.3-10.97 8.15.8 2.85 9.05-5.38 10.74-2.18 1.69 3.21-11.65 6.98-11.76 7.01-4.31 1.12-15.26 3.49-19.08-2.12Z" />
    </svg>
  );
}

/* ── Section wrapper ── */

function SectionWrapper({
  index,
  visibleSections,
  children,
}: {
  index: number;
  visibleSections: boolean[];
  everVisible?: boolean[];
  children: React.ReactNode;
}) {
  const section = SECTIONS[index];
  const isVisible = visibleSections[index];
  const delay = index * 80;

  return (
    <div
      className="relative sm:pl-9"
      style={{
        maxHeight: isVisible ? "20000px" : "0px",
        opacity: isVisible ? 1 : 0,
        overflow: "hidden",
        transition: [
          `max-height 600ms cubic-bezier(0.16, 1, 0.3, 1) ${isVisible ? delay : 0}ms`,
          `opacity 400ms cubic-bezier(0.16, 1, 0.3, 1) ${isVisible ? delay : 0}ms`,
        ].join(", "),
      }}
    >
      {/* Side label */}
      <div
        className="hidden sm:flex absolute left-0 top-6 w-7 justify-center"
      >
        <span className="form-side-label font-mono text-[9px] font-medium uppercase text-lb-text-muted whitespace-nowrap select-none">
          {section.sideLabel}
        </span>
      </div>

      <div className="bg-lb-surface border border-lb-border rounded-lg shadow-sm p-6 mb-3">
        {children}
      </div>
    </div>
  );
}

/* ── Component ── */

export default function SubmitPage() {
  const [hfUser, setHfUser] = useState<HfUser | null>(null);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<SubmitPayload | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hfStatus, setHfStatus] = useState<"idle" | "checking" | "found" | "not-found">("idle");
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [benchSubScoreKeys, setBenchSubScoreKeys] = useState<Record<string, string[]>>({});

  // Fetch sub-score keys from leaderboard data on mount
  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        if (!json?.data) return;
        const keys = extractSubScoreKeys(json.data);
        setBenchSubScoreKeys(keys);
        // Initialize subScores form fields
        const subScores: Record<string, Record<string, string>> = {};
        for (const [benchId, subKeys] of Object.entries(keys)) {
          subScores[benchId] = Object.fromEntries(subKeys.map((k) => [k, ""]));
        }
        setForm((prev) => ({ ...prev, subScores }));
      })
      .catch(() => {}); // non-fatal
  }, []);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── OAuth: pick up user from URL params or localStorage ── */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hfUserParam = params.get("hf_user");
    const authErrorParam = params.get("auth_error");

    if (hfUserParam) {
      try {
        const decoded = JSON.parse(atob(hfUserParam)) as HfUser & { accessToken?: string };
        const { accessToken, ...userDisplay } = decoded;
        setHfUser(userDisplay);
        localStorage.setItem(LS_KEY, JSON.stringify(userDisplay));
        if (accessToken) {
          localStorage.setItem(LS_TOKEN_KEY, accessToken);
        }
        window.history.replaceState({}, "", "/submit");
      } catch {
        setAuthError("Failed to parse authentication data.");
      }
      return;
    }

    if (authErrorParam) {
      const detail = params.get("detail");
      setAuthError(
        `Authentication failed (${authErrorParam})${detail ? `: ${detail}` : ""}. Please try again.`
      );
      setLoggingIn(false);
      window.history.replaceState({}, "", "/submit");
      return;
    }

    // Check localStorage for persisted user
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        setHfUser(JSON.parse(stored) as HfUser);
      }
    } catch {
      // localStorage unavailable or corrupted
    }
  }, []);

  const handleLogin = useCallback(() => {
    setLoggingIn(true);
    const params = new URLSearchParams({
      client_id: HF_CLIENT_ID,
      redirect_uri: HF_REDIRECT_URI,
      scope: "openid profile",
      response_type: "code",
      state: crypto.randomUUID(),
    });
    window.location.href = `https://huggingface.co/oauth/authorize?${params}`;
  }, []);

  const handleLogout = useCallback(() => {
    setHfUser(null);
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_TOKEN_KEY);
    setForm(INITIAL_FORM);
    setHfStatus("idle");
    setAutoFilledFields(new Set());
  }, []);

  /* ── Derived visibility ── */

  const isAuthenticated = hfUser !== null;
  const hfDone = hfStatus === "found" || hfStatus === "not-found";

  const visibleSections = useMemo(() => {
    const visible: boolean[] = [true]; // Auth section always visible
    for (let i = 1; i < SECTIONS.length; i++) {
      if (i === 1) {
        // Model section: visible when authenticated
        visible[i] = isAuthenticated;
      } else if (i === 2) {
        // Config section: visible when model valid + HF check done
        visible[i] = visible[i - 1] && SECTIONS[i - 1].isValid(form) && hfDone;
      } else {
        visible[i] = visible[i - 1] && SECTIONS[i - 1].isValid(form);
      }
    }
    return visible;
  }, [form, isAuthenticated, hfDone]);

  const [everVisible, setEverVisible] = useState<boolean[]>(
    () => SECTIONS.map((_, i) => i === 0)
  );

  useEffect(() => {
    setEverVisible((prev) => {
      let changed = false;
      const next = prev.map((v, i) => {
        if (!v && visibleSections[i]) { changed = true; return true; }
        return v;
      });
      return changed ? next : prev;
    });
  }, [visibleSections]);

  /* ── Form updaters ── */

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setAutoFilledFields((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const updateScore = useCallback((id: string, value: string) => {
    // Only allow digits, one decimal point, optional leading minus
    if (value !== "" && !/^-?\d*\.?\d*$/.test(value)) return;
    setForm((prev) => ({
      ...prev,
      scores: { ...prev.scores, [id]: value },
    }));
  }, []);

  const toggleScoreEnabled = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      scoreEnabled: { ...prev.scoreEnabled, [id]: !prev.scoreEnabled[id] },
      scores: prev.scoreEnabled[id]
        ? { ...prev.scores, [id]: "" }
        : prev.scores,
      subScoresExpanded: prev.scoreEnabled[id]
        ? { ...prev.subScoresExpanded, [id]: false }
        : prev.subScoresExpanded,
    }));
  }, []);

  const toggleSubScoresExpanded = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      subScoresExpanded: { ...prev.subScoresExpanded, [id]: !prev.subScoresExpanded[id] },
    }));
  }, []);

  const updateSubScore = useCallback((benchId: string, subKey: string, value: string) => {
    if (value !== "" && !/^-?\d*\.?\d*$/.test(value)) return;
    setForm((prev) => ({
      ...prev,
      subScores: {
        ...prev.subScores,
        [benchId]: { ...prev.subScores[benchId], [subKey]: value },
      },
    }));
  }, []);

  /* ── HuggingFace model lookup ── */

  useEffect(() => {
    if (!HF_MODEL_RE.test(form.modelName)) {
      setHfStatus("idle");
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    setHfStatus("checking");

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `https://huggingface.co/api/models/${form.modelName}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          setHfStatus("not-found");
          return;
        }

        const data = (await res.json()) as Record<string, unknown>;
        setHfStatus("found");

        const fills = new Set<string>();

        const modelType = inferModelType(data);
        if (modelType) {
          setForm((prev) => ({ ...prev, modelType }));
          fills.add("modelType");
        }

        const baseModel = inferBaseModel(data);
        if (baseModel) {
          setForm((prev) => ({ ...prev, baseModel }));
          fills.add("baseModel");
        }

        // Fetch config.json separately for torch_dtype
        try {
          const configRes = await fetch(
            `https://huggingface.co/${form.modelName}/resolve/main/config.json`,
            { signal: controller.signal }
          );
          if (configRes.ok) {
            const configJson = (await configRes.json()) as Record<string, unknown>;
            const precision = inferPrecision(configJson);
            if (precision) {
              setForm((prev) => ({ ...prev, precision }));
              fills.add("precision");
            }
          }
        } catch {
          // config.json fetch failed — skip precision auto-fill
        }

        setAutoFilledFields(fills);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setHfStatus("not-found");
        }
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form.modelName]);

  /* ── Submit ── */

  const buildPayload = useCallback((): SubmitPayload => {
    const scores: Record<string, number | null> = {};
    const subScoresPayload: Record<string, Record<string, number | null>> = {};

    for (const b of BENCHMARKS) {
      if (form.scoreEnabled[b.id] && form.scores[b.id] !== "") {
        scores[b.id] = parseFloat(form.scores[b.id]);
      } else {
        scores[b.id] = null;
      }

      // Include sub-scores if benchmark is enabled and has sub-score data
      const subKeys = benchSubScoreKeys[b.id];
      if (form.scoreEnabled[b.id] && subKeys && form.subScores[b.id]) {
        const subs: Record<string, number | null> = {};
        for (const sk of subKeys) {
          const val = form.subScores[b.id]?.[sk];
          subs[sk] = val && val !== "" ? parseFloat(val) : null;
        }
        // Only include if at least one sub-score is filled
        if (Object.values(subs).some((v) => v !== null)) {
          subScoresPayload[b.id] = subs;
        }
      }
    }

    return {
      userId: hfUser?.id || "",
      userName: hfUser?.name || "",
      modelName: form.modelName,
      modelType: form.modelType,
      precision: form.precision,
      revision: form.revision,
      weightType: form.weightType,
      baseModel: form.baseModel,
      backend: form.backend,
      scores,
      subScores: subScoresPayload,
      remarks: form.remarks,
    };
  }, [form, hfUser, benchSubScoreKeys]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    const payload = buildPayload();

    try {
      const accessToken = localStorage.getItem(LS_TOKEN_KEY) || "";
      const submitData = new FormData();
      submitData.append("payload", JSON.stringify(payload));
      if (form.zipFile) {
        submitData.append("zipFile", form.zipFile);
      }

      const res = await fetch("/api/submit/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
        body: submitData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = (data as { error?: string }).error || `Server error (${res.status})`;
        if (res.status === 401) {
          setHfUser(null);
          localStorage.removeItem(LS_KEY);
          localStorage.removeItem(LS_TOKEN_KEY);
        }
        throw new Error(errorMsg);
      }

      setSubmittedData(payload);
      setSubmitted(true);
    } catch (err) {
      const msg = (err as Error).message || "";
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch")) {
        setSubmitError("Could not reach the server. Please check your internet connection and try again.");
      } else {
        setSubmitError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }, [buildPayload, form.zipFile]);

  const handleReset = useCallback(() => {
    setSubmitted(false);
    setSubmittedData(null);
    setSubmitError(null);
    setForm(INITIAL_FORM);
    setHfStatus("idle");
    setAutoFilledFields(new Set());
    setEverVisible(SECTIONS.map((_, i) => i === 0));
  }, []);

  /* ── Shared styles ── */

  const inputClass =
    "w-full px-3 py-2.5 bg-lb-bg text-lb-text text-sm rounded-md border border-lb-border focus:outline-none focus:border-lb-border-emphasis focus:ring-2 focus:ring-lb-primary-light placeholder:text-lb-text-muted";

  const btnClass = (active: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-md border transition-all duration-150 ${
      active
        ? "bg-lb-nav text-white border-lb-nav"
        : "bg-lb-bg text-lb-text-secondary border-lb-border hover:text-lb-text hover:border-lb-border-emphasis"
    }`;

  const AutoBadge = ({ field }: { field: string }) =>
    autoFilledFields.has(field) ? (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-lb-primary bg-lb-primary-light px-2 py-0.5 rounded ml-2">
        auto-filled
      </span>
    ) : null;

  const HfStatusIndicator = () => {
    if (hfStatus === "idle") return null;

    const config = {
      checking: { color: "#d97706", text: "Checking HuggingFace...", pulse: true },
      found: { color: "#059669", text: "Found on HuggingFace — auto-filling available fields", pulse: false },
      "not-found": { color: "#d97706", text: "Not found on HuggingFace — you can still submit manually", pulse: false },
    }[hfStatus];

    return (
      <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: config.color }} role="status" aria-live="polite">
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.pulse ? "hf-pulse" : ""}`}
          style={{ backgroundColor: config.color }}
        />
        {config.text}
      </div>
    );
  };

  /* ── Success view ── */

  if (submitted && submittedData) {
    return (
      <div className="max-w-3xl mx-auto px-md py-lg animate-fade-in-up">
        <div className="bg-lb-primary-light border border-lb-primary-muted rounded-lg p-4 mb-6">
          <h1 className="font-heading text-lg font-semibold text-lb-text">
            Submission Received!
          </h1>
          <p className="text-sm text-lb-text-secondary mt-1">Thank you for submitting your model, our team will review it and add it to the leaderboard!</p>
        </div>

        <div className="bg-lb-surface border border-lb-border rounded-lg shadow-sm p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-4">
            Submission Summary
          </h2>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mb-4">
            <span className="text-lb-text-muted">Submitted by:</span>
            <span className="font-semibold text-lb-text">{submittedData.userName}</span>
            <span className="text-lb-text-muted">Model:</span>
            <span className="font-semibold text-lb-text">{submittedData.modelName}</span>
            <span className="text-lb-text-muted">Type:</span>
            <span className="text-lb-text">{submittedData.modelType}</span>
            <span className="text-lb-text-muted">Precision:</span>
            <span className="font-mono text-lb-text">{submittedData.precision}</span>
            <span className="text-lb-text-muted">Revision:</span>
            <span className="text-lb-text">{submittedData.revision}</span>
            <span className="text-lb-text-muted">Weight:</span>
            <span className="text-lb-text">{submittedData.weightType}</span>
            <span className="text-lb-text-muted">Backend:</span>
            <span className="text-lb-text">{submittedData.backend}</span>
            {submittedData.baseModel && (
              <>
                <span className="text-lb-text-muted">Base:</span>
                <span className="text-lb-text">{submittedData.baseModel}</span>
              </>
            )}
          </div>

          <div className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-2">
            Scores
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5 text-xs mb-4">
            {BENCHMARKS.map((b) => (
              <div key={b.id} className="flex justify-between">
                <span className="text-lb-text-muted">{b.name}:</span>
                <span className="font-mono text-lb-text">
                  {submittedData.scores[b.id] !== null ? submittedData.scores[b.id] : <span className="text-lb-text-muted">null</span>}
                </span>
              </div>
            ))}
          </div>

          {submittedData.remarks && (
            <>
              <div className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-1">
                Remarks
              </div>
              <p className="text-sm text-lb-text">{submittedData.remarks}</p>
            </>
          )}
        </div>
          
        <div className="flex justify-center mt-4">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-lb-nav text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity duration-150"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  /* ── Main form ── */

  return (
    <div className="max-w-3xl mx-auto px-md py-lg">
      <div className="animate-fade-in-up">
        <h1 className="font-heading text-heading font-semibold text-lb-text mb-2">
          Submit a Model
        </h1>
        <p className="text-sm text-lb-text-secondary mb-8">
          Authenticate with HuggingFace, then fill in each field below. The form expands as you go.
        </p>

        {/* S0: Auth */}
        <SectionWrapper visibleSections={visibleSections} index={0}>
          {!isAuthenticated ? (
            <div className="flex flex-col justify-center">
              <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-3">
                Authentication
              </label>
              {authError && (
                <div className="bg-lb-primary-light border border-lb-border-emphasis rounded-md p-3 mb-3 text-sm text-lb-text">
                  {authError}
                </div>
              )}
              <button
                onClick={handleLogin}
                disabled={loggingIn}
                className="inline-flex items-center justify-center max-w-[70%] mx-auto my-4 gap-2.5 px-5 py-2.5 bg-[#1e1b4b] text-white text-sm font-semibold rounded-lg
                  hover:bg-[#312e81] transition-colors duration-150
                  disabled:opacity-70 disabled:cursor-not-allowed min-w-[280px]"
              >
                {loggingIn ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <HfLogo className="w-5 h-5" />
                    Authenticate with Hugging Face
                  </>
                )}
              </button>
              <p className="text-xs text-lb-text-muted mt-2 mx-auto">
                Authenticate so that we can identify you and your evaluation results.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {hfUser.avatar && (
                  <img
                    src={hfUser.avatar}
                    alt={hfUser.name}
                    className="w-9 h-9 rounded-full border border-lb-border"
                  />
                )}
                <div>
                  <div className="text-sm font-semibold text-lb-text">{hfUser.name}</div>
                  <div className="text-xs text-lb-text-muted">Authenticated via HuggingFace</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-lb-text-muted hover:text-lb-text transition-colors duration-150"
              >
                Sign out
              </button>
            </div>
          )}
        </SectionWrapper>

        {/* S1: Model Name */}
        <SectionWrapper visibleSections={visibleSections} index={1}>
          <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
            Model Name (HuggingFace)
          </label>
          <input
            type="text"
            value={form.modelName}
            onChange={(e) => updateField("modelName", e.target.value)}
            placeholder="e.g., meta-llama/Llama-3-8B-Instruct"
            className={`${inputClass} ${
              hfStatus === "not-found" ? "!border-amber-400 !bg-amber-50" : ""
            } ${hfStatus === "found" ? "!border-lb-primary" : ""}`}
          />
          <HfStatusIndicator />
        </SectionWrapper>

        {/* S2: Model Configuration (combined card) */}
        <SectionWrapper visibleSections={visibleSections} index={2}>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-4">
            Model Configuration
          </h3>

          {/* Model Type */}
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
              Model Type <AutoBadge field="modelType" />
            </label>
            <div className="flex flex-wrap gap-sm">
              {["pretrained", "finetuned", "instruction", "rl"].map((t) => (
                <button
                  key={t}
                  onClick={() => updateField("modelType", t)}
                  className={btnClass(form.modelType === t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Precision */}
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
              Precision <AutoBadge field="precision" />
            </label>
            <div className="flex flex-wrap gap-sm">
              {["bfloat16", "float16", "float32", "int8"].map((p) => (
                <button
                  key={p}
                  onClick={() => updateField("precision", p)}
                  className={`${btnClass(form.precision === p)} font-mono`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Revision */}
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
              Model Revision
            </label>
            <input
              type="text"
              value={form.revision}
              onChange={(e) => updateField("revision", e.target.value)}
              placeholder="e.g., main, v1.0"
              className={inputClass}
            />
          </div>

          {/* Weight Type */}
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
              Weight Type
            </label>
            <div className="flex flex-wrap gap-sm">
              {["Original", "Delta", "Adapter"].map((w) => (
                <button
                  key={w}
                  onClick={() => updateField("weightType", w)}
                  className={btnClass(form.weightType === w)}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Evaluation Backend */}
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
              Evaluation Backend
            </label>
            <div className="flex flex-wrap gap-sm">
              {[
                { value: "vlmevalkit", label: "VLMEvalKit" },
                { value: "lmmseval", label: "LMMsEval" },
                { value: "others", label: "Others" },
              ].map((b) => (
                <button
                  key={b.value}
                  onClick={() => updateField("backend", b.value)}
                  className={btnClass(form.backend === b.value)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Base Model */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
              Base Model{" "}
              <span className="font-normal normal-case tracking-normal text-lb-text-muted">(optional)</span>
              <AutoBadge field="baseModel" />
            </label>
            <input
              type="text"
              value={form.baseModel}
              onChange={(e) => updateField("baseModel", e.target.value)}
              placeholder="e.g., meta-llama/Llama-2-7b"
              className={inputClass}
            />
          </div>
        </SectionWrapper>

        {/* S3: Benchmark Scores */}
        <SectionWrapper visibleSections={visibleSections} index={3}>
          <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
            Benchmark Scores
          </label>
          <p className="text-xs text-lb-text-muted mb-3">
            Check benchmarks you evaluated. Unchecked = not evaluated (null). At least one required.
          </p>
          <div className="space-y-1">
            {BENCHMARKS.map((b) => {
              const subKeys = benchSubScoreKeys[b.id];
              const hasSubScores = !!subKeys && subKeys.length > 0;
              const isExpanded = form.subScoresExpanded[b.id] && form.scoreEnabled[b.id] && hasSubScores;

              return (
                <div key={b.id}>
                  {/* Main score row */}
                  <div className="flex items-center gap-2.5 py-1">
                    <input
                      type="checkbox"
                      checked={form.scoreEnabled[b.id]}
                      onChange={() => toggleScoreEnabled(b.id)}
                      className="w-4 h-4 accent-lb-primary cursor-pointer"
                    />
                    <span
                      className={`text-xs font-medium min-w-[110px] ${
                        form.scoreEnabled[b.id] ? "text-lb-text" : "text-lb-text-muted"
                      }`}
                    >
                      {b.name}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.scores[b.id]}
                      onChange={(e) => updateScore(b.id, e.target.value)}
                      disabled={!form.scoreEnabled[b.id]}
                      placeholder="—"
                      className="flex-1 max-w-[100px] px-3 py-1.5 bg-lb-bg text-lb-text text-sm font-mono rounded-md
                        border border-lb-border focus:outline-none focus:border-lb-border-emphasis
                        focus:ring-2 focus:ring-lb-primary-light placeholder:text-lb-text-muted
                        disabled:opacity-35 disabled:cursor-not-allowed"
                    />
                    {/* Sub-scores expand button */}
                    {hasSubScores && form.scoreEnabled[b.id] && (
                      <button
                        onClick={() => toggleSubScoresExpanded(b.id)}
                        className="text-[10px] font-medium text-lb-primary hover:text-lb-text transition-colors duration-150 whitespace-nowrap"
                      >
                        {isExpanded ? "Hide subs" : `+ ${subKeys!.length} subs`}
                      </button>
                    )}
                  </div>

                  {/* Sub-scores panel */}
                  <div
                    style={{
                      maxHeight: isExpanded ? "1500px" : "0px",
                      opacity: isExpanded ? 1 : 0,
                      overflow: "hidden",
                      transition: "max-height 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease",
                    }}
                  >
                    <div className="ml-6 pl-4 border-l-2 border-lb-primary-muted py-2 mb-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-lb-text-muted mb-2">
                        Sub-scores for {b.name}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        {subKeys?.map((sk) => (
                          <div key={sk} className="flex items-center gap-2 py-0.5">
                            <span className="text-[11px] text-lb-text-muted min-w-[140px] truncate" title={sk}>
                              {formatSubScoreLabel(sk)}
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={form.subScores[b.id]?.[sk] ?? ""}
                              onChange={(e) => updateSubScore(b.id, sk, e.target.value)}
                              placeholder="—"
                              className="flex-1 max-w-[80px] px-2 py-1 bg-lb-bg text-lb-text text-xs font-mono rounded-md
                                border border-lb-border focus:outline-none focus:border-lb-border-emphasis
                                focus:ring-2 focus:ring-lb-primary-light placeholder:text-lb-text-muted"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <ZipUploadZone
            file={form.zipFile}
            onFileAccepted={(f) => updateField("zipFile", f)}
            onFileRemoved={() => updateField("zipFile", null)}
          />
        </SectionWrapper>

        {/* S4: Remarks */}
        <SectionWrapper visibleSections={visibleSections} index={4}>
          <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
            Remarks <span className="font-normal normal-case tracking-normal text-lb-text-muted">(optional)</span>
          </label>
          <textarea
            value={form.remarks}
            onChange={(e) => updateField("remarks", e.target.value)}
            placeholder="Any additional notes about this submission..."
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </SectionWrapper>

        {/* S5: Review & Submit */}
        <SectionWrapper visibleSections={visibleSections} index={5}>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-4">
            Review & Submit
          </h3>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mb-4">
            <span className="text-lb-text-muted">Submitted by:</span>
            <span className="font-semibold text-lb-text">{hfUser?.name}</span>
            <span className="text-lb-text-muted">Model:</span>
            <span className="font-semibold text-lb-text">{form.modelName}</span>
            <span className="text-lb-text-muted">Type:</span>
            <span className="text-lb-text">{form.modelType}</span>
            <span className="text-lb-text-muted">Precision:</span>
            <span className="font-mono text-lb-text">{form.precision}</span>
            <span className="text-lb-text-muted">Revision:</span>
            <span className="text-lb-text">{form.revision}</span>
            <span className="text-lb-text-muted">Weight:</span>
            <span className="text-lb-text">{form.weightType}</span>
            <span className="text-lb-text-muted">Backend:</span>
            <span className="text-lb-text">{form.backend}</span>
            {form.baseModel && (
              <>
                <span className="text-lb-text-muted">Base:</span>
                <span className="text-lb-text">{form.baseModel}</span>
              </>
            )}
            {form.zipFile && (
              <>
                <span className="text-lb-text-muted">Eval Results:</span>
                <span className="font-mono text-lb-text">
                  {form.zipFile.name}{" "}
                  <span className="text-lb-text-muted font-sans">
                    ({form.zipFile.size < 1024 * 1024
                      ? `${(form.zipFile.size / 1024).toFixed(1)} KB`
                      : `${(form.zipFile.size / (1024 * 1024)).toFixed(1)} MB`})
                  </span>
                </span>
              </>
            )}
          </div>

          <div className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-2">
            Scores
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5 text-xs mb-4">
            {BENCHMARKS.map((b) => (
              <div key={b.id} className="flex justify-between">
                <span className="text-lb-text-muted">{b.name}:</span>
                <span className="font-mono text-lb-text">
                  {form.scoreEnabled[b.id] && form.scores[b.id] !== ""
                    ? form.scores[b.id]
                    : <span className="text-lb-text-muted">null</span>}
                </span>
              </div>
            ))}
          </div>

          {form.remarks && (
            <div className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-1">
                Remarks
              </div>
              <p className="text-sm text-lb-text">{form.remarks}</p>
            </div>
          )}

          {submitError && (
            <div className="bg-lb-primary-light border border-lb-border-emphasis rounded-md p-4 mb-4 text-sm text-lb-text">
              <div className="font-semibold mb-1">Submission could not be completed</div>
              <p className="text-lb-text-secondary">{submitError}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold bg-lb-primary text-white rounded-lg
              hover:opacity-90 transition-opacity duration-150
              disabled:opacity-70 disabled:cursor-not-allowed min-w-[140px]"
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </SectionWrapper>
      </div>
    </div>
  );
}
