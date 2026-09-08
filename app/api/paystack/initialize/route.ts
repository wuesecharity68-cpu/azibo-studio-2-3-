import { NextRequest, NextResponse } from 'next/server'

type PlanId = 'starter' | 'creator' | 'professional'
type BillingPeriod = 'monthly' | 'yearly'

type Plan = {
  monthlyPrice: number
  yearlyPrice: number
  monthlyCredits: number
  yearlyCredits: number
}

const PLANS: Record<PlanId, Plan> = {
  starter: {
    monthlyPrice: 72000,
    yearlyPrice: 216000,
    monthlyCredits: 1500,
    yearlyCredits: 18000,
  },
  creator: {
    monthlyPrice: 198000,
    yearlyPrice: 594000,
    monthlyCredits: 3500,
    yearlyCredits: 42000,
  },
  professional: {
    monthlyPrice: 398000,
    yearlyPrice: 1194000,
    monthlyCredits: 7000,
    yearlyCredits: 84000,
  },
}

type InitializeRequest = {
  email?: unknown
  planId?: unknown
  billingPeriod?: unknown
  userId?: unknown
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InitializeRequest

    const email =
      typeof body.email === 'string'
        ? body.email.trim()
        : ''

    const planId =
      typeof body.planId === 'string'
        ? body.planId
        : ''

    const billingPeriod =
      typeof body.billingPeriod === 'string'
        ? body.billingPeriod
        : ''

    const userId =
      typeof body.userId === 'string'
        ? body.userId.trim()
        : ''

    if (!email || !planId || !billingPeriod || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (
      planId !== 'starter' &&
      planId !== 'creator' &&
      planId !== 'professional'
    ) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    if (
      billingPeriod !== 'monthly' &&
      billingPeriod !== 'yearly'
    ) {
      return NextResponse.json(
        { error: 'Invalid billing period' },
        { status: 400 }
      )
    }

    const plan = PLANS[planId]

    const amount =
      billingPeriod === 'monthly'
        ? plan.monthlyPrice
        : plan.yearlyPrice

    const credits =
      billingPeriod === 'monthly'
        ? plan.monthlyCredits
        : plan.yearlyCredits

    const paystackPlan =
      planId === 'starter'
        ? billingPeriod === 'monthly'
          ? process.env.NEXT_PUBLIC_STARTER_MONTHLY_PLAN
          : process.env.NEXT_PUBLIC_STARTER_YEARLY_PLAN
        : planId === 'creator'
          ? billingPeriod === 'monthly'
            ? process.env.NEXT_PUBLIC_CREATOR_MONTHLY_PLAN
            : process.env.NEXT_PUBLIC_CREATOR_YEARLY_PLAN
          : billingPeriod === 'monthly'
            ? process.env.NEXT_PUBLIC_PRO_MONTHLY_PLAN
            : process.env.NEXT_PUBLIC_PRO_YEARLY_PLAN

    if (!paystackPlan) {
      console.error(
        '[AZIBO] Paystack plan code is not configured',
        {
          planId,
          billingPeriod,
        }
      )

      return NextResponse.json(
        {
          error:
            'Selected Paystack plan is not configured',
        },
        { status: 500 }
      )
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!secretKey) {
      console.error(
        '[AZIBO] PAYSTACK_SECRET_KEY is not configured'
      )

      return NextResponse.json(
        { error: 'Payment service is not configured' },
        { status: 500 }
      )
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      'http://localhost:3000'

    const paystackResponse = await fetch(
      'https://api.paystack.co/transaction/initialize',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amount * 100,
          plan: paystackPlan,
          metadata: {
            user_id: userId,
            plan_id: planId,
            plan_name: planId,
            billingPeriod,
            credits,
            amount,
          },
          callback_url: `${baseUrl}/pricing?reference={reference}`,
        }),
      }
    )

    const data: unknown =
      await paystackResponse.json()

    if (
      typeof data !== 'object' ||
      data === null ||
      !('status' in data) ||
      data.status !== true
    ) {
      const message =
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof data.message === 'string'
          ? data.message
          : 'Payment initialization failed'

      console.error(
        '[AZIBO] Paystack error:',
        message
      )

      return NextResponse.json(
        { error: message },
        { status: 400 }
      )
    }

    if (
      !('data' in data) ||
      typeof data.data !== 'object' ||
      data.data === null
    ) {
      return NextResponse.json(
        { error: 'Invalid Paystack response' },
        { status: 502 }
      )
    }

    const paystackData = data.data as {
      authorization_url?: unknown
      access_code?: unknown
      reference?: unknown
    }

    if (
      typeof paystackData.authorization_url !== 'string' ||
      typeof paystackData.access_code !== 'string' ||
      typeof paystackData.reference !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Invalid Paystack response' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      authorizationUrl:
        paystackData.authorization_url,
      accessCode: paystackData.access_code,
      reference: paystackData.reference,
      planId,
      billingPeriod,
      amount,
      credits,
    })
  } catch (error: unknown) {
    console.error(
      '[AZIBO] Payment initialization error:',
      error
    )

    return NextResponse.json(
      { error: 'Payment initialization failed' },
      { status: 500 }
    )
  }
}
