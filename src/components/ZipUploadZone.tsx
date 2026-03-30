"use client";

import { useState, useRef, useCallback } from "react";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];

type UploadState = "idle" | "hover" | "validating" | "success" | "error";

export interface ZipUploadResult {
  file: File;
}

interface ZipUploadZoneProps {
  uploadResult: ZipUploadResult | null;
  onFileAccepted: (result: ZipUploadResult) => void;
  onFileRemoved: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateFilename(name: string, max = 40): string {
  if (name.length <= max) return name;
  const ext = name.lastIndexOf(".");
  if (ext < 0) return name.slice(0, max - 3) + "...";
  const extension = name.slice(ext);
  const base = name.slice(0, max - extension.length - 3);
  return `${base}...${extension}`;
}

export default function ZipUploadZone({
  uploadResult,
  onFileAccepted,
  onFileRemoved,
}: ZipUploadZoneProps) {
  const [state, setState] = useState<UploadState>(uploadResult ? "success" : "idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeFile, setActiveFile] = useState<{ name: string; size: number } | null>(null);
  const dragCounter = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = useCallback(
    async (f: File) => {
      // Extension check
      if (!f.name.toLowerCase().endsWith(".zip")) {
        setState("error");
        setErrorMsg("Invalid file type. Please upload a .zip file.");
        return;
      }

      // Size check
      if (f.size > MAX_SIZE) {
        setState("error");
        setErrorMsg(
          `File too large (${formatFileSize(f.size)}). Maximum size is 20 MB.`
        );
        return;
      }

      // Magic bytes check
      setActiveFile({ name: f.name, size: f.size });
      setState("validating");
      try {
        const slice = f.slice(0, 4);
        const buf = await slice.arrayBuffer();
        const bytes = new Uint8Array(buf);
        const isZip = ZIP_MAGIC.every((b, i) => bytes[i] === b);
        if (!isZip) {
          setState("error");
          setErrorMsg("File is not a valid ZIP archive.");
          return;
        }
      } catch {
        setState("error");
        setErrorMsg("Could not read the file. Please try again.");
        return;
      }

      setState("success");
      onFileAccepted({ file: f });
    },
    [onFileAccepted]
  );

  const hasFile = uploadResult !== null;

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (hasFile) return;
      dragCounter.current++;
      if (dragCounter.current === 1) setState("hover");
    },
    [hasFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (hasFile) return;
      dragCounter.current--;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setState((prev) => (prev === "hover" ? "idle" : prev));
      }
    },
    [hasFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      if (hasFile) return;

      const files = Array.from(e.dataTransfer.files);
      const zipFile = files.find((f) =>
        f.name.toLowerCase().endsWith(".zip")
      );
      if (!zipFile) {
        setState("error");
        setErrorMsg("No .zip file found. Please upload a .zip file.");
        return;
      }
      validateAndUpload(zipFile);
    },
    [hasFile, validateAndUpload]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) validateAndUpload(f);
      e.target.value = "";
    },
    [validateAndUpload]
  );

  const handleClick = useCallback(() => {
    if (hasFile) return;
    inputRef.current?.click();
  }, [hasFile]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (hasFile) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [hasFile]
  );

  const handleRemove = useCallback(() => {
    setState("idle");
    setErrorMsg("");
    setActiveFile(null);
    onFileRemoved();
  }, [onFileRemoved]);

  // ── Label + description (shared across all states) ──
  const header = (
    <>
      <label className="block text-xs font-semibold uppercase tracking-widest text-lb-text-muted mb-sm">
        Evaluation Results
      </label>
      <p className="text-xs text-lb-text-muted mb-2">
        Upload a .zip file containing all evaluation result files for verification.
      </p>
    </>
  );

  // ── Success state ──
  if (state === "success" && uploadResult) {
    return (
      <div className="mt-4">
        {header}
        <div
          className="border-2 border-lb-primary rounded-[14px] p-5 animate-fade-in-up"
          style={{ background: "rgba(99,102,241,0.04)" }}
        >
          <span className="sr-only" aria-live="polite">
            File uploaded successfully: {uploadResult.file.name}
          </span>
          <div className="flex items-center gap-3.5">
            <div
              className="w-11 h-11 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(99,102,241,0.08)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="2" />
                <path d="M8 12.5L11 15.5L16.5 9" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[13px] font-semibold text-lb-text truncate">
                {truncateFilename(uploadResult.file.name)}
              </p>
              <p className="text-xs text-lb-text-secondary">
                {formatFileSize(uploadResult.file.size)}
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="px-3.5 py-1.5 bg-transparent border border-lb-border rounded-md text-xs text-lb-text-secondary
                hover:text-lb-text hover:border-lb-border-emphasis transition-colors duration-150"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Processing state (validating) ──
  if (state === "validating") {
    const msg = {
      title: `Validating${activeFile ? ` ${truncateFilename(activeFile.name)}` : ""}...`,
      subtitle: `Checking file integrity${activeFile ? ` \u00b7 ${formatFileSize(activeFile.size)}` : ""}`,
    };

    return (
      <div className="mt-4">
        {header}
        <div className="border-2 border-lb-border-emphasis rounded-[14px] p-7 text-center bg-lb-bg">
          <div
            className="w-10 h-10 mx-auto mb-3.5 border-[3px] border-lb-border rounded-full animate-spin-slow"
            style={{ borderTopColor: "#6366f1" }}
          />
          <p className="text-sm font-semibold text-lb-text" aria-live="polite">
            {msg.title}
          </p>
          <p className="text-xs text-lb-text-secondary">
            {msg.subtitle}
          </p>
        </div>
      </div>
    );
  }

  // ── Idle / Hover / Error states ──
  const isHover = state === "hover";
  const isError = state === "error";

  return (
    <div className="mt-4">
      {header}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload evaluation results zip file"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-[14px] p-7 text-center cursor-pointer transition-all duration-200 ${
          isHover
            ? "border-2 border-lb-primary"
            : isError
              ? "border-2 border-dashed border-lb-border-emphasis"
              : "border-2 border-dashed border-lb-border"
        }`}
        style={{
          background: isHover
            ? "rgba(99,102,241,0.06)"
            : "var(--color-lb-bg, #faf9fc)",
          boxShadow: isHover
            ? "0 0 0 4px rgba(99,102,241,0.08)"
            : "none",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={handleInputChange}
        />

        {isError ? (
          <>
            <div
              className="w-11 h-11 mx-auto mb-3 rounded-[10px] flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.06)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#1e1b4b" strokeWidth="2" />
                <path d="M12 8V13M12 16V16.01" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-lb-text mb-1" aria-live="polite">
              {errorMsg}
            </p>
            <p className="text-xs text-lb-text-secondary">
              Drop a different file or{" "}
              <span className="text-lb-primary underline underline-offset-2">
                click to browse
              </span>
            </p>
          </>
        ) : isHover ? (
          <>
            <div className="relative w-[52px] h-[60px] mx-auto mb-3.5">
              <div
                className="w-[44px] h-[52px] border-2 border-lb-primary rounded-md mx-auto relative"
                style={{ background: "rgba(99,102,241,0.08)" }}
              >
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-1 bg-lb-primary rounded-[1px]" />
                <div className="absolute top-[15px] left-1/2 -translate-x-1/2 w-2 h-1 bg-lb-primary rounded-[1px] opacity-60" />
                <div className="absolute top-[22px] left-1/2 -translate-x-1/2 w-2 h-1 bg-lb-primary rounded-[1px] opacity-30" />
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 font-mono text-[8px] font-bold text-lb-primary">
                  .ZIP
                </span>
              </div>
              <div className="absolute -bottom-0.5 -right-1.5 w-[22px] h-[22px] bg-lb-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xs leading-none">&#8593;</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-lb-primary">
              Drop to upload
            </p>
            <p className="text-xs text-lb-text-secondary">
              Release to start upload
            </p>
          </>
        ) : (
          <>
            <div className="relative w-[52px] h-[60px] mx-auto mb-3.5">
              <div
                className="w-[44px] h-[52px] border-2 border-lb-primary rounded-md mx-auto relative"
                style={{ background: "rgba(99,102,241,0.04)" }}
              >
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-1 bg-lb-primary rounded-[1px]" />
                <div className="absolute top-[15px] left-1/2 -translate-x-1/2 w-2 h-1 bg-lb-primary rounded-[1px] opacity-60" />
                <div className="absolute top-[22px] left-1/2 -translate-x-1/2 w-2 h-1 bg-lb-primary rounded-[1px] opacity-30" />
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 font-mono text-[8px] font-bold text-lb-primary">
                  .ZIP
                </span>
              </div>
              <div className="absolute -bottom-0.5 -right-1.5 w-[22px] h-[22px] bg-lb-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xs leading-none">&#8593;</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-lb-text">
              Upload Evaluation Results
            </p>
            <p className="text-xs text-lb-text-secondary mt-1">
              Drag &amp; drop your{" "}
              <span className="font-mono text-lb-primary">.zip</span> file
              here, or{" "}
              <span className="text-lb-primary underline underline-offset-2">
                click to browse
              </span>
            </p>
            <p className="text-[11px] text-lb-text-muted mt-1">
              ZIP only &middot; Max 20 MB &middot; Required
            </p>
          </>
        )}
      </div>
    </div>
  );
}
