# YouTube Perfect Clone

<p align="center">
  <strong>A feature-rich educational YouTube-style web application built with React, TypeScript and Vite.</strong>
</p>

<p align="center">
  <a href="https://you-tube-ravels-projects-13eaae80.vercel.app"><img src="https://img.shields.io/badge/demo-live-success?style=for-the-badge&logo=vercel" alt="Live demo"></a>
  <a href="https://github.com/Notho-freedom/YouTube-perfect-clone"><img src="https://img.shields.io/github/stars/Notho-freedom/YouTube-perfect-clone?style=for-the-badge&logo=github" alt="GitHub stars"></a>
  <a href="https://github.com/Notho-freedom/YouTube-perfect-clone/commits/master"><img src="https://img.shields.io/github/last-commit/Notho-freedom/YouTube-perfect-clone?style=for-the-badge&logo=git" alt="Last commit"></a>
  <img src="https://img.shields.io/badge/status-educational%20project-blue?style=for-the-badge" alt="Educational project">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 18">
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 5">
  <img src="https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase Auth">
  <img src="https://img.shields.io/badge/Framer%20Motion-11-0055FF?style=flat-square&logo=framer&logoColor=white" alt="Framer Motion">
</p>

> **Educational / portfolio project.** This repository is an independent implementation inspired by the interaction patterns and visual language of modern video platforms. It is **not affiliated with, endorsed by, sponsored by, or officially connected to YouTube or Google.**

## 🚀 Live Demo

**Production:** https://you-tube-ravels-projects-13eaae80.vercel.app

**GitHub:** https://github.com/Notho-freedom/YouTube-perfect-clone

**Vercel project:** `you-tube`

The `master` branch is connected to the production Vercel project.

---

## 📖 About the project

YouTube Perfect Clone is a front-end-heavy educational project created to explore how a modern video platform can be structured as a cohesive web application rather than as a collection of isolated mockups.

The project combines a YouTube-style interface with application-level concepts such as:

- client-side routing;
- authentication;
- search and discovery;
- video/watch experiences;
- subscriptions and channels;
- playlists and personal libraries;
- watch history and liked videos;
- Shorts-style content surfaces;
- a dedicated YouTube Music-style experience;
- persistent media-player behavior;
- optional Google OAuth flows for YouTube-authorized access;
- responsive layouts and animated interactions.

The project started from a Magic Patterns-generated interface and was progressively extended into a more complete application architecture.

---

## ✨ Features

### 🎬 Video experience

- Home feed / personalized-style feed
- Search interface
- Watch page
- Video cards and content discovery
- Persistent media player
- Shorts-style browsing surface
- Channel pages
- Subscription flows

### 📚 Personal library

- Liked videos
- Watch later
- Watch history
- Playlists
- Saved content
- Library navigation

### 🎵 Music experience

A dedicated YouTube Music-style surface with:

- Music home
- Explore
- Library
- Search
- Playlists
- Artists
- Music player interactions

### 🔐 Authentication

The application supports Google authentication through Supabase Auth.

Depending on configuration, the project can also request a YouTube read-only OAuth scope for features that require access to authorized YouTube account resources.

> A normal Google sign-in and YouTube API authorization are not the same thing. The latter requires explicit OAuth authorization for the requested YouTube scope.

### 🎨 UI / UX

- Responsive application shell
- Modern dark video-platform aesthetic
- Animated transitions with Framer Motion
- Lucide iconography
- Reusable React components
- Client-side navigation with React Router
- Persistent application state where appropriate

---

## 🧱 Technology stack

| Technology | Role |
| --- | --- |
| **React 18** | UI framework |
| **TypeScript** | Type safety and application development |
| **Vite 5** | Development server and production bundler |
| **React Router 6** | Client-side routing |
| **Supabase Auth** | Authentication / OAuth integration |
| **YouTube Data API** | YouTube data integration where configured |
| **Framer Motion** | Animations and transitions |
| **Lucide React** | Icons |
| **date-fns** | Date/time utilities |
| **Tailwind CSS** | Styling utilities |
| **PostCSS / Autoprefixer** | CSS processing |
| **Vercel** | Production deployment |

