import { Xendit } from "xendit-node";

const PLACEHOLDER_KEY = "xnd_development_replace_me";

/** True when a real Xendit secret key is configured (not the .env.example placeholder). */
export function isXenditConfigured(): boolean {
  const key = process.env.XENDIT_SECRET_KEY;
  return !!key && key !== PLACEHOLDER_KEY && key.startsWith("xnd_") && key.length > 20;
}

export function getXenditClient(): Xendit {
  const key = process.env.XENDIT_SECRET_KEY;
  if (!key) throw new Error("XENDIT_SECRET_KEY is not set");
  return new Xendit({ secretKey: key });
}
