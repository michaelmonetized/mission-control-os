# Stripe billing (ADR-0001 / ADR-0031)

Direct subscription Checkout for Agency orgs.

## Plans

| Plan | Price | Env price id |
|------|-------|----------------|
| Starter | $99/mo | `STRIPE_PRICE_STARTER` |
| Agency Pro | $299/mo | `STRIPE_PRICE_PRO` |
| Enterprise | $699/mo | `STRIPE_PRICE_ENTERPRISE` |

## Convex env

```bash
npx convex env set STRIPE_SECRET_KEY sk_...
npx convex env set STRIPE_WEBHOOK_SECRET whsec_...
npx convex env set STRIPE_PRICE_STARTER price_...
npx convex env set STRIPE_PRICE_PRO price_...
npx convex env set STRIPE_PRICE_ENTERPRISE price_...
npx convex env set MC_APP_URL https://your-app.example
```

## Webhook

Endpoint: `https://<deployment>.convex.site/stripe/webhook`

Events:

- `checkout.session.completed`
- `customer.subscription.created|updated|deleted`
- `invoice.payment_failed`

Signature verified with `STRIPE_WEBHOOK_SECRET` (HMAC SHA-256).

## App paths

- Settings → **Checkout** → `billing.createCheckoutSession` action
- Settings → **Billing portal** → `billing.createPortalSession`
- Settings → **Mock (dev)** → no Stripe keys required
