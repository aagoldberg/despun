"use client";

import { useState, useEffect } from "react";
import { getReferralLink, REFERRAL_TIERS, getNextTier } from "@/lib/referral";
import { copyToClipboard } from "@/lib/share";

interface ReferralWidgetProps {
  referralCount?: number;
  className?: string;
}

export default function ReferralWidget({
  referralCount = 0,
  className = "",
}: ReferralWidgetProps) {
  const [referralLink, setReferralLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setReferralLink(getReferralLink());
  }, []);

  const handleCopy = async () => {
    const success = await copyToClipboard(referralLink);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const nextTier = getNextTier(referralCount);
  const currentTierIndex = REFERRAL_TIERS.findIndex((t) => t.count > referralCount) - 1;
  const currentTier = currentTierIndex >= 0 ? REFERRAL_TIERS[currentTierIndex] : null;

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/30 p-6 ${className}`}>
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-zinc-900 dark:text-white mb-1">
            Invite Friends
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Share Despun and unlock rewards when friends sign up.
          </p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={referralLink}
          readOnly
          className="flex-1 px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400"
        />
        <button
          onClick={handleCopy}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors whitespace-nowrap"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-zinc-600 dark:text-zinc-400">
            <span className="font-bold text-purple-600 dark:text-purple-400">{referralCount}</span> referrals
          </span>
          {nextTier && (
            <span className="text-zinc-500">
              {nextTier.count - referralCount} more for next reward
            </span>
          )}
        </div>
        <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
            style={{
              width: `${Math.min((referralCount / (nextTier?.count || 10)) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Current Reward */}
      {currentTier && (
        <div className="p-3 bg-white/50 dark:bg-zinc-900/50 rounded-lg border border-purple-100 dark:border-purple-900/30 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-zinc-700 dark:text-zinc-300">
              <span className="font-medium">Unlocked:</span> {currentTier.reward}
            </span>
          </div>
        </div>
      )}

      {/* Rewards List */}
      <details className="group">
        <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors list-none flex items-center gap-1">
          <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          View all rewards
        </summary>
        <ul className="mt-3 space-y-2">
          {REFERRAL_TIERS.map((tier) => (
            <li
              key={tier.count}
              className={`flex items-center gap-2 text-sm ${
                referralCount >= tier.count
                  ? "text-zinc-700 dark:text-zinc-300"
                  : "text-zinc-400 dark:text-zinc-600"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  referralCount >= tier.count
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                }`}
              >
                {referralCount >= tier.count ? "✓" : tier.count}
              </span>
              <span>{tier.reward}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
