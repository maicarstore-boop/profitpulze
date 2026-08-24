import "server-only";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it to your .env file.`);
  }
  return value;
}

export const paymentsConfig = {
  apiBase: process.env.NOWPAYMENTS_API_BASE || "https://api.nowpayments.io/v1",
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  get apiKey() {
    return requireEnv("NOWPAYMENT_API_KEY");
  },
  get ipnSecret() {
    return requireEnv("NOWPAYMENT_IPN_SECRET_KEY");
  },
  get payoutEmail() {
    return requireEnv("NOWPAYMENTS_EMAIL");
  },
  get payoutPassword() {
    return requireEnv("NOWPAYMENTS_PASSWORD");
  },
};
