# Review tasks → Pre-GTM

This file is a **pointer**. The full, designed pre-GTM brief (severity taxonomy, synthetic CodeRabbit reviews for rate-limited PRs, mermaid critical path, landing rebuild notes, and checkbox inventory) lives here:

### → [PRE-GTM.md](./PRE-GTM.md)

**Why the move:** GTM readiness is not a flat laundry list of bot nits. Hard blocks (tenant isolation, Stripe, agent HTTP identity) must outrank polish. Rate-limited PRs (#44–#46 etc.) had no CodeRabbit line comments — they are now covered with the same review methodology applied by hand.

| Source | In PRE-GTM? |
|--------|-------------|
| CodeRabbit lines #21–#43 | Yes (§3, §5) |
| Synthetic CR reviews #39/#41/#44–#46 | Yes (§2) |
| Nit / minor / trivial | Yes, under trust + §5 P2 |
| freview | No — never posted on these PRs |
| Rate-limit *only* messages | Documented as gap, not invented work |

Open [PRE-GTM.md](./PRE-GTM.md) and work the **sequencing gantt** top-down.
