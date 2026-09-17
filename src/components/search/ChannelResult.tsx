import React from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../../contexts/LibraryContext';
import type { ChannelDetails } from '../../types/youtube';
import { compactPrecise } from '../../utils/format';
import { ChannelAvatar } from '../video/ChannelAvatar';

interface ChannelResultProps {
  channel: ChannelDetails;
}

export function ChannelResult({ channel }: ChannelResultProps) {
  const { toggleSubscription, isSubscribed } = useLibrary();
  const subscribed = isSubscribed(channel.id);

  return (
    <article className="flex flex-col items-center gap-4 border-y border-yt-border py-6 sm:flex-row sm:gap-4" style={{ borderTopWidth: "0px", borderRightWidth: "0px", borderBottomWidth: "0px", borderLeftWidth: "0px" }}>
      <Link to={`/channel/${channel.id}`} className="flex w-full shrink-0 justify-center sm:w-[360px]" aria-label={channel.title}>
        <ChannelAvatar name={channel.title} src={channel.avatar} size={136} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-1 sm:items-start">
        <h3 className="text-[18px] leading-[26px] text-yt-text">
          <Link to={`/channel/${channel.id}`}>{channel.title}</Link>
        </h3>
        <p className="text-[12px] leading-[18px] text-yt-sub">
          {[channel.handle, channel.subscribers !== undefined && `${compactPrecise(channel.subscribers)} subscribers`].filter(Boolean).join(' • ')}
        </p>
        {channel.description && <p className="line-clamp-1 text-center text-[12px] leading-[18px] text-yt-sub sm:text-left">
            {channel.description}
          </p>}
      </div>

      <button type="button" onClick={() => toggleSubscription({
        channelId: channel.id,
        title: channel.title,
        avatar: channel.avatar
      })} className={subscribed ? 'flex h-9 shrink-0 items-center rounded-full bg-yt-chip px-4 text-[14px] font-medium leading-none text-yt-text transition-colors duration-150 hover:bg-yt-chipHover' : 'flex h-9 shrink-0 items-center rounded-full bg-yt-inverse px-4 text-[14px] font-medium leading-none text-yt-inverseText transition-opacity duration-150 hover:opacity-90'}>
        {subscribed ? 'Subscribed' : 'Subscribe'}
      </button>
    </article>);

}