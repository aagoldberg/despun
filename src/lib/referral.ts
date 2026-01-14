/**
 * Referral program utilities for Despun
 */

const REFERRAL_KEY = "despun-referral-code";
const REFERRED_BY_KEY = "despun-referred-by";

/**
 * Generate a unique referral code for a user
 */
export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing chars (0/O, 1/I/L)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get or create the user's referral code
 */
export function getReferralCode(): string {
  if (typeof window === "undefined") return "";

  let code = localStorage.getItem(REFERRAL_KEY);
  if (!code) {
    code = generateReferralCode();
    localStorage.setItem(REFERRAL_KEY, code);
  }
  return code;
}

/**
 * Get the referral link for sharing
 */
export function getReferralLink(): string {
  if (typeof window === "undefined") return "";

  const code = getReferralCode();
  const baseUrl = window.location.origin;
  return `${baseUrl}?ref=${code}`;
}

/**
 * Check and store if user was referred
 */
export function checkReferral(): string | null {
  if (typeof window === "undefined") return null;

  // Check URL for referral code
  const params = new URLSearchParams(window.location.search);
  const refCode = params.get("ref");

  if (refCode && refCode.length === 6) {
    // Don't attribute if it's the user's own code
    const myCode = localStorage.getItem(REFERRAL_KEY);
    if (refCode !== myCode) {
      // Store the referrer code if not already set
      const existingRef = localStorage.getItem(REFERRED_BY_KEY);
      if (!existingRef) {
        localStorage.setItem(REFERRED_BY_KEY, refCode);
      }
      return refCode;
    }
  }

  return localStorage.getItem(REFERRED_BY_KEY);
}

/**
 * Get who referred the current user
 */
export function getReferredBy(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFERRED_BY_KEY);
}

/**
 * Referral rewards tiers
 */
export const REFERRAL_TIERS = [
  { count: 1, reward: "Early access to new features" },
  { count: 3, reward: "Ad-free experience" },
  { count: 5, reward: "Custom daily digest" },
  { count: 10, reward: "Founding member badge" },
];

/**
 * Get the next reward tier
 */
export function getNextTier(referralCount: number): { count: number; reward: string } | null {
  return REFERRAL_TIERS.find((tier) => tier.count > referralCount) || null;
}
