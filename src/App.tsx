import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { PersistentPlayer } from './components/player/PersistentPlayer';
import { AppProvider, type Theme } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { LibraryProvider } from './contexts/LibraryContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { ToastProvider } from './contexts/ToastContext';
import { useYouTubeLinks } from './hooks/useYouTubeLinks';
import { Channel } from './pages/Channel';
import { Explore } from './pages/Explore';
import { NotFound } from './pages/NotFound';
import { History } from './pages/History';
import { Home } from './pages/Home';
import { LikedVideos } from './pages/LikedVideos';
import { MusicShell } from './components/music/MusicShell';
import { MusicArtist } from './pages/music/MusicArtist';
import { MusicExplore } from './pages/music/MusicExplore';
import { MusicHome } from './pages/music/MusicHome';
import { MusicLibrary } from './pages/music/MusicLibrary';
import { MusicPlayer } from './pages/music/MusicPlayer';
import { MusicPlaylist } from './pages/music/MusicPlaylist';
import { MusicPremium } from './pages/music/MusicPremium';
import { MusicSearch } from './pages/music/MusicSearch';
import { Playlist } from './pages/Playlist';
import { Playlists } from './pages/Playlists';
import { Search } from './pages/Search';
import { Settings } from './pages/Settings';
import { Shorts } from './pages/Shorts';
import { Subscriptions } from './pages/Subscriptions';
import { Watch } from './pages/Watch';
import { WatchLater } from './pages/WatchLater';
import { You } from './pages/You';

interface AppProps {
  /** Surface theme, mirroring YouTube's appearance setting. */
  theme?: Theme;
}

/** Rewrites youtube.com destinations onto this clone's own routes. */
function YouTubeLinkGuard() {
  useYouTubeLinks();
  return null;
}

export function App({ theme = 'dark' }: AppProps) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LibraryProvider>
          <AppProvider initialTheme={theme}>
            <ToastProvider>
              <PlayerProvider>
                <YouTubeLinkGuard />
                <Routes>
                  <Route
                    path="/"
                    element={
                    <AppShell guideMode="full">
                        <Home />
                      </AppShell>
                    } />
                  
                  <Route
                    path="/results"
                    element={
                    <AppShell guideMode="full">
                        <Search />
                      </AppShell>
                    } />
                  
                  <Route
                    path="/watch"
                    element={
                    <AppShell guideMode="overlay">
                        <Watch />
                      </AppShell>
                    } />
                  
                  <Route
                    path="/playlist"
                    element={
                    <AppShell guideMode="full">
                        <Playlist />
                      </AppShell>
                    } />
                  
                  <Route
                    path="/explore/:slug"
                    element={
                    <AppShell guideMode="full">
                        <Explore />
                      </AppShell>
                    } />
                  
                  <Route
                    path="/channel/:channelId"
                    element={
                    <AppShell guideMode="full">
                        <Channel />
                      </AppShell>
                    } />
                  
                  <Route
                    path="/shorts"
                    element={
                    <AppShell guideMode="full">
                        <Shorts />
                      </AppShell>
                    } />
                  
                  {/* YouTube Music is its own app: own shell, own navigation,
                       shared auth, library and player. */}
                  <Route
                    path="/music"
                    element={
                    <MusicShell>
                        <MusicHome />
                      </MusicShell>
                    } />
                  
                  <Route
                    path="/music/explore"
                    element={
                    <MusicShell>
                        <MusicExplore />
                      </MusicShell>
                    } />
                  
                  <Route
                    path="/music/library"
                    element={
                    <MusicShell>
                        <MusicLibrary />
                      </MusicShell>
                    } />
                  
                  <Route
                    path="/music/search"
                    element={
                    <MusicShell>
                        <MusicSearch />
                      </MusicShell>
                    } />
                  
                  <Route
                    path="/music/playlist"
                    element={
                    <MusicShell>
                        <MusicPlaylist />
                      </MusicShell>
                    } />
                  
                  <Route
                    path="/music/artist/:channelId"
                    element={
                    <MusicShell>
                        <MusicArtist />
                      </MusicShell>
                    } />
                  
                  <Route
                    path="/music/upgrade"
                    element={
                    <MusicShell>
                        <MusicPremium />
                      </MusicShell>
                    } />
                  
                  <Route
                    path="/music/player"
                    element={
                    <MusicShell>
                        <MusicPlayer />
                      </MusicShell>
                    } />
                  
                  <Route
                    path="/settings"
                    element={
                    <AppShell guideMode="full">
                        <Settings />
                      </AppShell>
                    } />
                  
                  <Route
                    path="/feed/subscriptions"
                    element={
                    <AppShell guideMode="full">
                        <Subscriptions />
                      </AppShell>
                    } />
                  
                  <Route
                    path="/feed/you"
                    element={
                    <AppShell guideMode="full">
                        <You />
                      </AppShell>
                    } />
                  
                  <Route
                    path="/feed/playlists"
                    element={
                    <AppShell guideMode="full">
                        <Playlists />
                      </AppShell>
                    } />
                  
                  <Route
                    path="/feed/liked"
                    element={
                    <AppShell guideMode="full">
                        <LikedVideos />
                      </AppShell>
                    } />
                  
                  <Route
                    path="/feed/watch-later"
                    element={
                    <AppShell guideMode="full">
                        <WatchLater />
                      </AppShell>
                    } />
                  
                  <Route
                    path="/feed/history"
                    element={
                    <AppShell guideMode="full">
                        <History />
                      </AppShell>
                    } />
                  
                  <Route
                    path="*"
                    element={
                    <AppShell guideMode="full">
                        <NotFound />
                      </AppShell>
                    } />
                  
                </Routes>
                <PersistentPlayer />
              </PlayerProvider>
            </ToastProvider>
          </AppProvider>
        </LibraryProvider>
      </AuthProvider>
    </BrowserRouter>);

}