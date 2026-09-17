import type { GuideEntry, GuideSection } from '../types/youtube';

export const primarySignedOut: GuideSection = {
  entries: [
  { label: 'Home', icon: 'home', to: '/' },
  { label: 'Shorts', icon: 'shorts', to: '/shorts' },
  { label: 'Subscriptions', icon: 'subscriptions', to: '/feed/subscriptions' },
  { label: 'You', icon: 'you', to: '/feed/you' },
  { label: 'History', icon: 'history', to: '/feed/history' }]

};

/**
 * The collapsed rail. It stops at "You": History is a third-section entry in
 * the expanded guide and never appears on the rail.
 */
export const miniGuideEntries: GuideEntry[] = [
{ label: 'Home', icon: 'home', to: '/' },
{ label: 'Shorts', icon: 'shorts', to: '/shorts' },
{ label: 'Subscriptions', icon: 'subscriptions', to: '/feed/subscriptions' },
{ label: 'You', icon: 'you', to: '/feed/you' }];


export const primarySignedIn: GuideSection = {
  entries: [
  { label: 'Home', icon: 'home', to: '/' },
  { label: 'Shorts', icon: 'shorts', to: '/shorts' }]

};

export const youSection: GuideSection = {
  title: 'You',
  entries: [
  { label: 'Your channel', icon: 'yourChannel', to: '/feed/you' },
  { label: 'History', icon: 'history', to: '/feed/history' },
  { label: 'Playlists', icon: 'playlists', to: '/feed/playlists' },
  { label: 'Watch later', icon: 'watchLater', to: '/feed/watch-later' },
  { label: 'Liked videos', icon: 'liked', to: '/feed/liked' },
  { label: 'Your videos', icon: 'yourVideos', to: '/feed/you' }]

};

/**
 * Collapsed, Explore shows only Music / Live / Gaming — Trending and the rest
 * live behind "Show more", which is the order YouTube ships today.
 */
export const exploreSection: GuideSection = {
  title: 'Explore',
  entries: [
  { label: 'Music', icon: 'music', to: '/explore/music' },
  { label: 'Live', icon: 'live', to: '/explore/live' },
  { label: 'Gaming', icon: 'gaming', to: '/explore/gaming' }]

};

export const exploreExpandedEntries: GuideEntry[] = [
{ label: 'Trending', icon: 'trending', to: '/explore/trending' },
{ label: 'News', icon: 'news', to: '/explore/news' },
{ label: 'Sport', icon: 'sports', to: '/explore/sport' },
{ label: 'Courses', icon: 'courses', to: '/explore/courses' },
{ label: 'Fashion & beauty', icon: 'fashion', to: '/explore/fashion-beauty' },
{ label: 'Podcasts', icon: 'podcasts', to: '/explore/podcasts' }];


export const moreFromYouTube: GuideSection = {
  title: 'More from YouTube',
  entries: [
  { label: 'YouTube Music', icon: 'ytmusic', to: '/music' },
  { label: 'YouTube Kids', icon: 'kids' }]

};

export const settingsSection: GuideSection = {
  entries: [
  { label: 'Settings', icon: 'settings', to: '/settings' },
  { label: 'Report history', icon: 'report' },
  { label: 'Help', icon: 'help' },
  { label: 'Send feedback', icon: 'feedback' }]

};

export const reportSection: GuideSection = {
  entries: [{ label: 'Report history', icon: 'report' }]
};

export interface FooterLink {
  label: string;
  href: string;
}

export const footerPrimaryLinks: FooterLink[] = [
{ label: 'About', href: 'https://about.youtube' },
{ label: 'Press', href: 'https://blog.youtube/press/' },
{ label: 'Copyright', href: 'https://www.youtube.com/howyoutubeworks/policies/copyright/' },
{ label: 'Contact us', href: 'https://www.youtube.com/t/contact_us' },
{ label: 'Creators', href: 'https://www.youtube.com/creators/' },
{ label: 'Advertise', href: 'https://www.youtube.com/ads/' },
{ label: 'Developers', href: 'https://developers.google.com/youtube' }];


export const footerSecondaryLinks: FooterLink[] = [
{ label: 'Terms', href: 'https://www.youtube.com/t/terms' },
{ label: 'Privacy', href: 'https://policies.google.com/privacy' },
{ label: 'Policy & Safety', href: 'https://www.youtube.com/howyoutubeworks/policies/' },
{ label: 'How YouTube works', href: 'https://www.youtube.com/howyoutubeworks/' },
{ label: 'Test new features', href: 'https://www.youtube.com/new' }];