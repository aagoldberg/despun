"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded ${className}`}
    />
  );
}

export function StoryCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>

        {/* Facts box */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-4/6" />
        </div>

        {/* Perspectives grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 px-6 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

export function StoriesListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-16">
      {Array.from({ length: count }).map((_, i) => (
        <StoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6 mt-1" />
      <div className="flex gap-2 mt-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
