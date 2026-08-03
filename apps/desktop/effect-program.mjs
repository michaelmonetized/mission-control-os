/**
 * Real Effect pipeline for agent bootstrap (ADR-0011).
 * Graph: pair → install → health (retry) → optional heartbeat.
 * Falls back if Effect import fails at runtime.
 */
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Schedule from "effect/Schedule";
import * as Duration from "effect/Duration";

/**
 * @param {{
 *   pair: () => Promise<{ ok: boolean, error?: string, agencyId?: string }>,
 *   install: () => Promise<{ ok: boolean, error?: string }>,
 *   health: () => Promise<boolean>,
 *   heartbeat?: () => Promise<{ ok: boolean }>,
 * }} services
 */
export async function runAgentBootstrapEffect(services) {
  const program = Effect.gen(function* () {
    const pair = yield* Effect.tryPromise({
      try: () => services.pair(),
      catch: (e) => e,
    });
    if (!pair.ok) {
      return yield* Effect.fail(new Error(pair.error ?? "pair failed"));
    }

    const install = yield* Effect.tryPromise({
      try: () => services.install(),
      catch: (e) => e,
    });

    // Retry health a few times — LaunchAgent may need a beat to come up
    const healthOk = yield* Effect.tryPromise({
      try: () => services.health(),
      catch: () => false,
    }).pipe(
      Effect.flatMap((ok) => (ok ? Effect.succeed(true) : Effect.fail(new Error("unhealthy")))),
      Effect.retry(Schedule.recurs(2).pipe(Schedule.addDelay(() => Duration.millis(400)))),
      Effect.catchAll(() => Effect.succeed(false)),
    );

    let heartbeatOk = null;
    if (typeof services.heartbeat === "function") {
      const hb = yield* Effect.tryPromise({
        try: () => services.heartbeat(),
        catch: () => ({ ok: false }),
      });
      heartbeatOk = Boolean(hb?.ok);
    }

    return {
      agencyId: pair.agencyId,
      installOk: install.ok,
      healthOk: Boolean(healthOk),
      heartbeatOk,
      stages: ["pair", "install", "health", services.heartbeat ? "heartbeat" : null].filter(Boolean),
    };
  });

  const exit = await Effect.runPromiseExit(program);
  if (Exit.isSuccess(exit)) {
    return { ok: true, result: exit.value };
  }
  return {
    ok: false,
    error: String(exit.cause),
  };
}
