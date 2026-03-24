"use client";

import { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  showIcon?: boolean;
}

export default function Tooltip({ content, children, showIcon = false }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!visible) return;
    setCoords({ x: e.clientX, y: e.clientY });
  }, [visible]);

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  }, []);

  return (
    <span
      className="inline-flex items-start gap-0"
      onMouseEnter={show}
      onMouseMove={handleMouseMove}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {showIcon && (
        <span className="text-[9px] leading-none opacity-50 font-mono font-bold -mt-0.5 ml-0.5 select-none">
          ?
        </span>
      )}
      {visible && content && mounted && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: coords.y - 10,
            left: coords.x,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="px-3 py-2.5 text-[11px] leading-relaxed text-lb-text bg-lb-surface border border-lb-border rounded-lg shadow-lg max-w-[320px] w-max">
            {content}
          </div>
        </div>,
        document.body
      )}
    </span>
  );
}
