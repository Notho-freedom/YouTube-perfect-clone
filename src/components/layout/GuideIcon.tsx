import React from 'react';
import { ChevronDownIcon, ChevronUpIcon, CircleUserRoundIcon, ClockIcon, FlagIcon, FlameIcon, Gamepad2Icon, GraduationCapIcon, HistoryIcon, HomeIcon, ListVideoIcon, MessageSquareWarningIcon, Music2Icon, NewspaperIcon, PodcastIcon, RadioIcon, SettingsIcon, ShirtIcon, ThumbsUpIcon, TrophyIcon, UserRoundIcon, VideoIcon } from 'lucide-react';
import { ShortsIcon } from '../icons/ShortsIcon';
import { SubscriptionsIcon } from '../icons/SubscriptionsIcon';
interface GuideIconProps {
  name: string;
  className?: string;
}
export function GuideIcon({
  name,
  className = 'h-6 w-6 shrink-0'
}: GuideIconProps) {
  const props = {
    className,
    strokeWidth: 1.8
  };
  switch (name) {
    case 'home':
      return <HomeIcon {...props} />;
    case 'shorts':
      return <ShortsIcon className={className} />;
    case 'subscriptions':
      return <SubscriptionsIcon className={className} />;
    case 'you':
      return <CircleUserRoundIcon {...props} />;
    case 'yourChannel':
      return <UserRoundIcon {...props} />;
    case 'history':
      return <HistoryIcon {...props} />;
    case 'playlists':
      return <ListVideoIcon {...props} />;
    case 'watchLater':
      return <ClockIcon {...props} />;
    case 'liked':
      return <ThumbsUpIcon {...props} />;
    case 'yourVideos':
      return <VideoIcon {...props} />;
    case 'trending':
      return <FlameIcon {...props} />;
    case 'music':
      return <Music2Icon {...props} />;
    case 'live':
      return <RadioIcon {...props} />;
    case 'gaming':
      return <Gamepad2Icon {...props} />;
    case 'news':
      return <NewspaperIcon {...props} />;
    case 'sports':
      return <TrophyIcon {...props} />;
    case 'courses':
      return <GraduationCapIcon {...props} />;
    case 'fashion':
      return <ShirtIcon {...props} />;
    case 'podcasts':
      return <PodcastIcon {...props} />;
    case 'settings':
      return <SettingsIcon {...props} />;
    case 'report':
      return <FlagIcon {...props} />;
    case 'help':
      return <div {...props} />;
    case 'feedback':
      return <MessageSquareWarningIcon {...props} />;
    case 'more':
      return <ChevronDownIcon {...props} />;
    case 'less':
      return <ChevronUpIcon {...props} />;
    case 'ytmusic':
      return (
        <span className={`${className} flex items-center justify-center`}>
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-yt-brand">
            <svg viewBox="0 0 12 14" aria-hidden="true" className="h-[8px] w-[7px] fill-white">
              <path d="M0 0l12 7-12 7z" />
            </svg>
          </span>
        </span>);

    case 'kids':
      return <span className={`${className} flex items-center justify-center`}>
          <span className="flex h-[17px] w-[24px] items-center justify-center rounded-[5px] bg-yt-brand">
            <svg viewBox="0 0 12 14" aria-hidden="true" className="h-[8px] w-[7px] fill-white">
              <path d="M0 0l12 7-12 7z" />
            </svg>
          </span>
        </span>;
    default:
      return <HomeIcon {...props} />;
  }
}