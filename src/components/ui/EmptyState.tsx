import React from 'react';

/**
 * YouTube's empty and error surfaces.
 *
 * YouTube never substitutes invented content when a request fails: it keeps
 * the masthead and the guide in place and centres a single illustration with
 * one line of explanation and, at most, one action. This component is the only
 * thing this clone renders when a read comes back empty or fails, so nothing
 * on screen is ever fictional.
 */
export type EmptyArt = 'results' | 'library' | 'error' | 'lost';

const ART: Record<EmptyArt, string> = {
  results: "/4c0d14ff-6a96-4a5c-a47a-78118a6bc286.jpg",
  library: "/ea86e332-6a45-4d46-9b76-a07d1535079a.jpg",
  error: "/056c0bfe-bfda-4735-ac92-09a2bc800285.jpg",
  lost: "/a1c75422-6502-4be5-82dd-2be828cee7be.jpg"
};

interface EmptyStateProps {
  art?: EmptyArt;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Smaller variant for a rail or a shelf rather than a whole page. */
  compact?: boolean;
}

export function EmptyState({
  art = 'results',
  title,
  description,
  action,
  compact = false
}: EmptyStateProps) {
  return (
    <section
      className={`flex flex-col items-center text-center ${compact ? 'py-10' : 'py-16 sm:py-24'}`}>
      
      <img
        src={ART[art]}
        alt=""
        aria-hidden="true"
        className={`${
        compact ? 'h-[104px] w-[104px]' : 'h-[168px] w-[168px] sm:h-[200px] sm:w-[200px]'} object-contain mix-blend-multiply dark:mix-blend-screen dark:invert dark:hue-rotate-180`
        } />
      

      <h2
        className={`mt-6 font-medium text-yt-text ${
        compact ? 'text-[15px] leading-[21px]' : 'text-[20px] leading-7'}`
        }>
        
        {title}
      </h2>

      {description &&
      <p className="mt-2 max-w-[440px] text-[14px] leading-5 text-yt-sub">{description}</p>
      }

      {action && <div className="mt-6">{action}</div>}
    </section>);

}