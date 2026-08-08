/**
 * Real Effect pipelines for agent lifecycle (ADR-0011).
 * Graphs:
 *   bootstrap: pair → install → health (retry) → heartbeat
 *   status:    health → heartbeat (presence)
 *   restart:   stop → install → health → heartbeat
 *   unpair:    clear secrets (daemon remains installed until uninstall script)
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
 *   stop?: () => Promise<{ ok: boolean, error?: string }>,
 *   unpair?: () => Promise<{ ok: boolean }>,
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

    const healthOk = yield* retryHealth(services.health);

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

  return runExit(program);
}

/**
 * Lightweight presence poll — health + optional heartbeat (ADR-0011 daemon lifecycle).
 * @param {{ health: () => Promise<boolean>, heartbeat?: () => Promise<{ ok: boolean }> }} services
 */
export async function runAgentStatusEffect(services) {
  const program = Effect.gen(function* () {
    const healthOk = yield* Effect.tryPromise({
      try: () => services.health(),
      catch: () => false,
    }).pipe(Effect.catchAll(() => Effect.succeed(false)));
    let heartbeatOk = null;
    if (typeof services.heartbeat === "function") {
      const hb = yield* Effect.tryPromise({
        try: () => services.heartbeat(),
        catch: () => ({ ok: false }),
      }).pipe(Effect.catchAll(() => Effect.succeed({ ok: false })));
      heartbeatOk = Boolean(hb?.ok);
    }
    return {
      healthOk: Boolean(healthOk),
      heartbeatOk,
      online: Boolean(healthOk),
      stages: ["health", services.heartbeat ? "heartbeat" : null].filter(Boolean),
    };
  });
  return runExit(program);
}

/**
 * Restart graph: stop (best-effort) → install → health → heartbeat.
 * @param {Parameters<typeof runAgentBootstrapEffect>[0]} services
 */
export async function runAgentRestartEffect(services) {
  const program = Effect.gen(function* () {
    let stopOk = true;
    if (typeof services.stop === "function") {
      const st = yield* Effect.tryPromise({
        try: () => services.stop(),
        catch: (e) => ({ ok: false, error: String(e) }),
      });
      stopOk = Boolean(st?.ok);
    }

    const install = yield* Effect.tryPromise({
      try: () => services.install(),
      catch: (e) => e,
    });

    const healthOk = yield* retryHealth(services.health);

    let heartbeatOk = null;
    if (typeof services.heartbeat === "function") {
      const hb = yield* Effect.tryPromise({
        try: () => services.heartbeat(),
        catch: () => ({ ok: false }),
      });
      heartbeatOk = Boolean(hb?.ok);
    }

    return {
      stopOk,
      installOk: install.ok,
      healthOk: Boolean(healthOk),
      heartbeatOk,
      stages: [
        services.stop ? "stop" : null,
        "install",
        "health",
        services.heartbeat ? "heartbeat" : null,
      ].filter(Boolean),
    };
  });
  return runExit(program);
}

/**
 * Clear pairing secrets (ADR-0016). Does not uninstall LaunchAgent.
 * @param {{ unpair: () => Promise<{ ok: boolean }> }} services
 */
export async function runAgentUnpairEffect(services) {
  const program = Effect.gen(function* () {
    const res = yield* Effect.tryPromise({
      try: () => services.unpair(),
      catch: (e) => ({ ok: false, error: String(e) }),
    });
    if (!res.ok) {
      return yield* Effect.fail(new Error(res.error ?? "unpair failed"));
    }
    return { ok: true, stages: ["unpair"] };
  });
  return runExit(program);
}

/** @param {() => Promise<boolean>} healthFn */
function retryHealth(healthFn) {
  return Effect.tryPromise({
    try: () => healthFn(),
    catch: () => false,
  }).pipe(
    Effect.flatMap((ok) => (ok ? Effect.succeed(true) : Effect.fail(new Error("unhealthy")))),
    Effect.retry(Schedule.recurs(2).pipe(Schedule.addDelay(() => Duration.millis(400)))),
    Effect.catchAll(() => Effect.succeed(false)),
  );
}

/** @param {import("effect/Effect").Effect<any, any, never>} program */
async function runExit(program) {
  const exit = await Effect.runPromiseExit(program);
  if (Exit.isSuccess(exit)) {
    return { ok: true, result: exit.value };
  }
  return {
    ok: false,
    error: String(exit.cause),
  };
}
