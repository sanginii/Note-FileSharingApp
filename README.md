# AI-Enhanced Note and File Sharing Platform

A secure, privacy-first communication platform for sharing encrypted notes and files that self-destruct after a set time or number of views.

## Features

1. **End-to-End Encryption (AES-256-GCM)** - All content encrypted client-side before upload
2. **Self-Destruct Mechanism** - Time-based or view-based expiry with automatic deletion
3. **Privacy-First Architecture** - Nothing leaves the device unencrypted
4. **Client-Side AI Threat-Alert Assistant** - Detects sensitive data patterns, assigns risk levels, and suggests safer actions
5. **Risk Meter UI** - Visual risk indicators with auto-masking and configurable security modes (Strict, Warnings)

## Tech Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Zustand** - State management
- **Web Crypto API** - Browser-native encryption (AES-256-GCM)

### Backend

- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **Prisma ORM** - Database toolkit
- **SQLite** - Development database (can switch to PostgreSQL)
- **Zod** - Runtime validation
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting

### Encryption & Security

- **AES-256-GCM** - Authenticated encryption algorithm
- **Web Crypto API** - Client-side encryption (browser)
- **Node.js crypto** - Server-side crypto utilities
- **Client-Side Encryption** - All data encrypted before leaving device

### AI Threat Detection

- **Pattern-Based Detection** - Regex rules for sensitive data
- **Client-Side Analysis** - Runs entirely in browser
- **Risk Scoring** - 0-100 scale with 4 risk levels (low/medium/high/critical)
- **Categories Detected**: Credit cards, SSN, passwords, API keys, tokens, bank accounts, phone numbers, IPs, emails

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL (or use SQLite for development)
- Git

### Installation

1. Clone the repository
2. Install dependencies:

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

3. Set up environment variables:

```bash
# Backend .env
cd backend
cp .env.example .env
# Edit .env with your database URL and other settings
```

4. Set up the database:

```bash
cd backend
npx prisma migrate dev
```

5. Start development servers:

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Project Structure

```
project/
├── frontend/          # React frontend application
├── backend/           # Express backend API
├── shared/            # Shared TypeScript types
└── README.md
```

## License

Open Source (MIT)
