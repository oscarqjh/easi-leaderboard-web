export default function Footer() {
  return (
    <footer className="border-t border-lb-border bg-lb-surface py-lg px-md">
      <div className="max-w-7xl mx-auto text-center text-sm text-lb-text-secondary">
        <span>
          EASI Leaderboard &middot;{" "}
          <img src="/icon.png" alt="LMMs-Lab" className="inline-block w-4 h-4 -mt-0.5" />{" "}
          <a
            href="https://www.lmms-lab.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 decoration-lb-border hover:text-lb-primary transition-colors duration-150"
          >
            LMMs-Lab
          </a>
          {" "}&middot;{" "}
          <a
            href="/api-docs"
            className="underline underline-offset-2 decoration-lb-border hover:text-lb-primary transition-colors duration-150"
          >
            API Docs
          </a>
        </span>
      </div>
    </footer>
  );
}