---

## 🏗️ Application architecture

At a high level, the application is organized around a client-side application shell:

```text
Browser
  │
  ├── React application
  │     ├── Router
  │     ├── Shared application shell
  │     ├── Feed / discovery
  │     ├── Watch experience
  │     ├── Channels / subscriptions
  │     ├── Library / playlists / history
  │     ├── Shorts
  │     ├── Music experience
  │     └── Persistent player
  │
  ├── Supabase Auth
  │     └── Google authentication
  │
  └── YouTube APIs
        ├── Public data where configured
        └── OAuth-authorized account resources where explicitly granted
```

The exact production behavior depends on the environment variables, API credentials and OAuth configuration supplied to the application.

---

## 🔑 Google / YouTube authentication

There are two conceptually different authentication paths:

### Google sign-in

Used to authenticate a user through Google via Supabase Auth.

Typical OpenID Connect scopes include:

- `openid`
- `email`
- `profile`

### YouTube-authorized access

Features that need access to resources belonging to the authenticated YouTube account require explicit OAuth authorization with the appropriate YouTube scope.

For read-only account access, the project can request:

```text
https://www.googleapis.com/auth/youtube.readonly
```

This permission is intentionally read-only. The application should only request additional scopes when a feature genuinely requires them.

### API keys vs OAuth tokens

A public YouTube API key and an OAuth access token serve different purposes:

- **API key:** useful for public YouTube Data API requests where authentication as a specific user is not required.
- **OAuth token:** required for authorized access to resources associated with a user's YouTube account.

A public API key must never be treated as a substitute for user authorization.

---

## ⚙️ Getting started

### Requirements

- Node.js
- npm
- A modern browser
- Optional: Supabase project
- Optional: Google Cloud project with the required APIs/OAuth configuration
- Optional: YouTube Data API access

### Installation

```bash
git clone https://github.com/Notho-freedom/YouTube-perfect-clone.git
cd YouTube-perfect-clone
npm install
```

### Development

```bash
npm run dev
```

Vite will start the local development server.

### Production build

```bash
npm run build
```

### Local production preview

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

---

## 🔐 Environment configuration

Never commit real credentials, OAuth client secrets, service-role keys, or private tokens to the repository.

Depending on the features enabled in the project, environment variables may be required for:

- Supabase URL
- Supabase public/anon key
- YouTube Data API key
- OAuth configuration
- Other application-specific integration settings

Use a local `.env` / `.env.local` file for development and configure production secrets through the deployment platform.

For public repositories, enable GitHub security controls such as secret scanning, push protection, Dependabot alerts and code scanning where applicable.

---

## ☁️ Deployment

Production is deployed through Vercel.

```text
GitHub
  │
  │ push to master
  ▼
Vercel
  │
  └── Production deployment
       https://you-tube-ravels-projects-13eaae80.vercel.app
```

The production deployment was validated after fixing the dependency configuration described below.

### Initial deployment issue

The first production build failed during dependency installation because `date-fns/locale` had incorrectly been declared as a standalone npm dependency.

The fix was to remove the invalid dependency and keep `date-fns` itself, since locale modules are included within the `date-fns` package.

The corrected application then built successfully on Vercel.

---

## 🧪 Project status

| Area | Status |
| --- | --- |
| React application | ✅ Implemented |
| TypeScript | ✅ Implemented |
| Vite production build | ✅ Passing in Vercel |
| Vercel production deployment | ✅ Live |
| Google authentication | ✅ Integrated / configurable |
| Supabase Auth | ✅ Integrated |
| YouTube API integration | ✅ Integrated / configurable |
| Video / watch surfaces | ✅ Implemented |
| Library surfaces | ✅ Implemented |
| Shorts surface | ✅ Implemented |
| Music-style surface | ✅ Implemented |
| Responsive UI | ✅ Implemented |
| Educational project disclaimer | ✅ Documented |

> Feature availability in a local or production environment depends on the configured APIs, credentials and OAuth permissions.

---

## ⚠️ Educational, legal and responsible-use notice

