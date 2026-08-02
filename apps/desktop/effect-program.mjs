/**
 * Real Effect pipeline for agent bootstrap (ADR-0011).
 * Falls back if Effect import fails at runtime.
 */
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";

/**
 * @param {{
 *   pair: () => Promise<{ ok: boolean, error?: string, agencyId?: string }>,
 *   install: () => Promise<{ ok: boolean, error?: string }>,
 *   health: () => Promise<boolean>,
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
    const health = yield* Effect.tryPromise({
      try: () => services.health(),
      catch: () => false,
    });
    return {
      agencyId: pair.agencyId,
      installOk: install.ok,
      healthOk: Boolean(health),
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
