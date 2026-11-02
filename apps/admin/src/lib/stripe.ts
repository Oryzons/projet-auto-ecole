import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function isStripeSecretKeyConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return false;
  if (/placeholder/i.test(key)) return false;
  return key.startsWith("sk_test_") || key.startsWith("sk_live_");
}

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;

  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || !isStripeSecretKeyConfigured()) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  stripeClient = new Stripe(key, {
    apiVersion: "2026-08-26.dahlia",
    typescript: true,
  });

  return stripeClient;
}
