import { addToQueue, getJobStatus } from '@/lib/queue'
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { AZIBO_CREDIT_MAP } from '@/lib/credits-utils'
import {
  checkIPLimit,
  markIPUsed,
  getClientIP,
} from '@/lib/antiBurner'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin.server'

const ADMIN_EMAIL = 'christianaayu63@gmail.com'

type UserData = {
  credits?: number
  role?: 'owner' | 'user'
}

async function getAuthenticatedUser(
  req: NextRequest
) {
  const authorization = req.headers.get('authorization')

  if (!authorization) {
    return null
  }

  if (!authorization.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header')
  }

  const idToken = authorization.substring(7).trim()

  if (!idToken) {
    throw new Error('Missing Firebase ID token')
  }

  const adminAuth = getAdminAuth()

  return adminAuth.verifyIdToken(idToken)
}

async function deductUserCredits(
  userId: string,
  amount: number,
  description: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const db = getAdminDb()

    const userRef = db.collection('users').doc(userId)
    const transactionRef = db
      .collection('credit_transactions')
      .doc()

    await db.runTransaction(async (transaction) => {
      const userSnapshot = await transaction.get(userRef)

      if (!userSnapshot.exists) {
        throw new Error('User profile not found.')
      }

      const userData =
        userSnapshot.data() as UserData

      // Owner accounts never lose credits.
      if (userData.role === 'owner') {
        return
      }

      const currentCredits =
        typeof userData.credits === 'number'
          ? userData.credits
          : 0

      if (currentCredits < amount) {
        throw new Error('Insufficient credits.')
      }

      transaction.update(userRef, {
        credits: currentCredits - amount,
      })

      transaction.set(transactionRef, {
        id: transactionRef.id,
        user_id: userId,
        amount: -amount,
        type: 'deduction',
        description,
        created_at: new Date().toISOString(),
      })
    })

    return {
      success: true,
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to deduct credits.'

    console.error(
      '[AZIBO] Server credit deduction error:',
      error
    )

    return {
      success: false,
      error: message,
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      prompt,
      duration,
      resolution,
    } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Verify the Firebase user from the ID token
    // sent by the browser.
    let authenticatedUser = null

    try {
      authenticatedUser =
        await getAuthenticatedUser(req)
    } catch (error) {
      console.error(
        '[AZIBO] Authentication verification failed:',
        error
      )

      return NextResponse.json(
        {
          error:
            'Authentication failed. Please sign in again.',
        },
        { status: 401 }
      )
    }

    const userId =
      authenticatedUser?.uid ?? null

    const userEmail =
      authenticatedUser?.email?.toLowerCase() ?? null

    const isOwner =
      userEmail === ADMIN_EMAIL.toLowerCase()

    // Get visitor IP
    const ip = getClientIP(req)

    // Anti-burner check for guests
    const ipCheck = await checkIPLimit(ip)

    if (!ipCheck.allowed && !userId) {
      return NextResponse.json(
        { error: ipCheck.reason },
        { status: 403 }
      )
    }

    // Calculate required credits
    const key =
      `${duration}s_${resolution}` as keyof typeof AZIBO_CREDIT_MAP

    const creditsNeeded =
      AZIBO_CREDIT_MAP[key]

    if (!creditsNeeded) {
      return NextResponse.json(
        {
          error:
            'Invalid duration or resolution',
        },
        { status: 400 }
      )
    }

    // Logged-in users
    if (userId) {
      // Owner accounts have unlimited generation.
      // No subscription or credit deduction is required.
      if (!isOwner) {
        const deducted =
          await deductUserCredits(
            userId,
            creditsNeeded,
            `Video generation: ${duration}s ${resolution}`
          )

        if (!deducted.success) {
          return NextResponse.json(
            {
              error:
                deducted.error ||
                'Insufficient credits or failed to deduct credits',
            },
            { status: 402 }
          )
        }
      }
    } else {
      // Mark guest IP as used
      await markIPUsed(ip, 'guest')
    }

    // Add video generation job to queue
    const jobId = randomUUID()

    addToQueue({
      id: jobId,
      userId: userId ?? ip,
      prompt,
      type: 'video',
    })

    return NextResponse.json({
      jobId,
      status: 'pending',
      message: 'Video added to queue',
      owner: isOwner,
    })
  } catch (error) {
    console.error(
      '[AZIBO] Generation error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to generate video',
      },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest
) {
  try {
    const { searchParams } =
      new URL(req.url)

    const jobId =
      searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'No jobId provided' },
        { status: 400 }
      )
    }

    const job =
      getJobStatus(jobId)

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error(
      '[AZIBO] Job status error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to get job status',
      },
      { status: 500 }
    )
  }
    }
