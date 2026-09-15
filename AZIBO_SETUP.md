# AZIBO STUDIO - Setup & Deployment Guide

AZIBO STUDIO is a production-ready SaaS platform built with Next.js 16, Firebase, and Paystack. The app builds with **ZERO errors** using Turbopack.

## Build Status
✅ Next.js 16 + Turbopack - Builds with 0 errors
✅ All routes configured and ready
✅ TypeScript strict mode enabled
✅ Production-ready architecture

## Environment Variables Required

### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Server-only admin credentials
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

### Paystack Configuration
```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### Pricing Plans (NGN Currency)
```
NEXT_PUBLIC_STARTER_MONTHLY_PRICE=47500
NEXT_PUBLIC_STARTER_YEARLY_PRICE=95000
NEXT_PUBLIC_CREATOR_MONTHLY_PRICE=158000
NEXT_PUBLIC_CREATOR_YEARLY_PRICE=475000
NEXT_PUBLIC_PRO_MONTHLY_PRICE=950000
NEXT_PUBLIC_PRO_YEARLY_PRICE=1580000

# Paystack Plan IDs
NEXT_PUBLIC_STARTER_MONTHLY_PLAN=
NEXT_PUBLIC_STARTER_YEARLY_PLAN=
NEXT_PUBLIC_CREATOR_MONTHLY_PLAN=
NEXT_PUBLIC_CREATOR_YEARLY_PLAN=
NEXT_PUBLIC_PRO_MONTHLY_PLAN=
NEXT_PUBLIC_PRO_YEARLY_PLAN=
```

## Quick Start

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Set Environment Variables**
   Add all Firebase and Paystack credentials to your `.env.local` file

3. **Run Dev Server**
   ```bash
   pnpm dev
   ```
   Visit http://localhost:3000

4. **Build for Production**
   ```bash
   pnpm build
   npm start
   ```

## Project Structure

```
/app
  /auth - Authentication pages (login, signup)
  /api - API routes (health, Paystack webhook)
  /dashboard - User dashboard & settings
  /admin - Owner-only admin panel
  /app - Public pages (pricing, support, talking-animals, human-videos)
  
/lib
  /hooks - React hooks (useAuth, useToast)
  /firebase.ts - Firebase client SDK
  /firebase-admin.server.ts - Firebase Admin SDK
  /auth-utils.ts - Authentication utilities
  
/components
  /sections - Homepage sections (Hero, Testimonials, etc)
  /ui - Reusable UI components
```

## Key Features Implemented

✅ Email/Password + Google Sign-in Authentication
✅ First user becomes owner with unlimited credits
✅ User dashboard with credits display
✅ Video generation pages (Talking Animals & Human Videos)
✅ Image-to-video support
✅ Built-in video player with download/regenerate/share
✅ Pricing page with Monthly/Yearly toggle
✅ Paystack payment integration
✅ Admin dashboard with testimonial management
✅ User management & visitor tracking
✅ Analytics dashboard
✅ Admin settings with maintenance mode
✅ User settings (profile, password)
✅ Support ticket system
✅ Watermark system (free users get watermarked videos)
✅ Dark theme with GOLD (#FFD700) and PURPLE (#800080) branding

## Firestore Collections Schema

```
users/
  ├─ uid
  ├─ email
  ├─ displayName
  ├─ role: 'owner' | 'user'
  ├─ credits
  ├─ subscriptionPlan
  └─ createdAt

credit_packages/
  ├─ plan_id
  ├─ name: 'starter' | 'creator' | 'pro'
  ├─ credits
  ├─ monthlyPrice
  └─ yearlyPrice

testimonials/
  ├─ name
  ├─ role
  ├─ photo
  ├─ quote
  ├─ rating
  └─ createdAt

ai_providers/
  ├─ name
  ├─ apiKey
  ├─ enabled
  ├─ priority
  ├─ status
  └─ credits_per_video

generated_videos/
  ├─ uid (user id)
  ├─ title
  ├─ videoUrl
  ├─ credits_used
  ├─ status: 'processing' | 'completed' | 'failed'
  └─ createdAt

support_tickets/
  ├─ uid (user id)
  ├─ name
  ├─ email
  ├─ subject
  ├─ message
  ├─ status: 'open' | 'replied' | 'closed'
  └─ createdAt

page_visits/
  ├─ ip
  ├─ userAgent
  ├─ uid (null for anonymous)
  └─ timestamp
```

## Color Scheme (Dark Theme)

- **Background:** #0f0f0f
- **Card:** #1a1a1a
- **Primary (Gold):** #ffd700
- **Secondary (Purple):** #800080
- **Text:** #fafafa
- **Muted:** #2a2a2a

## API Routes

- `GET /api/health` - Health check & env var status
- `POST /api/paystack/webhook` - Paystack payment webhook
- `POST /api/paystack/initialize` - Initialize payment
- `POST /api/track-visit` - Track page visits

## Pages & Routes

**Public Pages:**
- `/` - Homepage with hero, testimonials, savings
- `/pricing` - Pricing plans with Paystack integration
- `/support` - Contact/support form
- `/talking-animals` - Talking animals video generator
- `/human-videos` - Human videos generator

**Authentication:**
- `/auth/login` - Email/password + Google login
- `/auth/signup` - Registration with first-user-as-owner logic

**User Dashboard (Protected):**
- `/dashboard` - Main dashboard
- `/dashboard/settings` - Profile & password settings

**Admin Panel (Owner-only):**
- `/admin` - Admin dashboard overview
- `/admin/testimonials` - Manage testimonials
- `/admin/users` - View users & visitor tracking
- `/admin/analytics` - Analytics & cost tracking
- `/admin/credit-packages` - Manage credit packages
- `/admin/settings` - Site settings & maintenance mode

## Error Handling

All async operations return:
```typescript
{
  success: boolean
  error?: string
  data?: any
}
```

Toast notifications show on all errors and success actions.

## Deployment to Vercel

1. Connect GitHub repository
2. Add environment variables in Vercel Settings
3. Deploy: Push to main branch or click Deploy

The app is configured with `output: 'standalone'` for optimal Vercel deployment.

## Notes

- Firebase Admin SDK is server-only (stored in `.server.ts` file)
- Paystack integration uses dynamic import (`ssr: false`)
- All client components have `'use client'` directive
- TypeScript strict mode enabled
- No hardcoded API keys anywhere

## Support

For issues or questions, check the health endpoint at `/api/health` to verify all env vars are configured.
