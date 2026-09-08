import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  where,
  type Firestore,
} from 'firebase/firestore'
import { getDb } from './firebase'

export type CreditTransaction = {
  id: string
  user_id: string
  amount: number
  type: 'purchase' | 'deduction' | 'refund' | 'bonus'
  description: string
  created_at: string
}

type UserCreditData = {
  credits?: number
  role?: 'owner' | 'user'
}

/**
 * AZIBO credit costs.
 *
 * Keys must match the format used by the video generation API:
 * `${duration}s_${resolution}`
 */
export const AZIBO_CREDIT_MAP = {
  '5s_720p': 50,
  '5s_1080p': 75,
  '10s_720p': 100,
  '10s_1080p': 150,
  '15s_720p': 150,
  '15s_1080p': 225,
  '30s_720p': 300,
  '30s_1080p': 450,
} as const

const getFirestore = (): Firestore => {
  return getDb()
}

/**
 * Get the current credit balance for a user.
 */
export async function getUserCredits(
  userId: string
): Promise<number> {
  if (!userId) {
    return 0
  }

  try {
    const db = getFirestore()
    const userRef = doc(db, 'users', userId)
    const userSnapshot = await getDoc(userRef)

    if (!userSnapshot.exists()) {
      return 0
    }

    const userData = userSnapshot.data() as UserCreditData

    return typeof userData.credits === 'number'
      ? userData.credits
      : 0
  } catch (error: unknown) {
    console.error('[AZIBO] Error fetching credits:', error)
    return 0
  }
}

/**
 * Deduct credits from a user's balance.
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description = 'Video generation'
): Promise<{
  success: boolean
  error?: string
}> {
  if (!userId) {
    return {
      success: false,
      error: 'User ID is required.',
    }
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      success: false,
      error: 'Invalid credit amount.',
    }
  }

  try {
    const db = getFirestore()

    const userRef = doc(db, 'users', userId)

    const transactionRef = doc(
      collection(db, 'credit_transactions')
    )

    await runTransaction(db, async (transaction) => {
      const userSnapshot = await transaction.get(userRef)

      if (!userSnapshot.exists()) {
        throw new Error('User profile not found.')
      }

      const userData =
        userSnapshot.data() as UserCreditData

      // Owner accounts are exempt from credit deductions.
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

      const transactionData: CreditTransaction = {
        id: transactionRef.id,
        user_id: userId,
        amount: -amount,
        type: 'deduction',
        description,
        created_at: new Date().toISOString(),
      }

      transaction.set(transactionRef, transactionData)
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
      '[AZIBO] Error deducting credits:',
      error
    )

    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Add credits to a user's balance.
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: 'purchase' | 'bonus' | 'refund',
  description: string
): Promise<boolean> {
  if (!userId || !Number.isFinite(amount) || amount <= 0) {
    return false
  }

  try {
    const db = getFirestore()

    const userRef = doc(db, 'users', userId)

    const transactionRef = doc(
      collection(db, 'credit_transactions')
    )

    await runTransaction(db, async (transaction) => {
      const userSnapshot = await transaction.get(userRef)

      if (!userSnapshot.exists()) {
        throw new Error('User profile not found.')
      }

      const userData =
        userSnapshot.data() as UserCreditData

      const currentCredits =
        typeof userData.credits === 'number'
          ? userData.credits
          : 0

      transaction.update(userRef, {
        credits: currentCredits + amount,
      })

      const transactionData: CreditTransaction = {
        id: transactionRef.id,
        user_id: userId,
        amount,
        type,
        description,
        created_at: new Date().toISOString(),
      }

      transaction.set(transactionRef, transactionData)
    })

    return true
  } catch (error: unknown) {
    console.error(
      '[AZIBO] Error adding credits:',
      error
    )

    return false
  }
}

/**
 * Get transaction history for a user.
 */
export async function getCreditTransactions(
  userId: string,
  transactionLimit = 50
): Promise<CreditTransaction[]> {
  if (!userId) {
    return []
  }

  try {
    const db = getFirestore()

    const safeLimit = Math.min(
      Math.max(transactionLimit, 1),
      100
    )

    const transactionsRef = collection(
      db,
      'credit_transactions'
    )

    const transactionsQuery = query(
      transactionsRef,
      where('user_id', '==', userId),
      orderBy('created_at', 'desc'),
      limit(safeLimit)
    )

    const snapshot = await getDocs(
      transactionsQuery
    )

    return snapshot.docs.map((transactionDoc) => {
      const data =
        transactionDoc.data() as Omit<
          CreditTransaction,
          'id'
        >

      return {
        id: transactionDoc.id,
        ...data,
      }
    })
  } catch (error: unknown) {
    console.error(
      '[AZIBO] Error fetching credit transactions:',
      error
    )

    return []
  }
}

/**
 * Get the most recent credit transactions for a user.
 */
export async function getRecentCreditTransactions(
  userId: string,
  transactionLimit = 10
): Promise<CreditTransaction[]> {
  return getCreditTransactions(
    userId,
    transactionLimit
  )
}