This project is provided **for educational, research, learning, experimentation and portfolio purposes**.

It is an independent software project intended to demonstrate front-end engineering, application architecture, API integration, authentication, UI design and web development techniques.

### No affiliation

**YouTube Perfect Clone is not an official YouTube product.**

The project is not affiliated with, endorsed by, sponsored by, or otherwise officially connected to **YouTube, Google, or their respective subsidiaries and partners**.

YouTube, Google, YouTube Music and associated names, logos, trademarks and service marks belong to their respective owners.

### User responsibility

Users are solely responsible for how they use, configure, deploy, modify or redistribute this software and for complying with all laws, regulations, platform rules, API terms, copyright requirements, privacy obligations and third-party licenses applicable to their use case.

The author provides this project as an educational implementation and **does not authorize, encourage or endorse illegal use, copyright infringement, unauthorized access, credential abuse, scraping that violates applicable terms, circumvention of platform protections, privacy violations, or any other unlawful activity**.

The author does not assume responsibility for unlawful, abusive or otherwise unauthorized uses of modified or deployed copies of this project by third parties.

### API and platform terms

If you connect this project to Google or YouTube services, you are responsible for reviewing and complying with the applicable Google APIs and YouTube terms, policies, quotas, OAuth requirements and developer guidelines.

The availability of a technical capability in this repository does **not** mean that every possible use of that capability is permitted by a third-party platform.

### Copyright and media

The repository does not grant ownership of third-party videos, music, thumbnails, channel assets, trademarks or other copyrighted material accessed through external APIs or services.

Do not use this project to redistribute third-party content unless you have the necessary rights or authorization.

### No warranty

This project is provided for educational purposes and without guarantees regarding availability, correctness, security, compatibility, API quotas, third-party services or suitability for a particular production use case.

For a production deployment, conduct your own legal, security, privacy and platform-policy review.

---

## 🛡️ Security

Please do not publish credentials, API secrets, OAuth client secrets, access tokens or other sensitive information in issues or pull requests.

If you discover a security issue, use a private disclosure channel when available rather than publicly publishing exploitable credentials or sensitive details.

For production deployments, enable the security controls available in GitHub and your deployment platform, including secret scanning and dependency/security alerts where appropriate.

---

## 🤝 Contributing

Contributions, fixes, experiments and educational improvements are welcome.

A typical workflow is:

```bash
git checkout -b feature/my-change
# make your changes
npm run lint
npm run build
git commit -m "feat: describe the change"
git push origin feature/my-change
```

Then open a pull request with:

- a clear description of the change;
- screenshots or a short recording for significant UI changes;
- reproduction steps for bug fixes;
- relevant API/configuration notes;
- confirmation that no secrets have been committed.

---

## 📁 Suggested project documentation

As the project grows, larger documentation should live outside this README rather than making the README unnecessarily large.

Possible future documentation:

```text
docs/
├── ARCHITECTURE.md
├── API.md
├── AUTHENTICATION.md
├── DEPLOYMENT.md
├── GOOGLE-OAUTH.md
└── SECURITY.md
```

---

## 📌 Disclaimer in one sentence

> **This is an independent educational YouTube-style clone; use it responsibly and legally, and do not use it to infringe copyrights, bypass platform protections, access accounts without authorization, or violate applicable laws or third-party terms.**

---

## 📄 License

No open-source license is currently declared for this repository.

Unless and until a license is added, the absence of a license does not automatically grant third parties permission to reproduce, modify or redistribute the source code.

---

## 👤 Author

**Ravel / Notho-freedom**

- GitHub: https://github.com/Notho-freedom
- Repository: https://github.com/Notho-freedom/YouTube-perfect-clone

---

## ⭐ Acknowledgements

This project uses open-source software and developer tooling from the JavaScript/TypeScript ecosystem, including React, Vite, Supabase, Framer Motion, Lucide, date-fns, Tailwind CSS and related packages.

The interface was initially explored with Magic Patterns and subsequently developed into a more complete application.

---

<p align="center">
  <sub>Built for learning, experimentation and engineering practice. 🎬</sub>
</p>
