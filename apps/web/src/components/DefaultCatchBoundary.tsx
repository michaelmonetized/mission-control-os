import type { ErrorComponentProps } from "@tanstack/react-router";
import { ErrorComponent, Link, rootRouteId, useMatch, useRouter } from "@tanstack/react-router";

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });

  console.error(error);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-[var(--color-mocha-text)]">
      <ErrorComponent error={error} />
      <div className="flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          className="rounded-md border border-[var(--color-mocha-surface1)] px-3 py-1.5 hover:bg-[var(--color-mocha-surface0)]"
          onClick={() => router.invalidate()}
        >
          Try again
        </button>
        {isRoot ? (
          <Link
            to="/"
            className="rounded-md border border-[var(--color-mocha-surface1)] px-3 py-1.5 hover:bg-[var(--color-mocha-surface0)]"
          >
            Home
          </Link>
        ) : (
          <Link
            to="/"
            className="rounded-md border border-[var(--color-mocha-surface1)] px-3 py-1.5 hover:bg-[var(--color-mocha-surface0)]"
            onClick={(e) => {
              e.preventDefault();
              window.history.back();
            }}
          >
            Go back
          </Link>
        )}
      </div>
    </div>
  );
}
