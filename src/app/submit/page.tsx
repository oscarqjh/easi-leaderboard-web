"use client";

import { useState } from "react";
import { BENCHMARKS } from "@/lib/constants";

interface FormData {
  modelName: string;
  modelType: string;
  precision: string;
  revision: string;
  weightType: string;
  baseModel: string;
  scores: Record<string, string>;
  commitMessage: string;
}

const STEPS = [
  "Model Name",
  "Model Type",
  "Precision",
  "Revision",
  "Weight Type",
  "Base Model",
  "Benchmark Scores",
  "Commit Message",
  "Review & Submit",
];

const INITIAL_FORM: FormData = {
  modelName: "",
  modelType: "instruction",
  precision: "bfloat16",
  revision: "main",
  weightType: "Original",
  baseModel: "",
  scores: Object.fromEntries(BENCHMARKS.map((b) => [b.id, ""])),
  commitMessage: "",
};

export default function SubmitPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateScore = (id: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      scores: { ...prev.scores, [id]: value },
    }));
  };

  const canNext = () => {
    switch (step) {
      case 0:
        return form.modelName.trim().length > 0;
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const generateJSON = () => {
    const scores: Record<string, number | null> = {};
    for (const [k, v] of Object.entries(form.scores)) {
      scores[k] = v ? parseFloat(v) : null;
    }
    return JSON.stringify(
      {
        name: form.modelName,
        type: form.modelType,
        precision: form.precision,
        revision: form.revision,
        weightType: form.weightType,
        baseModel: form.baseModel,
        scores,
        commitMessage: form.commitMessage,
      },
      null,
      2
    );
  };

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-md py-lg animate-fade-in-up">
        <h1 className="font-heading text-heading font-semibold text-lb-text mb-md">
          Submission Generated
        </h1>
        <p className="text-sm text-lb-text-secondary mb-md">
          Copy the JSON below and submit it via GitHub pull request.
        </p>
        <div className="bg-lb-surface border border-lb-border rounded-lg shadow-sm p-md">
          <pre className="font-mono text-xs text-lb-text overflow-x-auto whitespace-pre">
            {generateJSON()}
          </pre>
        </div>
        <button
          onClick={() => {
            setSubmitted(false);
            setStep(0);
            setForm(INITIAL_FORM);
          }}
          className="mt-md px-4 py-2 bg-lb-nav text-white text-sm font-medium rounded-md
            hover:opacity-90 transition-opacity duration-150"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-md py-lg">
      <div className="animate-fade-in-up">
        <h1 className="font-heading text-heading font-semibold text-lb-text mb-md">
          Submit a Model
        </h1>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-lg overflow-x-auto pb-sm">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <button
                onClick={() => setStep(i)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap rounded-md transition-all duration-150
                  ${
                    i === step
                      ? "bg-lb-nav text-white"
                      : i < step
                      ? "bg-lb-accent-light text-lb-primary"
                      : "bg-lb-bg text-lb-text-muted border border-lb-border"
                  }
                `}
              >
                <span className="font-mono">{i + 1}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-4 h-0.5 rounded-full ${
                    i < step ? "bg-lb-primary" : "bg-lb-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form steps */}
        <div className="bg-lb-surface border border-lb-border rounded-lg shadow-sm p-lg min-h-[200px]">
          {step === 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
                Model Name
              </label>
              <input
                type="text"
                value={form.modelName}
                onChange={(e) => updateField("modelName", e.target.value)}
                placeholder="e.g., organization/model-name"
                className="w-full px-3 py-2.5 bg-lb-bg text-lb-text text-sm rounded-md
                  border border-lb-border focus:outline-none focus:border-lb-border-emphasis
                  focus:ring-2 focus:ring-lb-primary-light placeholder:text-lb-text-muted"
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
                Model Type
              </label>
              <div className="flex flex-wrap gap-sm">
                {["pretrained", "finetuned", "instruction", "rl"].map((t) => (
                  <button
                    key={t}
                    onClick={() => updateField("modelType", t)}
                    className={`px-4 py-2 text-sm font-medium rounded-md border transition-all duration-150
                      ${
                        form.modelType === t
                          ? "bg-lb-nav text-white border-lb-nav"
                          : "bg-lb-bg text-lb-text-secondary border-lb-border hover:text-lb-text hover:border-lb-border-emphasis"
                      }
                    `}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
                Precision
              </label>
              <div className="flex flex-wrap gap-sm">
                {["bfloat16", "float16", "float32", "int8"].map((p) => (
                  <button
                    key={p}
                    onClick={() => updateField("precision", p)}
                    className={`px-4 py-2 text-sm font-mono font-medium rounded-md border transition-all duration-150
                      ${
                        form.precision === p
                          ? "bg-lb-nav text-white border-lb-nav"
                          : "bg-lb-bg text-lb-text-secondary border-lb-border hover:text-lb-text hover:border-lb-border-emphasis"
                      }
                    `}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
                Model Revision
              </label>
              <input
                type="text"
                value={form.revision}
                onChange={(e) => updateField("revision", e.target.value)}
                placeholder="e.g., main, v1.0"
                className="w-full px-3 py-2.5 bg-lb-bg text-lb-text text-sm rounded-md
                  border border-lb-border focus:outline-none focus:border-lb-border-emphasis
                  focus:ring-2 focus:ring-lb-primary-light placeholder:text-lb-text-muted"
              />
            </div>
          )}

          {step === 4 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
                Weight Type
              </label>
              <div className="flex flex-wrap gap-sm">
                {["Original", "Delta", "Adapter"].map((w) => (
                  <button
                    key={w}
                    onClick={() => updateField("weightType", w)}
                    className={`px-4 py-2 text-sm font-medium rounded-md border transition-all duration-150
                      ${
                        form.weightType === w
                          ? "bg-lb-nav text-white border-lb-nav"
                          : "bg-lb-bg text-lb-text-secondary border-lb-border hover:text-lb-text hover:border-lb-border-emphasis"
                      }
                    `}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
                Base Model (optional)
              </label>
              <input
                type="text"
                value={form.baseModel}
                onChange={(e) => updateField("baseModel", e.target.value)}
                placeholder="e.g., meta-llama/Llama-2-7b"
                className="w-full px-3 py-2.5 bg-lb-bg text-lb-text text-sm rounded-md
                  border border-lb-border focus:outline-none focus:border-lb-border-emphasis
                  focus:ring-2 focus:ring-lb-primary-light placeholder:text-lb-text-muted"
              />
            </div>
          )}

          {step === 6 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-md">
                Benchmark Scores
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                {BENCHMARKS.map((b) => (
                  <div key={b.id} className="flex items-center gap-sm">
                    <span className="w-32 text-xs font-medium text-lb-text truncate">
                      {b.name}
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      value={form.scores[b.id]}
                      onChange={(e) => updateScore(b.id, e.target.value)}
                      placeholder="0.0"
                      className="flex-1 px-3 py-1.5 bg-lb-bg text-lb-text text-sm font-mono rounded-md
                        border border-lb-border focus:outline-none focus:border-lb-border-emphasis
                        focus:ring-2 focus:ring-lb-primary-light placeholder:text-lb-text-muted"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
                Commit Message
              </label>
              <textarea
                value={form.commitMessage}
                onChange={(e) => updateField("commitMessage", e.target.value)}
                placeholder="Brief description of the submission..."
                rows={3}
                className="w-full px-3 py-2.5 bg-lb-bg text-lb-text text-sm rounded-md
                  border border-lb-border focus:outline-none focus:border-lb-border-emphasis
                  focus:ring-2 focus:ring-lb-primary-light placeholder:text-lb-text-muted resize-none"
              />
            </div>
          )}

          {step === 8 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-md">
                Review Submission
              </h3>
              <div className="space-y-sm text-sm">
                <div>
                  <span className="text-lb-text-muted">Model:</span>{" "}
                  <span className="font-semibold text-lb-text">{form.modelName}</span>
                </div>
                <div>
                  <span className="text-lb-text-muted">Type:</span>{" "}
                  <span className="text-lb-text">{form.modelType}</span>
                </div>
                <div>
                  <span className="text-lb-text-muted">Precision:</span>{" "}
                  <span className="font-mono text-lb-text">{form.precision}</span>
                </div>
                <div>
                  <span className="text-lb-text-muted">Revision:</span>{" "}
                  <span className="text-lb-text">{form.revision}</span>
                </div>
                <div className="mt-md">
                  <span className="text-lb-text-muted">Scores:</span>
                  <div className="mt-sm grid grid-cols-2 sm:grid-cols-3 gap-xs text-xs">
                    {BENCHMARKS.map((b) => (
                      <div key={b.id} className="flex justify-between">
                        <span className="text-lb-text-muted">{b.name}:</span>
                        <span className="font-mono text-lb-text">
                          {form.scores[b.id] || "-/-"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-md">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-4 py-2 text-sm font-medium bg-lb-surface border border-lb-border rounded-md
              text-lb-text-secondary hover:text-lb-text hover:border-lb-border-emphasis
              transition-all duration-150
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="px-4 py-2 text-sm font-medium bg-lb-nav text-white rounded-md
                hover:opacity-90 transition-opacity duration-150
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium bg-lb-primary text-white rounded-md
                hover:opacity-90 transition-opacity duration-150"
            >
              Generate JSON
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
