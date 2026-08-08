import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-[var(--color-mocha-text)]">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="text-sm text-[var(--color-mocha-subtext0)]">
        That route does not exist in Mission Control.
      </p>
      <Link to="/" className="text-sm text-[var(--color-brand-sky)] underline">
        Back to home
      </Link>
    </div>
  );
}
