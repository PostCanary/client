# Postcanary

Vue 3 + Vite frontend application for Postcanary.

## Tech Stack

- **Framework:** Vue 3 + Vite
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **State Management:** Pinia
- **Routing:** Vue Router

## Prerequisites

- Node.js 20+ (recommended)
- npm or yarn

## Setup

1. **Install dependencies:**

```bash
npm install
```

1. **Configure environment variables (optional):**

Create a `.env.local` file in the client directory:

```env
VITE_API_BASE=http://localhost:8001/api
VITE_AUTH_BASE=http://localhost:8001
```

> **Note:** In development, the Vite dev server proxies API requests to the backend. The `VITE_API_BASE` is only needed if you want to override the default proxy behavior or for production builds.

## Running the Project

**Development server:**

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

**Build for production:**

```bash
npm run build
```

**Preview production build:**

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Client-side data retention

- Customer records, addresses, revenue, analytics results, and other tenant-scoped data must not be stored in `localStorage`, `sessionStorage`, or IndexedDB.
- Tenant-scoped API data stays in memory and is fetched only after the authenticated user and active organization are confirmed.
- Tenant-scoped state must be cleared on logout, failed or anonymous reauthentication, authenticated identity changes, account deletion, and successful organization switches.
- Any future browser-persistent cache must contain only non-sensitive data and must be versioned, TTL-bound, scoped to the current user and organization, and identity-validated before hydration.

## Project Structure

```
client/
├── src/
│   ├── api/          # API client functions
│   ├── components/   # Vue components
│   ├── composables/  # Vue composables
│   ├── pages/        # Page components
│   ├── router.ts     # Vue Router configuration
│   ├── stores/       # Pinia stores
│   └── styles/       # Global styles
└── public/           # Static assets
```
