import React from 'react';
import { useParams } from 'react-router-dom';
import { GuideIcon } from '../components/layout/GuideIcon';
import { VideoGrid } from '../components/video/VideoGrid';
import { findExploreSection } from '../data/explore';
import { useExploreFeed } from '../hooks/useYouTube';
import { FeedPlaceholder } from './FeedPlaceholder';

export function Explore() {
  const { slug = '' } = useParams();
  const section = findExploreSection(slug);
  const { videos, loading } = useExploreFeed(section);

  if (!section) {
    return (
      <FeedPlaceholder
        title="This category isn't available"
        description="Pick another topic from the Explore section of the guide." />);


  }

  return (
    <div className="px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-6 flex items-center gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-yt-chip text-yt-text">
          <GuideIcon name={section.icon} className="h-6 w-6" />
        </span>
        <h1 className="text-[24px] font-bold leading-8 text-yt-text">{section.label}</h1>
      </header>

      <VideoGrid
        videos={videos}
        loading={loading}
        emptyMessage={
        section.live ?
        'No live streams to show right now.' :
        'Nothing to show in this category right now.'
        } />
      
    </div>);

}