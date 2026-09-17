import React from 'react';
import type { Video } from '../../types/youtube';
import { EmptyState } from '../ui/EmptyState';
import { VideoCard } from './VideoCard';
import { VideoCardSkeleton } from './Skeletons';

export const VIDEO_GRID_CLASS =
'grid grid-cols-1 gap-x-4 gap-y-10 xs:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5';

interface VideoGridProps {
  videos: Video[];
  loading?: boolean;
  skeletonCount?: number;
  emptyMessage?: string;
}

export function VideoGrid({
  videos,
  loading = false,
  skeletonCount = 12,
  emptyMessage = 'Nothing to show here yet.'
}: VideoGridProps) {
  if (loading) {
    return (
      <div className={VIDEO_GRID_CLASS} aria-busy="true">
        {Array.from({ length: skeletonCount }).map((_, index) =>
        <VideoCardSkeleton key={index} />
        )}
      </div>);

  }

  if (videos.length === 0) {
    return <EmptyState art="library" title={emptyMessage} compact />;
  }

  return (
    <div className={VIDEO_GRID_CLASS}>
      {videos.map((video) =>
      <VideoCard key={video.id} video={video} />
      )}
    </div>);

}