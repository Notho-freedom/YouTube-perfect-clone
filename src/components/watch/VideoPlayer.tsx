import React from 'react';
import { ExternalLinkIcon, LockIcon } from 'lucide-react';
import type { Video } from '../../types/youtube';

interface VideoPlayerProps {
  video: Video;
  /** Sample videos have no embeddable id, so the shell renders its own chrome. */
  embeddable: boolean;
  /** Theater and full screen views run edge to edge with square corners. */
  rounded?: boolean;
}

/**
 * Fallback surface for videos the owner has blocked from embedding.
 *
 * It deliberately does NOT render a transport bar: nothing can play here, and
 * a row of controls that do nothing is worse than admitting the limit. The one
 * action that genuinely works — opening the video where it is allowed to play
 * — is the one offered.
 */
export function VideoPlayer({ video, embeddable, rounded = true }: VideoPlayerProps) {
  const shape = rounded ? 'rounded-xl' : 'rounded-none';

  if (embeddable) {
    return (
      <div className={`relative aspect-video w-full overflow-hidden bg-black ${shape}`}>
        <iframe
          key={video.id}
          src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0" />
        
      </div>);

  }

  return (
    <div className={`relative aspect-video w-full overflow-hidden bg-black ${shape}`}>
      {video.thumbnail &&
      <img src={video.thumbnail} alt="" className="h-full w-full object-cover opacity-30" />
      }

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <LockIcon className="h-8 w-8 text-white/70" strokeWidth={1.6} />
        <p className="mt-4 max-w-[480px] text-[16px] font-medium leading-6 text-white">
          This video can’t be played here
        </p>
        <p className="mt-1 max-w-[480px] text-[14px] leading-5 text-white/70">
          Its owner has turned off playback outside YouTube.
        </p>
        <a
          href={`https://www.youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex h-9 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-medium leading-none text-black transition-colors duration-150 hover:bg-white/90">
          
          <ExternalLinkIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
          Watch on YouTube
        </a>
      </div>
    </div>);

}