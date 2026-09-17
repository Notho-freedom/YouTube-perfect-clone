export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  channelAvatar?: string;
  views?: number;
  likes?: number;
  commentCount?: number;
  duration?: string;
  isLive?: boolean;
  /** 0 - 1 watch progress, rendered as the red bar under the thumbnail */
  progress?: number;
}

export interface Short {
  id: string;
  title: string;
  thumbnail: string;
  views?: number;
}

export interface ChannelDetails {
  id: string;
  title: string;
  handle?: string;
  avatar?: string;
  subscribers?: number;
  description?: string;
}

export interface CommentThread {
  id: string;
  author: string;
  authorAvatar?: string;
  publishedAt: string;
  text: string;
  likes: number;
  replyCount: number;
  isOwner?: boolean;
}

export interface HistoryEntry {
  video: Video;
  watchedAt: number;
}

export interface SubscriptionItem {
  channelId: string;
  title: string;
  avatar?: string;
  newItemCount?: number;
}

export interface PlaylistSummary {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  itemCount: number;
  channelTitle: string;
  privacyStatus?: string;
}

/**
 * A playlist created inside the clone. The YouTube scope only ever grants
 * read access, so every write the viewer performs lands here.
 */
export interface LocalPlaylist {
  id: string;
  title: string;
  description: string;
  videos: Video[];
  createdAt: number;
  privacyStatus: 'private' | 'public';
}

export interface ChannelProfile {
  id: string;
  title: string;
  handle?: string;
  avatar?: string;
  banner?: string;
  subscribers?: number;
  videoCount?: number;
  totalViews?: number;
  description: string;
  publishedAt?: string;
  uploadsPlaylistId?: string;
}

export interface MyChannel {
  id: string;
  title: string;
  handle?: string;
  avatar?: string;
  subscribers?: number;
  videoCount?: number;
  uploadsPlaylistId?: string;
}

export interface GuideEntry {
  label: string;
  icon: string;
  to?: string;
}

export interface GuideSection {
  title?: string;
  entries: GuideEntry[];
}