"use client";

import { useState, useRef, useCallback, KeyboardEvent, ChangeEvent } from "react";
import { LuSearch, LuFilter, LuX } from "react-icons/lu";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  // Parse existing comma-separated value into tags + trailing input
  const parts = value.split(",").map((s) => s.trim());
  const completedTags = parts.slice(0, -1).filter(Boolean);
  const inputValue = parts[parts.length - 1] || "";

  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const buildValue = useCallback(
    (tags: string[], current: string) => {
      const all = [...tags, current].filter((s, i) => i === tags.length || s !== "");
      // If there are tags, join them with commas and append trailing comma + current input
      if (tags.length > 0) {
        return tags.join(",") + "," + current;
      }
      return current;
    },
    []
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // If user types a comma, commit the text before it as a tag
      if (raw.includes(",")) {
        const segments = raw.split(",");
        const newTags = segments.slice(0, -1).map((s) => s.trim()).filter(Boolean);
        const remaining = segments[segments.length - 1];
        onChange(buildValue([...completedTags, ...newTags], remaining));
      } else {
        onChange(buildValue(completedTags, raw));
      }
    },
    [completedTags, onChange, buildValue]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      // Backspace on empty input removes the last tag
      if (e.key === "Backspace" && inputValue === "" && completedTags.length > 0) {
        e.preventDefault();
        const newTags = completedTags.slice(0, -1);
        onChange(buildValue(newTags, ""));
      }
      // Enter commits current input as a tag
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault();
        onChange(buildValue([...completedTags, inputValue.trim()], ""));
      }
    },
    [inputValue, completedTags, onChange, buildValue]
  );

  const removeTag = useCallback(
    (index: number) => {
      const newTags = completedTags.filter((_, i) => i !== index);
      onChange(buildValue(newTags, inputValue));
      inputRef.current?.focus();
    },
    [completedTags, inputValue, onChange, buildValue]
  );

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 w-full px-3 py-2 bg-lb-bg text-lb-text text-sm rounded-md
        border ${focused ? "border-lb-border-emphasis ring-2 ring-lb-primary-light" : "border-lb-border"}
        transition-all duration-200 cursor-text min-h-[42px]`}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Search icon → filter icon when badges active */}
      {completedTags.length === 0 ? (
        <LuSearch className="w-4 h-4 text-lb-text-muted flex-shrink-0" />
      ) : (
        <LuFilter className="w-4 h-4 text-lb-primary flex-shrink-0" />
      )}

      {/* Tags */}
      {completedTags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-lb-primary-light text-lb-primary text-xs font-medium rounded-md"
        >
          {tag}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeTag(i);
            }}
            className="hover:text-lb-text transition-colors duration-100 leading-none"
            aria-label={`Remove ${tag}`}
          >
            <LuX className="w-3 h-3" />
          </button>
        </span>
      ))}

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={completedTags.length === 0 ? "Search models..." : ""}
        className="flex-1 min-w-[80px] bg-transparent outline-none placeholder:text-lb-text-muted"
      />
    </div>
  );
}
