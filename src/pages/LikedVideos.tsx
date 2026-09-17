import React, { useMemo } from 'react';
import { ReconnectPrompt } from '../components/layout/ReconnectPrompt';
import { SignInPrompt } from '../components/layout/SignInPrompt';
import { VideoGrid } from '../components/video/VideoGrid';
import { useAuth } from '../contexts/AuthContext';
import { useLibrary } from '../contexts/LibraryContext';
import { needsReconnect, useLikedVideos } from '../hooks/useMyYouTube';

export function LikedVideos() {
  const { youtubeLinked } = useAuth();
  const { videos: remote, loading, error } = useLikedVideos(24);
  const { likes } = useLibrary();

  // Native likes sit on top of whatever the read-only YouTube scope returns.
  const videos = useMemo(() => {
    const byId = new Map(likes.map((video) => [video.id, video]));
    remote.forEach((video) => {
      if (!byId.has(video.id)) byId.set(video.id, video);
    });
    return Array.from(byId.values());
  }, [likes, remote]);

  if (!youtubeLinked && likes.length === 0) {
    return (
      <SignInPrompt
        title="Keep track of what you like"
        description="Sign in to see the videos you have liked on YouTube, or like a video here to start." />);


  }

  return (
    <div className="px-4 pb-16 pt-6 sm:px-6">
      <h1 className="mb-6 text-[24px] font-bold leading-8 text-yt-text">Liked videos</h1>
      {needsReconnect(error) && <ReconnectPrompt />}
      <VideoGrid
        videos={videos}
        loading={loading && videos.length === 0}
        emptyMessage="You haven't liked any videos." />
      
    </div>);

}