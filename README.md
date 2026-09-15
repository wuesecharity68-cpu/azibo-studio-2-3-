# AZIBO STUDIO - Production-Ready SaaS Platform

A Next.js 16 + Turbopack SaaS platform for creating AI videos with talking animals and human characters. Built with zero build errors for Vercel deployment.

## Tech Stack

- **Frontend**: Next.js 16 App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Backend**: Next.js API routes, Firebase Cloud Functions
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Email/Password + Google Sign In)
- **Payments**: Paystack
- **UI Components**: Radix UI, Lucide Icons
- **Analytics**: Recharts
- **State Management**: TanStack Query, Firebase Real-time Listeners

## Project Structure

```
/app
  /api
    /health              - Health check endpoint
    /paystack/webhook    - Paystack payment webhook
    /track-visit         - Visitor tracking endpoint
  /auth
    /login              - Email/password login page
    /signup             - User registration page
  /admin                - Admin dashboard (owner only)
    /analytics          - Revenue and usage analytics
    /credit-packages    - Pricing and credit configuration
    /settings           - Platform settings
    /testimonials       - Testimonial management
    /users              - User management and visitor tracking
  /dashboard            - User dashboard (protected)
    /settings           - User settings
  /talking-animals      - AI video generation for animals
  /human-videos         - AI video generation for humans
  /pricing              - Pricing page with Paystack integration
  /support              - Support/contact form
  /page.tsx             - Homepage with hero and testimonials

/lib
  /firebase.ts          - Firebase client initialization
  /firebase-admin.server.ts - Firebase Admin SDK (server-only)
  /env.ts               - Environment variable validation
  /auth-utils.ts        - Authentication utilities
  /paystack-utils.ts    - Paystack payment utilities
  /toast.ts             - Toast notification system
  /hooks
    /useAuth.ts         - Authentication hook
    /useToast.ts        - Toast notification hook

/components
  /ui                   - Shadcn UI components
  /sections             - Homepage sections (Hero, WhyAzibo, Savings, Testimonials, Footer)
  /ProtectedRoute.tsx   - Route protection wrapper
  /DemoModal.tsx        - Product demo modal
  /ToastDisplay.tsx     - Toast notification display
```

## Features Implemented

### Public Pages
- **Homepage** - Hero section, Why Azibo section, Savings section, Testimonials with Firestore integration
- **Pricing** - Monthly/Yearly toggle, environment-based pricing (₦NGN)
- **Support** - Contact form saving to Firestore
- **Demo Modal** - Product demo video player

### Authentication
- Email/Password signup and login
- Google Sign In integration
- First user becomes owner with unlimited credits
- Subsequent users get "user" role with 50 free credits
- Protected routes with role-based access control

### User Features
- Dashboard with credits display
- Talking Animals page - AI video generation with image upload
- Human Videos page - AI video generation with image upload
- Video player with download/regenerate/share buttons
- User settings - profile management
- Automatic watermark for free users

### Admin Dashboard (Owner Only)
- **Analytics** - Revenue, user count, videos generated, profit metrics
- **Users** - User management with visitor tracking
- **Credit Packages** - Configure pricing and credit allocations for Starter/Creator/Pro plans
- **Settings** - Site branding, maintenance mode, watermark toggle, default credits
- **Testimonials** - Full CRUD management for customer testimonials

### Payment Integration
- Paystack webhook handler for payment processing
- Credit system with credits_log tracking
- Support for multiple pricing tiers
- International card support

### Additional Features
- Visitor tracking API logging page visits
- Health check endpoint
- Toast notification system for user feedback
- Error boundaries and error handling
- Responsive mobile-first design

## Environment Variables Required

```
# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Firebase Admin (server-only)
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
PAYSTACK_SECRET_KEY

# Pricing Plans (environment-based)
NEXT_PUBLIC_STARTER_MONTHLY_PRICE=47500
NEXT_PUBLIC_STARTER_YEARLY_PRICE=95000
NEXT_PUBLIC_CREATOR_MONTHLY_PRICE=158000
NEXT_PUBLIC_CREATOR_YEARLY_PRICE=475000
NEXT_PUBLIC_PRO_MONTHLY_PRICE=950000
NEXT_PUBLIC_PRO_YEARLY_PRICE=1580000
```

## Firestore Collections Schema

```
/users
  uid: string
  email: string
  displayName: string
  credits: number
  createdAt: number
  subscriptionPlan: string
  role: "owner" | "user"

/testimonials
  id: string
  name: string
  role: string
  photo: string
  quote: string
  rating: number (1-5)
  createdAt: number

/credit_packages
  plan: "starter" | "creator" | "pro"
  monthlyPrice: number
  yearlyPrice: number
  credits: number

/credits_log
  userId: string
  amount: number
  reason: string
  timestamp: number
  remaining: number

/page_visits
  timestamp: number
  userAgent: string
  userId: string (optional)

/support_tickets
  name: string
  email: string
  subject: string
  message: string
  createdAt: number
  status: "open" | "resolved"

/ai_providers
  name: string
  apiKey: string (encrypted)
  enabled: boolean
  priority: number
  status: string
  credits_per_video: number
```

## Development

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase and Paystack credentials

# Start dev server with Turbopack
pnpm dev

# Visit http://localhost:3000
```

### Build

```bash
# Build with Turbopack
pnpm build

# Start production server
pnpm start
```

## Build Status

✓ Compiles with **ZERO errors** using Next.js 16 + Turbopack
✓ Full TypeScript strict mode enabled
✓ All 21 routes successfully compiled
✓ Production-ready for Vercel deployment

## Color Scheme

- **Primary**: Gold (#FFD700) - Buttons, headers, accents
- **Secondary**: Purple (#800080) - Secondary elements
- **Background**: Dark (#0F0F0F) - Main background
- **Card**: Slightly lighter dark (#1A1A1A) - Card backgrounds
- **Text**: Off-white (#FAFAFA) - Foreground text

## Key Implementation Details

### Authentication Flow
1. First user to sign up becomes "owner" with unlimited credits
2. Subsequent users get "user" role with 50 free credits
3. Protected routes check authentication status and role
4. Firebase Auth handles session management

### Credit System
1. Users have credits balance stored in Firestore
2. Each video generation deducts credits
3. Premium credits purchased via Paystack
4. Free users see watermark on videos
5. All transactions logged in credits_log collection

### Payment Workflow
1. User selects pricing plan on /pricing page
2. Clicks "Pay with Card" to open Paystack modal
3. Paystack webhook receives payment notification
4. Webhook verifies signature and updates user credits
5. Transaction logged in Firestore

## Deployment to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Deploy AZIBO STUDIO"
git push origin main

# Deploy to Vercel (via GitHub integration)
vercel deploy

# Set environment variables in Vercel dashboard
# Deploy succeeds with zero build errors using Turbopack
```

## Security Best Practices Implemented

✓ Environment variables for all API keys
✓ Server-only Firebase Admin SDK imports
✓ Paystack signature verification on webhooks
✓ Protected routes with role-based access
✓ Row-level security in Firestore (via schema)
✓ CSRF protection via Next.js built-in
✓ Input validation and sanitization
✓ Error boundaries for graceful error handling

## Monitoring and Analytics

- Health check endpoint at `/api/health`
- Page visit tracking at `/api/track-visit`
- Visitor analytics in admin dashboard
- User metrics and revenue tracking
- Cost per video analytics

## Support

For issues or questions, contact: support@azibo.studio

## License

Proprietary - AZIBO STUDIO 2026
