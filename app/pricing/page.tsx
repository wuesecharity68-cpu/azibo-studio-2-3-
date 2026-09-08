'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ArrowRight, Crown } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

type PlanId = 'starter' | 'creator' | 'professional'
type BillingPeriod = 'monthly' | 'yearly'

type Plan = {
  id: PlanId
  name: string
  monthlyPrice: number
  yearlyPrice: number
  monthlyRegularPrice: number
  yearlyRegularPrice: number
  credits: number
  yearlyCredits: number
  videos720p: number
  videos1080p: number
  popular: boolean
  cta: string
  features: string[]
}

export default function PricingPage() {
  const { profile, loading: authLoading } = useAuth()

  const [period, setPeriod] =
    useState<BillingPeriod>('monthly')

  const [loadingPlan, setLoadingPlan] =
    useState<string | null>(null)

  const isOwner = profile?.role === 'owner'

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: 72000,
      yearlyPrice: 216000,
      monthlyRegularPrice: 89000,
      yearlyRegularPrice: 267000,
      credits: 1500,
      yearlyCredits: 18000,
      videos720p: 30,
      videos1080p: 0,
      popular: false,
      cta: 'Claim Launch Price',
      features: [
        '1,500 Credits/month',
        '30x 5s videos in 720p',
        '5s 720p = 50 Credits',
        'All Video Types - Human, Anime, Animal',
        'Basic styles',
        'Email support',
        'Watermark removed',
        '720p Export',
      ],
    },
    {
      id: 'creator',
      name: 'Creator',
      monthlyPrice: 198000,
      yearlyPrice: 594000,
      monthlyRegularPrice: 249000,
      yearlyRegularPrice: 747000,
      credits: 3500,
      yearlyCredits: 42000,
      videos720p: 70,
      videos1080p: 0,
      popular: true,
      cta: 'Start Your Launch',
      features: [
        '3,500 Credits/month',
        '70x 5s videos in 720p',
        '5s 720p = 50 Credits',
        'All Video Types - Human, Anime, Animal',
        'All styles: cartoon, anime, 3D, realistic',
        'Priority support',
        'Remove watermark',
        'Custom branding',
        '720p Export',
      ],
    },
    {
      id: 'professional',
      name: 'Pro',
      monthlyPrice: 398000,
      yearlyPrice: 1194000,
      monthlyRegularPrice: 499000,
      yearlyRegularPrice: 1497000,
      credits: 7000,
      yearlyCredits: 84000,
      videos720p: 140,
      videos1080p: 70,
      popular: false,
      cta: 'Claim Launch Price',
      features: [
        '7,000 Credits/month',
        '70x 5s videos in 1080p OR 140x in 720p',
        '5s 1080p = 100 Credits',
        '5s 720p = 50 Credits',
        'All Video Types - Human, Anime, Animal',
        'All styles',
        '24/7 premium support',
        'No watermark',
        'API access',
        'Batch processing',
        'Priority queue',
        '1080p Export',
      ],
    },
  ]

  const handlePayment = async (
    planId: PlanId
  ) => {
    // Owner accounts never need to subscribe.
    if (isOwner) {
      alert(
        'Your owner account already has unlimited access to AZIBO STUDIO. No subscription is required.'
      )
      return
    }

    try {
      setLoadingPlan(planId)

      const userResponse =
        await fetch('/api/auth/me')

      if (!userResponse.ok) {
        throw new Error(
          'Please sign in before making a payment.'
        )
      }

      const userData =
        await userResponse.json()

      const email =
        userData?.user?.email ??
        userData?.email ??
        ''

      const userId =
        userData?.user?.uid ??
        userData?.user?.id ??
        userData?.uid ??
        userData?.id ??
        ''

      if (!email || !userId) {
        throw new Error(
          'Unable to identify your account. Please sign in again.'
        )
      }

      const response = await fetch(
        '/api/paystack/initialize',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            userId,
            planId,
            billingPeriod: period,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Payment initialization failed.'
        )
      }

      if (
        !data?.authorizationUrl ||
        typeof data.authorizationUrl !== 'string'
      ) {
        throw new Error(
          'Paystack did not return a payment link.'
        )
      }

      window.location.href =
        data.authorizationUrl
    } catch (error: unknown) {
      console.error(
        '[AZIBO] Payment error:',
        error
      )

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to start payment. Please try again.'
      )
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold text-primary"
          >
            AZIBO STUDIO
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-foreground hover:text-primary transition-colors"
            >
              Dashboard
            </Link>

            <Link
              href="/support"
              className="text-foreground hover:text-primary transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">

        {isOwner && !authLoading && (
          <div className="mb-12 rounded-2xl border border-primary bg-primary/10 p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
                <Crown className="h-7 w-7 text-primary" />
              </div>

              <h2 className="text-3xl font-bold text-foreground mb-3">
                Owner Account
              </h2>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
                You have unlimited access to AZIBO STUDIO.
                No subscription is required and your credits
                are never deducted.
              </p>

              <div className="inline-flex items-center rounded-full bg-primary/20 px-5 py-2 text-sm font-semibold text-primary">
                ✨ Unlimited Access
              </div>
            </div>
          </div>
        )}

        {!isOwner && (
          <>
            <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary rounded-lg p-8 mb-12">
              <div className="text-center">
                <div className="inline-block mb-4 px-4 py-2 bg-primary/20 rounded-full">
                  <span className="text-primary font-semibold text-sm">
                    🚀 LAUNCH OFFER
                  </span>
                </div>

                <h2 className="text-3xl font-bold text-foreground mb-3">
                  Save Up to 20% – Lock in Our Exclusive Launch Prices
                </h2>

                <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
                  Join AZIBO STUDIO today and secure our
                  limited-time launch pricing forever.
                  Once this promotion ends, all plans will
                  return to regular prices.
                </p>

                <div className="flex items-center justify-center gap-8 text-sm">
                  <div>
                    <span className="text-primary font-semibold">
                      ⏳ Limited-Time Offer
                    </span>
                  </div>

                  <div>
                    <span className="text-primary font-semibold">
                      ⚡ Early Adopter Discount
                    </span>
                  </div>

                  <div>
                    <span className="text-primary font-semibold">
                      🎉 Price Locked Forever
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-foreground mb-4">
                Simple, Transparent Pricing
              </h1>

              <p className="text-xl text-muted-foreground mb-8">
                Choose the perfect plan for your video creation needs
              </p>

              <div className="flex items-center justify-center gap-4 mb-12">
                <button
                  onClick={() =>
                    setPeriod('monthly')
                  }
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    period === 'monthly'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground hover:bg-muted'
                  }`}
                >
                  Monthly
                </button>

                <button
                  onClick={() =>
                    setPeriod('yearly')
                  }
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    period === 'yearly'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground hover:bg-muted'
                  }`}
                >
                  Yearly

                  {period === 'yearly' && (
                    <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      Launch Deal
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {plans.map((plan) => {
                const price =
                  period === 'monthly'
                    ? plan.monthlyPrice
                    : plan.yearlyPrice

                const regularPrice =
                  period === 'monthly'
                    ? plan.monthlyRegularPrice
                    : plan.yearlyRegularPrice

                const monthlyEquivalent =
                  period === 'yearly'
                    ? (plan.yearlyPrice / 12).toFixed(0)
                    : null

                const savingsPercent = Math.round(
                  ((regularPrice - price) /
                    regularPrice) *
                    100
                )

                const isLoading =
                  loadingPlan === plan.id

                return (
                  <div
                    key={plan.name}
                    className={`relative rounded-lg border transition-all ${
                      plan.popular
                        ? 'border-primary bg-primary/5 lg:scale-105 shadow-lg'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </div>
                      </div>
                    )}

                    <div className="absolute top-6 right-6 bg-secondary/20 text-secondary px-3 py-1 rounded-full text-xs font-semibold">
                      Save {savingsPercent}%
                    </div>

                    <div className="p-8">
                      <h3 className="text-2xl font-bold text-foreground mb-4">
                        {plan.name}
                      </h3>

                      <div className="mb-6">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-sm text-muted-foreground line-through">
                            ₦
                            {(
                              regularPrice / 1000
                            ).toLocaleString()}
                            k
                          </span>

                          <span className="text-xs text-muted-foreground">
                            regular price
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-4xl font-bold text-primary">
                            ₦
                            {(
                              price / 1000
                            ).toLocaleString()}
                            k
                          </span>

                          <span className="text-muted-foreground">
                            /
                            {period === 'monthly'
                              ? 'month'
                              : 'year'}
                          </span>
                        </div>

                        {monthlyEquivalent && (
                          <p className="text-sm text-muted-foreground">
                            ≈ ₦
                            {(
                              parseInt(
                                monthlyEquivalent,
                                10
                              ) / 1000
                            ).toLocaleString()}
                            k/month
                          </p>
                        )}
                      </div>

                      <div className="mb-6 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                        <p className="text-sm font-bold text-primary">
                          {period === 'yearly'
                            ? plan.yearlyCredits.toLocaleString()
                            : plan.credits.toLocaleString()}{' '}
                          Azibo Credits
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {plan.videos1080p > 0
                            ? `${plan.videos1080p}x 5s videos in 1080p OR ${plan.videos720p}x in 720p`
                            : `${plan.videos720p}x 5s videos in 720p`}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          handlePayment(plan.id)
                        }
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 h-12 px-6 rounded-lg font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed mb-6"
                      >
                        {isLoading
                          ? 'Opening Paystack...'
                          : plan.cta}

                        {!isLoading && (
                          <ArrowRight className="w-4 h-4" />
                        )}
                      </button>

                      <ul className="space-y-3">
                        {plan.features.map(
                          (feature, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2"
                            >
                              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />

                              <span className="text-sm text-foreground">
                                {feature}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-center text-xs text-muted-foreground mb-12">
              *Founding Member pricing locked for life.
              Regular pricing applies to new signups
              after Dec 31, 2026
            </p>
          </>
        )}

        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'Can I change my plan anytime?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes, you can cancel your subscription at any time with no penalties.',
              },
              {
                q: 'Do you offer refunds?',
                a: "We offer a 7-day money-back guarantee if you're not satisfied.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-lg p-6"
              >
                <h3 className="font-semibold text-foreground mb-2">
                  {faq.q}
                </h3>

                <p className="text-muted-foreground">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
