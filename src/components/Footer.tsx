export default function Footer() {
  return (
    <footer className="border-t border-lb-border bg-lb-surface py-lg px-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-sm text-sm text-lb-text-secondary">
        <span>
          EASI Leaderboard &middot;{" "}
          <a
            href="https://github.com/EvolvingLMMs-Lab"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 decoration-lb-border hover:text-lb-primary transition-colors duration-150"
          >
            LMMs-Lab
          </a>
        </span>
        <span className="text-lb-text-muted">
          Built with Next.js &middot; Data updated periodically
        </span>
      </div>
    </footer>
  );
}
