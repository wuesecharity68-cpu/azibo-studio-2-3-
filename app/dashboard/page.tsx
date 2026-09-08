'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { Video, Users, Zap, Settings, LogOut } from 'lucide-react'
import { signOutUser } from '@/lib/auth-utils'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/hooks/useToast'

function DashboardContent() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const { success } = useToast()

  const isOwner = profile?.role === 'owner'

  const handleLogout = async () => {
    const result = await signOutUser()
    if (result.success) {
      success('Logged out successfully')
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            AZIBO STUDIO
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Welcome section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {profile?.displayName}!
          </h1>
          <p className="text-lg text-muted-foreground">
            You have{' '}
            <span className="font-bold text-primary">
              {isOwner
                ? 'Unlimited'
                : profile?.credits?.toLocaleString() || 0}
            </span>{' '}
            credits available
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-lg font-semibold text-foreground capitalize">
                  {isOwner
                    ? 'Owner / Unlimited Access'
                    : profile?.subscriptionPlan || 'free'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credits</p>
                <p className="text-lg font-semibold text-foreground">
                  {isOwner
                    ? 'Unlimited'
                    : profile?.credits?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account</p>
                <p className="text-lg font-semibold text-foreground capitalize">
                  {profile?.role || 'user'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Create video section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Create Your Next Video
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Talking Animals */}
            <Link
              href="/talking-animals"
              className="group relative bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-lg p-8 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Talking Animals
                  </h3>
                  <p className="text-muted-foreground">
                    Create engaging videos with talking animals and natural lip
                    sync
                  </p>
                </div>
                <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <Video className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Get started →
              </div>
            </Link>

            {/* Human Videos */}
            <Link
              href="/human-videos"
              className="group relative bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 rounded-lg p-8 hover:border-secondary transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Human Videos
                  </h3>
                  <p className="text-muted-foreground">
                    Generate professional human actor videos in any style or
                    genre
                  </p>
                </div>
                <div className="h-12 w-12 bg-secondary/20 rounded-lg flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Get started →
              </div>
            </Link>
          </div>
        </div>

        {/* Settings and other links */}
        <div className="flex gap-4">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            <Settings className="h-4 w-4" />
            Account Settings
          </Link>

          {!isOwner && (
            <Link
              href="/pricing"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Zap className="h-4 w-4" />
              Upgrade Plan
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
