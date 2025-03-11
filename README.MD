# PWA Complete Guide - Project Overview

This project is a Progressive Web App (PWA) tutorial that builds an Instagram clone, focused on teaching PWA development principles and implementation techniques.

## Project Structure

```
pwa-complete-guide/
├── public/           # Frontend assets and PWA components
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

## Development Notes

- Fake data generation is available via Faker.js
- Environment variables are stored in `.env.local` file

This project serves as a basic tutorial for building modern Progressive Web Apps with offline capabilities, push notifications, and client-side storage.
