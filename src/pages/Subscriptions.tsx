import React from 'react';
import { ReconnectPrompt } from '../components/layout/ReconnectPrompt';
import { SignInPrompt } from '../components/layout/SignInPrompt';
import { VideoGrid } from '../components/video/VideoGrid';
import { useAuth } from '../contexts/AuthContext';
import { useLibrary } from '../contexts/LibraryContext';
import { needsReconnect, useSubscriptionFeed } from '../hooks/useMyYouTube';

export function Subscriptions() {
  const { youtubeLinked } = useAuth();
  const { videos, loading, error } = useSubscriptionFeed();
  const { subscriptions } = useLibrary();

  // Channels followed inside the clone work without the YouTube scope.
  if (!youtubeLinked && subscriptions.length === 0) {
    return (
      <SignInPrompt
        title="Don't miss new videos"
        description="Sign in to see updates from your YouTube channels, or subscribe to a channel here to start." />);


  }

  return (
    <div className="px-4 pb-16 pt-6 sm:px-6">
      <h1 className="mb-6 text-[20px] font-bold leading-7 text-yt-text">Latest</h1>
      {needsReconnect(error) && <ReconnectPrompt />}
      <VideoGrid
        videos={videos}
        loading={loading}
        emptyMessage="No recent uploads from your subscriptions." />
      
    </div>);

}