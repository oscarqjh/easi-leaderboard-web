interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lb-text-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search models (comma-separated)..."
        className="w-full pl-10 pr-3 py-2 bg-lb-surface text-lb-text text-sm
          shadow-border-thin placeholder:text-lb-text-muted
          focus:outline-none focus:shadow-border-medium focus:text-lb-primary
          transition-shadow duration-150"
      />
    </div>
  );
}
