# YouTube Perfect Clone

A React + Vite YouTube-style web application built from a Magic Patterns interface and extended with a local application architecture for navigation, playback, authentication, library state, search, subscriptions, playlists, history, liked videos, Shorts, and a dedicated YouTube Music-style surface.

## Production

**Vercel production:** https://you-tube-ravels-projects-13eaae80.vercel.app

**Vercel project:** `you-tube`

**GitHub:** https://github.com/Notho-freedom/YouTube-perfect-clone

## Stack

- React 18 + TypeScript
- Vite 5
- React Router 6
- Supabase Auth
- YouTube Data API integration
- Framer Motion
- Lucide React
- date-fns
- Tailwind CSS / PostCSS

## Main surfaces

- Home and personalized-style feed
- Search and watch views
- Channels and subscriptions
- Playlists, liked videos, watch later and history
- Shorts
- YouTube Music-style home, explore, library, search, playlists, artists and player
- Settings and account flows
- Persistent media player
- Google authentication with optional YouTube-scoped OAuth

## Authentication modes

The application supports a basic Google sign-in and a YouTube-linked Google OAuth flow. The YouTube-linked flow requests the read-only YouTube scope so the application can access authorized YouTube account resources through the official API.

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Deployment

The `master` branch is connected to the Vercel `you-tube` production project. Changes pushed to `master` are deployed through the Git integration.

## Deployment fix

The initial production deployment failed during dependency installation because `date-fns/locale` was incorrectly declared as a standalone npm package. Locale modules are provided by `date-fns` itself, so the invalid dependency was removed from `package.json`.
