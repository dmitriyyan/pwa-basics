# PWA Complete Guide - Project Overview

This project is a Progressive Web App (PWA) tutorial that builds an Instagram clone, focused on teaching PWA development principles and implementation techniques.

## Project Structure

```
pwa-complete-guide/
├── public/           # Frontend assets and PWA components
│   ├── sw.js         # Main Service Worker implementation
│   └── sw-base.js    # Alternative Service Worker implementation using Workbox (for learning purposes)
├── server/           # Backend Express.js server
│   └── index.js      # Server entry point
├── package.json      # Project configuration
└── .env.local        # Environment configuration
```

## Key Features

- **Progressive Web App (PWA)** implementation
- **Instagram-like** functionality
- **Offline capabilities** using Service Workers
- **Push notifications** via web-push
- **Client-side storage** with IndexedDB

## Technology Stack

### Frontend
- **PWA Technologies**:
  - Service Workers for offline caching and background syncing
  - IndexedDB for client-side data storage
  - Workbox for Service Worker management (alternative approach)

### Backend
- **Express.js** server
- **Web Push API** for push notifications

## Getting Started

1. **Install dependencies**:
   ```
   pnpm install
   ```

2. **Development mode**:
   ```
   pnpm run dev
   ```
   This concurrently runs:
   - Frontend server on http-server (serving the public directory)
   - Backend Node.js server with environment variables

3. **Individual services**:
   - Frontend only: `pnpm start`
   - Backend only: `pnpm run server`

4. **Build Service Worker (alternative Workbox approach)**:
   ```
   pnpm run build
   ```
   Uses Workbox to inject the precache manifest into the sw-base.js file, creating the final service worker. This is an alternative to the manually implemented sw.js.

## Development Notes

- The project uses TypeScript for Service Worker types
- Fake data generation is available via Faker.js
- Environment variables are stored in `.env.local` file
- `sw.js` is the main Service Worker file implementing caching strategies, background sync, and push notifications
- `sw-base.js` demonstrates how to achieve similar functionality using Workbox (for learning purposes only)

This project serves as a comprehensive tutorial for building modern Progressive Web Apps with offline capabilities, push notifications, and client-side storage.
