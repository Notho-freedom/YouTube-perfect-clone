import React from 'react';

export function VideoCardSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col">
      <div className="aspect-video w-full rounded-xl bg-yt-skeleton" />
      <div className="mt-3 flex gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-yt-skeleton" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-[14px] w-full rounded bg-yt-skeleton" />
          <div className="h-[14px] w-3/5 rounded bg-yt-skeleton" />
          <div className="h-[10px] w-2/5 rounded bg-yt-skeleton" />
        </div>
      </div>
    </div>);

}

export function SearchResultSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3 sm:flex-row sm:gap-4">
      <div className="aspect-video w-full shrink-0 rounded-xl bg-yt-skeleton sm:w-[360px]" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-[18px] w-4/5 rounded bg-yt-skeleton" />
        <div className="h-[12px] w-2/5 rounded bg-yt-skeleton" />
        <div className="mt-4 h-6 w-1/3 rounded-full bg-yt-skeleton" />
        <div className="h-[12px] w-full rounded bg-yt-skeleton" />
      </div>
    </div>);

}

export function CompactVideoSkeleton() {
  return (
    <div className="flex animate-pulse gap-2">
      {/* Matches CompactVideoCard's 55 / 45 split. */}
      <div className="aspect-video w-[55%] shrink-0 rounded-lg bg-yt-skeleton" />
      <div className="min-w-0 flex-1 space-y-2 pt-1">
        <div className="h-[12px] w-full rounded bg-yt-skeleton" />
        <div className="h-[12px] w-4/5 rounded bg-yt-skeleton" />
        <div className="h-[10px] w-2/5 rounded bg-yt-skeleton" />
      </div>
    </div>);

}