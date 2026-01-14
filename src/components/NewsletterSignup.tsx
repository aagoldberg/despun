"use client";

import { useState } from "react";
import { getVisitorId, getSessionId, trackNewsletterSignup } from "@/lib/tracking";

interface NewsletterSignupProps {
  source?: string;
  variant?: "inline" | "card" | "footer";
  className?: string;
}

export default function NewsletterSignup({
  source = "homepage",
  variant = "card",
  className = "",
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source,
          visitorId: getVisitorId(),
          sessionId: getSessionId(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage("You're in! Check your inbox for confirmation.");
        setEmail("");
        trackNewsletterSignup(source);
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Connection failed. Please try again.");
    }
  };

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 px-4 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          disabled={status === "loading" || status === "success"}
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "..." : status === "success" ? "Subscribed!" : "Subscribe"}
        </button>
      </form>
    );
  }

  if (variant === "footer") {
    return (
      <div className={className}>
        <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">
          Daily Briefing
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Get the day's top stories delivered to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={status === "loading" || status === "success"}
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 rounded-lg transition-opacity disabled:opacity-50"
          >
            {status === "loading" ? "Subscribing..." : status === "success" ? "Subscribed!" : "Subscribe"}
          </button>
        </form>
        {message && (
          <p className={`text-xs mt-2 ${status === "success" ? "text-emerald-600" : "text-rose-600"}`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className={`bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 p-6 md:p-8 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
            Get the Daily Briefing
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            The day's most important stories, analyzed and delivered to your inbox every morning. No spin, no noise.
          </p>

          {status === "success" ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">{message}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  disabled={status === "loading"}
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {status === "loading" ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Subscribing
                    </span>
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </div>
              {status === "error" && (
                <p className="text-sm text-rose-600 dark:text-rose-400">{message}</p>
              )}
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                Free forever. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
