# PR stack review task list (tip)

Boiled from **all open stack PR code-review comments** (PRs #21–#46).
Sources: CodeRabbit line comments, Codex connector P1s, review bodies.
Tip branch: `stack/26-playwright-cwv`.

**How to use:** work top-down; verify each item still applies on tip before fixing;
check the box when done or when intentionally skipped with a note.

_Generated from 70 unique actionable line findings (70 raw before light dedupe)._

---

## Summary counts

- **P0/Critical:** 5
- **P1/Major:** 51
- **P2/Minor:** 14

---

## P0/Critical

### Audit / Agent / Crawl

- [ ] **R01** Scope crawl run mutations to the caller's agency
  - Where: `apps/web/convex/crawl.ts:80` · PR [#21](https://github.com/michaelmonetized/mission-control-os/pull/21#discussion_r3699021120)

- [ ] **R02** Add agency scoping to `streamFinding`, `completeRun`, and `findingsForRun`.
  - Where: `apps/web/convex/crawl.ts:133` · PR [#21](https://github.com/michaelmonetized/mission-control-os/pull/21#discussion_r3699044095)
  - Action: apps/web/convex/crawl.ts` around lines 67 - 133, Scope crawl-run access to the caller’s agency in streamFinding, completeRun, and findingsForRun: after loading each run and confirming it exists, call assertSiteInAgency w

- [ ] **R03** Possible panic: `50_000` is not guaranteed to be a character boundary.
  - Where: `apps/agent/src/crawl.rs:641` · PR [#42](https://github.com/michaelmonetized/mission-control-os/pull/42#discussion_r3732280730)
  - Action: apps/agent/src/crawl.rs` around lines 640 - 641, Update the head extraction logic around head_end so the fallback limit of 50,000 is reduced to the nearest valid UTF-8 character boundary before slicing lower. Preserve th

### Tasks

- [ ] **R04** Validate workspace-scoped tasks before updating
  - Where: `apps/web/convex/tasks.ts:195` · PR [#22](https://github.com/michaelmonetized/mission-control-os/pull/22#discussion_r3699021654)

- [ ] **R05** Validate the source task before promotion
  - Where: `apps/web/convex/tasks.ts:248` · PR [#22](https://github.com/michaelmonetized/mission-control-os/pull/22#discussion_r3699021658)


## P1/Major

### Audit / Agent / Crawl

- [ ] **R06** Parse meta name attributes instead of matching substrings (viewport / charset).
  - Where: `apps/agent/src/crawl.rs:245` · PR [#32](https://github.com/michaelmonetized/mission-control-os/pull/32#discussion_r3699240427)
  - Action: Update missing-viewport (and similar) checks to parse real `<meta>` elements and inspect `name` attributes, not raw HTML substrings

- [ ] **R07** Use a real HTML text extractor for `strip_tags_len`.
  - Where: `apps/agent/src/crawl.rs:542` · PR [#32](https://github.com/michaelmonetized/mission-control-os/pull/32#discussion_r3699240434)
  - Action: apps/agent/src/crawl.rs` around lines 529 - 542, Replace the character-based stripping in strip_tags_len with the project’s real HTML parser/extractor, collecting only rendered text nodes while excluding script, style, a

- [ ] **R08** Add error handling and a pending-state guard to the save button.
  - Where: `apps/web/src/routes/app/audit.tsx:200` · PR [#32](https://github.com/michaelmonetized/mission-control-os/pull/32#discussion_r3699240453)
  - Action: apps/web/src/routes/app/audit.tsx` around lines 190 - 200, Update the Save report snapshot button’s onClick handler to catch saveReport failures and display the error through the existing note state, matching startCrawl’

- [ ] **R09** Handle rejections from `upsertSchedule` and `removeSchedule`.
  - Where: `apps/web/src/routes/app/audit.tsx:420` · PR [#42](https://github.com/michaelmonetized/mission-control-os/pull/42#discussion_r3732280796)
  - Action: apps/web/src/routes/app/audit.tsx` around lines 402 - 420, Update the schedule controls around upsertSchedule and removeSchedule to handle rejected mutations instead of using unhandled void promise chains. Add a small sh

### Auth / Tenancy

- [ ] **R10** Use one source of truth for Clerk org claims.
  - Where: `apps/web/convex/agencies.ts:17` · PR [#21](https://github.com/michaelmonetized/mission-control-os/pull/21#discussion_r3699044087)
  - Action: apps/web/convex/agencies.ts` around lines 9 - 17, The Clerk organization claim resolution is duplicated with inconsistent fallbacks between getMine and whoami. Export orgClaims from auth.ts, then update both getMine and

- [ ] **R11** Configure the Clerk issuer by Convex deployment.
  - Where: `apps/web/convex/auth.config.ts:9` · PR [#21](https://github.com/michaelmonetized/mission-control-os/pull/21#discussion_r3699044092)
  - Action: apps/web/convex/auth.config.ts` around lines 8 - 9, Update the Clerk configuration in auth.config.ts to derive the issuer domain from the current Convex deployment configuration instead of hardcoding the famous-salmon Cl

- [ ] **R12** Avoid full `portalGrants` scans in `myGrants` and `claimInvite`.
  - Where: `apps/web/convex/portal.ts:100` · PR [#21](https://github.com/michaelmonetized/mission-control-os/pull/21#discussion_r3699044098)
  - Action: apps/web/convex/portal.ts` around lines 66 - 100, Add a portalGrants index for the lookup fields used by myGrants and claimInvite, then replace their full collect() scans with targeted withIndex(...) queries for the user

- [ ] **R13** Sync `agencyName` when the Clerk organization loads.
  - Where: `apps/web/src/routes/onboarding.tsx:38` · PR [#21](https://github.com/michaelmonetized/mission-control-os/pull/21#discussion_r3699044119)
  - Action: apps/web/src/routes/onboarding.tsx` around lines 32 - 38, The onboarding form must synchronize agencyName when organization?.name becomes available without overwriting user edits. Track whether the field has been edited,

- [ ] **R14** Add catch-all auth routes for Clerk path flows
  - Where: `apps/web/src/routes/sign-in.tsx:5` · PR [#21](https://github.com/michaelmonetized/mission-control-os/pull/21#discussion_r3699021123)

- [ ] **R15** Add catch-all routes for Clerk path-based sign-in/sign-up.
  - Where: `apps/web/src/routes/sign-in.tsx:17` · PR [#21](https://github.com/michaelmonetized/mission-control-os/pull/21#discussion_r3699044127)
  - Action: apps/web/src/routes/sign-in.tsx` around lines 5 - 17, Add catch-all route handling for Clerk’s path-based flows in apps/web/src/routes/sign-in.tsx:5-17 and apps/web/src/routes/sign-up.tsx:5-17 by registering splat varian

### Automations / Trigger

- [ ] **R16** Add a timeout and prevent overlapping polls.
  - Where: `packages/trigger-worker/src/dev-runner.mjs:58` · PR [#36](https://github.com/michaelmonetized/mission-control-os/pull/36#discussion_r3703649732)
  - Action: packages/trigger-worker/src/dev-runner.mjs` around lines 45 - 58, The health polling flow needs a request deadline and overlap protection. Add an in-flight guard around the polling logic so interval ticks return while a

- [ ] **R17** Validate `MC_TRIGGER_POLL_MS` before scheduling.
  - Where: `packages/trigger-worker/src/dev-runner.mjs:76` · PR [#36](https://github.com/michaelmonetized/mission-control-os/pull/36#discussion_r3703649738)
  - Action: packages/trigger-worker/src/dev-runner.mjs` around lines 72 - 76, Validate and normalize the interval value used by the dev-runner heartbeat before the setInterval call: treat zero, negative, and nonnumeric MC_TRIGGER_PO

- [ ] **R18** Use an exact direct-execution check.
  - Where: `packages/trigger-worker/src/dev-runner.mjs:87` · PR [#36](https://github.com/michaelmonetized/mission-control-os/pull/36#discussion_r3703649745)
  - Action: packages/trigger-worker/src/dev-runner.mjs` around lines 79 - 87, Update the isMain check around start() to use an exact direct-execution predicate: compare the normalized process.argv[1] path with this module’s path or

- [ ] **R19** Recover handoffs when completion does not succeed.
  - Where: `apps/web/convex/handoffs.ts:146` · PR [#42](https://github.com/michaelmonetized/mission-control-os/pull/42#discussion_r3732280771)
  - Action: apps/web/convex/handoffs.ts` around lines 144 - 146, Update apps/web/convex/handoffs.ts lines 144-146 in the handoff-claim logic to record claim time and increment the attempt count, and add recovery so expired processin

- [ ] **R20** Persist the completion note.
  - Where: `apps/web/convex/handoffs.ts:173` · PR [#42](https://github.com/michaelmonetized/mission-control-os/pull/42#discussion_r3732280775)
  - Action: apps/web/convex/handoffs.ts` around lines 169 - 173, Update completeInternal and the automationHandoffs mark-update flow to persist the supplied note alongside status, using the handoff schema’s stored result or failure-

- [ ] **R21** Bound each poll and prevent overlapping polls.
  - Where: `packages/trigger-worker/src/dev-runner.mjs:68` · PR [#42](https://github.com/michaelmonetized/mission-control-os/pull/42#discussion_r3732280799)
  - Action: packages/trigger-worker/src/dev-runner.mjs` around lines 57 - 68, Update start’s polling callback to track a single in-flight poll and skip invoking pollHandoffs while the previous call is still pending, clearing the gua

### Billing / Stripe

- [ ] **R22** Prevent mock activation in production.
  - Where: `apps/web/convex/billing.ts:86` · PR [#42](https://github.com/michaelmonetized/mission-control-os/pull/42#discussion_r3732280760)
  - Action: apps/web/convex/billing.ts` around lines 53 - 86, Prevent mock activation from being available in production: in apps/web/convex/billing.ts lines 53-86, update mockActivate to reject requests unless the explicit developm

- [ ] **R23** Cancel the Stripe subscription before updating local subscription status.
  - Where: `apps/web/convex/billing.ts:103` · PR [#42](https://github.com/michaelmonetized/mission-control-os/pull/42#discussion_r3732280764)
  - Action: apps/web/convex/billing.ts` around lines 90 - 103, Update cancelMine so Stripe-backed subscriptions with a stripeSubscriptionId are canceled through a server-side Stripe action, rather than directly patching their local

- [ ] **R24** Reject older Stripe webhook events before billing sync.
  - Where: `apps/web/convex/billing.ts:158` · PR [#42](https://github.com/michaelmonetized/mission-control-os/pull/42#discussion_r3732280768)
  - Action: apps/web/convex/billing.ts` around lines 123 - 158, Update upsertFromStripe to accept and persist Stripe event ordering metadata, such as event ID and timestamp, on subscription records. Pass the webhook event’s metadata

- [ ] **R25** Restrict the Billing Portal action to organization admins.
  - Where: `apps/web/convex/billing.ts:231` · PR [#43](https://github.com/michaelmonetized/mission-control-os/pull/43#discussion_r3732987460)
  - Action: apps/web/convex/billing.ts` around lines 203 - 231, Update createPortalSession to perform the same isAdmin organization-role check used by createCheckoutSession before creating or returning a Stripe Billing Portal sessio

- [ ] **R26** Guard against out-of-order Stripe events overwriting newer subscription state.
  - Where: `apps/web/convex/billing.ts:356` · PR [#43](https://github.com/michaelmonetized/mission-control-os/pull/43#discussion_r3732987468)
  - Action: apps/web/convex/billing.ts` around lines 306 - 356, Update the subscription mutation around the existing byStripe/byAgency upsert flow to accept and persist the Stripe event timestamp and event id. Before patching or ins

- [ ] **R27** Normalize `agencyId` before calling `ctx.db.get`.
  - Where: `apps/web/convex/billing.ts:318` · PR [#43](https://github.com/michaelmonetized/mission-control-os/pull/43#discussion_r3732987474)
  - Action: apps/web/convex/billing.ts` around lines 317 - 318, Normalize or strictly validate args.agencyId before the ctx.db.get call in the relevant billing handler: use ctx.db.normalizeId with the agencies table and return the e

- [ ] **R28** Use the item-level renewal date for subscription webhooks.
  - Where: `apps/web/convex/lib/stripeWebhook.ts:151` · PR [#43](https://github.com/michaelmonetized/mission-control-os/pull/43#discussion_r3732987486)
  - Action: apps/web/convex/lib/stripeWebhook.ts` around lines 136 - 151, Update the subscription webhook parsing around periodEnd to fall back to the first subscription item’s current_period_end when obj.current_period_end is absen

- [ ] **R29** Do not force `past_due` with a synthetic period end on a failed invoice.
  - Where: `apps/web/convex/lib/stripeWebhook.ts:171` · PR [#43](https://github.com/michaelmonetized/mission-control-os/pull/43#discussion_r3732987490)
  - Action: apps/web/convex/lib/stripeWebhook.ts` around lines 155 - 171, Update the invoice.payment_failed branch in the webhook event mapping to omit currentPeriodEnd entirely, rather than assigning Date.now(). Preserve the existi

### Deploy / Production API

- [ ] **R30** Serialize production deployments.
  - Where: `.github/workflows/deploy-production.yml:11` · PR [#40](https://github.com/michaelmonetized/mission-control-os/pull/40#discussion_r3704040672)
  - Action: Verify each finding against current code. Fix only still-valid issues, skip the rest with a brief reason, keep changes minimal, and validate. In @.github/workflows/deploy-production.yml around lines 3 - 11, Add a product

- [ ] **R31** Pin the production deployment toolchain.
  - Where: `.github/workflows/deploy-production.yml:18` · PR [#40](https://github.com/michaelmonetized/mission-control-os/pull/40#discussion_r3704040688)
  - Action: Verify each finding against current code. Fix only still-valid issues, skip the rest with a brief reason, keep changes minimal, and validate. In @.github/workflows/deploy-production.yml around lines 13 - 18, Pin the prod

- [ ] **R32** Use a documented Vercel Web Handler export shape.
  - Where: `apps/web/api/[...path].ts:6` · PR [#40](https://github.com/michaelmonetized/mission-control-os/pull/40#discussion_r3704040723)
  - Action: apps/web/api/`[...path].ts around lines 4 - 6, Update the default export in handler to use Vercel’s documented Web Handler shape, such as a fetch(request) export, so the incoming value is a Web Request and the returned R

- [ ] **R33** Block production exposure of development API stubs.
  - Where: `apps/web/api/[...path].ts:7` · PR [#40](https://github.com/michaelmonetized/mission-control-os/pull/40#discussion_r3704040729)
  - Action: apps/web/api/`[...path].ts around lines 4 - 7, Update the handler around handleApi in the default API export to prevent unauthenticated production access to development stubs: gate development-only routes by the deployme

### Desktop / Effect

- [ ] **R34** Replace the no-op `typecheck` script.
  - Where: `apps/desktop/package.json:10` · PR [#40](https://github.com/michaelmonetized/mission-control-os/pull/40#discussion_r3704040696)
  - Action: apps/desktop/package.json` at line 10, Replace the no-op typecheck script in the desktop package with a real validation command that checks main.mjs, preload.mjs, effect-runtime.mjs, and effect-program.mjs, or invoke a d

- [ ] **R35** Bundle a target-specific local agent with the desktop artifact.
  - Where: `apps/desktop/package.json:30` · PR [#40](https://github.com/michaelmonetized/mission-control-os/pull/40#discussion_r3704040701)
  - Action: apps/desktop/package.json` around lines 25 - 30, The Electron resources in apps/desktop/package.json must include the target-specific agent executable and required runtime modules; update the files/resources configuratio

- [ ] **R36** Recover `Effect.tryPromise` fallbacks with `Effect.catchAll`.
  - Where: `apps/desktop/effect-program.mjs:79` · PR [#42](https://github.com/michaelmonetized/mission-control-os/pull/42#discussion_r3732280742)
  - Action: apps/desktop/effect-program.mjs` around lines 66 - 79, Replace the ineffective catch callbacks in runAgentStatusEffect, runAgentBootstrapEffect, runAgentRestartEffect, and runAgentUnpairEffect with Effect.catchAll recove

- [ ] **R37** Add a timeout to both control-plane requests.
  - Where: `apps/desktop/effect-runtime.mjs:62` · PR [#42](https://github.com/michaelmonetized/mission-control-os/pull/42#discussion_r3732280747)
  - Action: apps/desktop/effect-runtime.mjs` around lines 27 - 62, Update both fetch calls in healthFn and heartbeatFn to include an AbortSignal.timeout signal with the appropriate request timeout, ensuring either request settles wh

- [ ] **R38** `stopFn` always reports success, so `stopOk` carries no information.
  - Where: `apps/desktop/effect-runtime.mjs:80` · PR [#42](https://github.com/michaelmonetized/mission-control-os/pull/42#discussion_r3732280754)
  - Action: apps/desktop/effect-runtime.mjs` around lines 64 - 80, Update stopFn so stopOk reflects the actual stop outcome: remove the swallowed launchctl error, return ok: false with error details when unloading fails, and return

### Other

- [ ] **R39** Fail startup consistently when required browser configuration is absent.
  - Where: `apps/web/src/main.tsx:36` · PR [#21](https://github.com/michaelmonetized/mission-control-os/pull/21#discussion_r3699044100)
  - Action: apps/web/src/main.tsx` around lines 17 - 36, Update apps/web/src/main.tsx around AppTree and apps/web/src/lib/convex.ts around the Convex client configuration so missing VITE_CLERK_PUBLISHABLE_KEY or VITE_CONVEX_URL is s

- [ ] **R40** Surface `ensureMine` failures instead of only logging them.
  - Where: `apps/web/src/routes/app.tsx:36` · PR [#21](https://github.com/michaelmonetized/mission-control-os/pull/21#discussion_r3699044103)
  - Action: apps/web/src/routes/app.tsx` around lines 25 - 36, Update AgencyBootstrap to track ensureMine failures and avoid rendering children while bootstrap is unsuccessful. Replace the console.warn-only catch with state that exp

- [ ] **R41** Make invitation creation idempotent.
  - Where: `apps/web/src/routes/app/portal.tsx:40` · PR [#21](https://github.com/michaelmonetized/mission-control-os/pull/21#discussion_r3699044110)
  - Action: apps/web/src/routes/app/portal.tsx` around lines 30 - 40, Make invitation creation idempotent across both the UI and backend. Update sendInvite and its submit button to prevent parallel submissions while invite is pendin

- [ ] **R42** Do not silently swallow all `setStepRemote` errors.
  - Where: `apps/web/src/routes/onboarding.tsx:49` · PR [#21](https://github.com/michaelmonetized/mission-control-os/pull/21#discussion_r3699044122)
  - Action: apps/web/src/routes/onboarding.tsx` around lines 43 - 49, Update the setStepRemote handling in the onboarding step transition so only the expected “agency not found” error is ignored; rethrow or otherwise propagate netwo

- [ ] **R43** Store every Stripe status, or map it before validation.
  - Where: `apps/web/convex/schema.ts:256` · PR [#40](https://github.com/michaelmonetized/mission-control-os/pull/40#discussion_r3704040736)
  - Action: apps/web/convex/schema.ts` around lines 251 - 256, Update the subscription status handling around the schema’s status union and its write paths: either add Stripe’s incomplete, incomplete_expired, unpaid, and paused valu

- [ ] **R44** The agent HTTP plane has no tenant identity.
  - Where: `apps/web/convex/http.ts:54` · PR [#42](https://github.com/michaelmonetized/mission-control-os/pull/42#discussion_r3732280778)
  - Action: apps/web/convex/http.ts` around lines 48 - 54, The agent HTTP routes must derive tenant identity from the authenticated agent credential rather than request data. In apps/web/convex/http.ts#L48-L54, use the agencyId asso

- [ ] **R45** Reject unrecognized `status` values instead of defaulting to `done`.
  - Where: `apps/web/convex/http.ts:117` · PR [#42](https://github.com/michaelmonetized/mission-control-os/pull/42#discussion_r3732280781)
  - Action: apps/web/convex/http.ts` around lines 104 - 117, Validate body.status at runtime in the request handler before calling internal.handoffs.completeInternal, accepting only the exact "done" or "failed" values and rejecting

- [ ] **R46** Hide the mock activation control outside development.
  - Where: `apps/web/src/routes/app/settings.tsx:177` · PR [#43](https://github.com/michaelmonetized/mission-control-os/pull/43#discussion_r3732987492)
  - Action: apps/web/src/routes/app/settings.tsx` around lines 167 - 177, Gate the “Mock (dev)” button in the settings UI using the application’s development build-mode check, and enforce the same restriction inside the mockActivate

- [ ] **R47** Do not offer local cancellation for a real Stripe subscription.
  - Where: `apps/web/src/routes/app/settings.tsx:216` · PR [#43](https://github.com/michaelmonetized/mission-control-os/pull/43#discussion_r3732987504)
  - Action: apps/web/src/routes/app/settings.tsx` around lines 207 - 216, Update the billing action around cancelBilling so real Stripe subscriptions (billing.hasCustomer === true) do not offer local cancellation; show the existing

### Schedules / Presence

- [ ] **R48** Use the `by_next` index instead of scanning every schedule.
  - Where: `apps/web/convex/schedules.ts:136` · PR [#42](https://github.com/michaelmonetized/mission-control-os/pull/42#discussion_r3732280789)
  - Action: apps/web/convex/schedules.ts` around lines 135 - 136, Update the schedule query in the cron handler around `crawlSchedules` to use the existing `by_next` index on `nextRunAt`, constraining results to schedules due at or

### Social / Reports

- [ ] **R49** Validate categories at the mutation boundary.
  - Where: `apps/web/convex/social.ts:73` · PR [#32](https://github.com/michaelmonetized/mission-control-os/pull/32#discussion_r3699240444)
  - Action: apps/web/convex/social.ts` at line 73, Replace the free-form category validators in both mutation argument definitions around the affected social mutations with one shared v.union validator containing only promo, edu, ug

- [ ] **R50** Give the category selector an accessible name.
  - Where: `apps/web/src/routes/app/social.tsx:145` · PR [#32](https://github.com/michaelmonetized/mission-control-os/pull/32#discussion_r3699240456)
  - Action: apps/web/src/routes/app/social.tsx` around lines 136 - 145, Add an accessible name to the category <select> in the social route, using a visible associated label or an appropriate aria-label. Keep the existing category v

### TUI

- [ ] **R51** Do not use the heartbeat endpoint for unrelated modules.
  - Where: `apps/tui/src/main.rs:54` · PR [#40](https://github.com/michaelmonetized/mission-control-os/pull/40#discussion_r3704040707)
  - Action: apps/tui/src/main.rs` around lines 44 - 54, Update the endpoint match in the module-selection flow so “Portal” and “Settings” no longer fall through to /api/agent/heartbeat; map them to their appropriate module-specific

- [ ] **R52** Treat non-success HTTP status codes as errors.
  - Where: `apps/tui/src/main.rs:67` · PR [#40](https://github.com/michaelmonetized/mission-control-os/pull/40#discussion_r3704040714)
  - Action: apps/tui/src/main.rs` around lines 63 - 67, Update the Ok(resp) branch handling the HTTP response status so it returns the existing formatted data only when status.is_success() is true; for non-success 4xx and 5xx status

### UI / a11y / DX

- [ ] **R53** Neutralize spreadsheet formula values before CSV escaping.
  - Where: `apps/web/src/lib/export-csv.ts:18` · PR [#36](https://github.com/michaelmonetized/mission-control-os/pull/36#discussion_r3703649721)
  - Action: apps/web/src/lib/export-csv.ts` around lines 15 - 18, Update the escape function to neutralize untrusted string values beginning with =, +, -, or @ by prefixing them with an apostrophe before applying CSV quote escaping.

- [ ] **R54** Set a contrasting checked indicator color.
  - Where: `apps/web/src/components/mc/checkbox.tsx:15` · PR [#40](https://github.com/michaelmonetized/mission-control-os/pull/40#discussion_r3704040742)
  - Action: apps/web/src/components/mc/checkbox.tsx` around lines 11 - 15, Update the checked styling in BaseCheckbox usage within the checkbox component so the indicator’s direct text color contrasts with the --color-brand-sky chec

- [ ] **R55** Add a visible focus indicator to `TabsContent`.
  - Where: `apps/web/src/components/mc/tabs.tsx:45` · PR [#40](https://github.com/michaelmonetized/mission-control-os/pull/40#discussion_r3704040756)
  - Action: apps/web/src/components/mc/tabs.tsx` around lines 40 - 45, Update the TabsContent className in the TabsContent component to retain the existing focus-visible outline behavior while adding a visible focus indicator, using

- [ ] **R56** Use accessible interaction primitives for `Sheet` and `Tooltip`.
  - Where: `apps/web/src/components/ui/sheet.tsx:24` · PR [#42](https://github.com/michaelmonetized/mission-control-os/pull/42#discussion_r3732280795)
  - Action: apps/web/src/components/ui/sheet.tsx` around lines 16 - 24, Update apps/web/src/components/ui/sheet.tsx lines 16-24 to use an accessible dialog primitive or implement dialog semantics, initial focus, focus trapping, focu


## P2/Minor

### Audit / Agent / Crawl

- [ ] **R57** Detect the single-quoted `shortcut icon` relation.
  - Where: `apps/agent/src/crawl.rs:344` · PR [#36](https://github.com/michaelmonetized/mission-control-os/pull/36#discussion_r3703649690)
  - Action: apps/agent/src/crawl.rs` around lines 340 - 344, Update the missing-favicon condition in the crawl logic to also recognize the single-quoted `rel='shortcut icon'` form, alongside the existing icon relation checks, so val

### Auth / Tenancy

- [ ] **R58** Validate `step` against the known step range.
  - Where: `apps/web/convex/agencies.ts:82` · PR [#21](https://github.com/michaelmonetized/mission-control-os/pull/21#discussion_r3699044089)
  - Action: apps/web/convex/agencies.ts` around lines 73 - 82, Update setOnboardingStep to validate args.step is an integer within the onboarding range 0 through 7 before calling ctx.db.patch; reject invalid values without persistin

- [ ] **R59** Add the missing Clerk wiring notes before treating these checklists as complete.
  - Where: `apps/android/README.md:32` · PR [#36](https://github.com/michaelmonetized/mission-control-os/pull/36#discussion_r3703649704)
  - Action: apps/android/README.md` around lines 29 - 32, Update the Clerk setup notes in apps/android/README.md at lines 29-32 to document Internet permission, manifest registration of the custom Application, and calling Clerk.init

### Billing / Stripe

- [ ] **R60** Accept every `v1` signature in the header.
  - Where: `apps/web/convex/lib/stripeWebhook.ts:55` · PR [#43](https://github.com/michaelmonetized/mission-control-os/pull/43#discussion_r3732987482)
  - Action: apps/web/convex/lib/stripeWebhook.ts` around lines 47 - 55, Update the Stripe signature parsing near parts, t, and v1 to preserve every repeated v1 value instead of collapsing them through Object.fromEntries. Build a v1L

- [ ] **R61** Handle rejections in the billing promise chains.
  - Where: `apps/web/src/routes/app/settings.tsx:174` · PR [#43](https://github.com/michaelmonetized/mission-control-os/pull/43#discussion_r3732987499)
  - Action: apps/web/src/routes/app/settings.tsx` around lines 170 - 174, Handle rejected billing promises by adding rejection handlers that pass the error message to setBillNote, following the existing createCheckout pattern. Updat

### Mobile

- [ ] **R62** Make the Account toolbar item actionable or hidden.
  - Where: `apps/ios/Sources/MissionControl/ContentView.swift:42` · PR [#36](https://github.com/michaelmonetized/mission-control-os/pull/36#discussion_r3703649708)
  - Action: apps/ios/Sources/MissionControl/ContentView.swift` around lines 38 - 42, Update the Account toolbar item in ContentView’s ToolbarItem so it is not exposed as a non-actionable control: either wrap the icon in a Button con

- [ ] **R63** Do not use the Agency org-session message for every module.
  - Where: `apps/ios/Sources/MissionControl/ContentView.swift:62` · PR [#36](https://github.com/michaelmonetized/mission-control-os/pull/36#discussion_r3703649714)
  - Action: apps/ios/Sources/MissionControl/ContentView.swift` around lines 60 - 62, Update ModulePlaceholder so the Portal module does not display the Agency organization-session message; use module-specific wiring text or omit the

### Other

- [ ] **R64** Render a no-client state instead of a loading state.
  - Where: `apps/web/src/routes/app/portal.tsx:28` · PR [#21](https://github.com/michaelmonetized/mission-control-os/pull/21#discussion_r3699044109)
  - Action: apps/web/src/routes/app/portal.tsx` around lines 24 - 28, Update the client-dependent rendering around selected and the grants card to explicitly handle a resolved empty clients list, showing an empty-client state instea

- [ ] **R65** Add `relative` to the container so the absolute-positioned `UserButton` anchors correctly.
  - Where: `apps/web/src/routes/index.tsx:18` · PR [#21](https://github.com/michaelmonetized/mission-control-os/pull/21#discussion_r3699044112)
  - Action: apps/web/src/routes/index.tsx` around lines 13 - 18, Add the Tailwind relative class to the outer container div in the landing page, alongside its existing layout classes, so the absolute-positioned UserButton wrapper an

- [ ] **R66** Render a loading state before the empty state.
  - Where: `apps/web/src/routes/portal.tsx:155` · PR [#32](https://github.com/michaelmonetized/mission-control-os/pull/32#discussion_r3699240472)
  - Action: apps/web/src/routes/portal.tsx` around lines 143 - 155, Update the contacts rendering in the portal contacts CardContent to distinguish an undefined portalContacts value from an empty result: show a loading message while

### Social / Reports

- [ ] **R67** Block `saveSnapshot` for non-completed crawl runs.
  - Where: `apps/web/convex/reports.ts:27` · PR [#32](https://github.com/michaelmonetized/mission-control-os/pull/32#discussion_r3699240439)
  - Action: apps/web/convex/reports.ts` around lines 20 - 27, Update saveSnapshot to validate run.status is "completed" after loading the crawl run and before creating the auditReports record. Reject every other status, while preser

- [ ] **R68** Handle recycle mutation failures.
  - Where: `apps/web/src/routes/app/social.tsx:245` · PR [#32](https://github.com/michaelmonetized/mission-control-os/pull/32#discussion_r3699240467)
  - Action: apps/web/src/routes/app/social.tsx` around lines 234 - 245, Update the recycle button handler around recyclePost/recycle so rejected mutations are caught and the failure is reported to the user. Preserve the existing pos

### UI / a11y / DX

- [ ] **R69** Provide an accessible name for the latest-pages progressbar.
  - Where: `apps/web/src/components/mc/progress.tsx:20` · PR [#36](https://github.com/michaelmonetized/mission-control-os/pull/36#discussion_r3703649716)
  - Action: apps/web/src/components/mc/progress.tsx` around lines 5 - 20, Add an accessible-name prop to the Progress component and apply it to its progressbar element; then update apps/web/src/components/mc/progress.tsx lines 5-20

- [ ] **R70** Avoid duplicate row dividers.
  - Where: `apps/web/src/components/mc/table.tsx:42` · PR [#40](https://github.com/michaelmonetized/mission-control-os/pull/40#discussion_r3704040745)
  - Action: apps/web/src/components/mc/table.tsx` around lines 33 - 42, Remove the divide-y class from the TableBody wrapper to avoid duplicate row dividers, and add the branded bottom-border color to TableRow’s className if needed


---

## Cross-cutting epics (deduped themes)

- [ ] **Tenant isolation** — agency-scope every crawl/task/report mutation; agent HTTP plane multi-tenant identity
- [ ] **Stripe hardening** — mockActivate prod guard; portal admin-only; out-of-order webhook reject; multi-v1 signatures; cancel via Stripe API first
- [ ] **Auth consistency** — single `orgClaims` path; Clerk issuer per deploy; catch-all sign-in/up routes
- [ ] **Trigger worker** — poll timeout, no overlap, validate poll MS, exact main check
- [ ] **Desktop Effect** — catchAll on tryPromise; fetch timeouts; honest stopOk
- [ ] **Production API** — no dev dual-write stubs in prod; Vercel handler shape; deploy serialization + pin toolchain
- [ ] **CSV formula injection** — neutralize `=`, `+`, `-`, `@` in exports
- [ ] **UI a11y** — focus rings, accessible names, Sheet/Tooltip primitives, progressbar labels
- [ ] **Agent crawl quality** — UTF-8 char boundary panic; real HTML extractors vs substrings; favicon quote forms
- [ ] **Schedules** — use `by_next` index instead of full table scan

---

## Non-actionable / meta (for awareness)

- CodeRabbit rate limits hit on later stack PRs (#44–#46) — re-request reviews when limit resets
- Codex cloud review usage limits reached on some PRs
- Vercel bot preview deploy comments ignored

## Source PR coverage

Line comments from PRs: #21, #22, #32, #36, #40, #42, #43
