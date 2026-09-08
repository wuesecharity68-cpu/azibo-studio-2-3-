'use client'

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth'
import { getAuth, getDb } from './firebase'
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
} from 'firebase/firestore'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: 'owner' | 'user'
  credits: number
  createdAt: number
  subscriptionPlan?: 'free' | 'starter' | 'creator' | 'pro'
  maintenanceMode?: boolean
}

const ADMIN_EMAIL = 'christianaayu63@gmail.com'

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred.'
}

const getDeviceFingerprint = async (): Promise<string> => {
  try {
    const FingerprintJS = await import(
      '@fingerprintjs/fingerprintjs'
    ).then((module) => module.default)

    const fp = await FingerprintJS.load()
    const result = await fp.get()

    return result.visitorId
  } catch (error: unknown) {
    console.error(
      '[AZIBO] Failed to get device fingerprint:',
      error
    )

    return ''
  }
}

const hasDeviceClaimed = async (
  deviceId: string
): Promise<boolean> => {
  try {
    if (!deviceId) return false

    const db = getDb()

    if (!db) {
      console.warn('[AZIBO] Firestore is not available.')
      return false
    }

    const docRef = doc(db, 'deviceClaims', deviceId)
    const docSnap = await getDoc(docRef)

    return docSnap.exists()
  } catch (error: unknown) {
    console.error(
      '[AZIBO] Error checking device claims:',
      error
    )

    return false
  }
}

const recordDeviceClaim = async (
  deviceId: string,
  uid: string
): Promise<void> => {
  try {
    if (!deviceId) return

    const db = getDb()

    if (!db) {
      console.warn('[AZIBO] Firestore is not available.')
      return
    }

    await setDoc(
      doc(db, 'deviceClaims', deviceId),
      {
        uid,
        createdAt: Date.now(),
      }
    )
  } catch (error: unknown) {
    console.error(
      '[AZIBO] Error recording device claim:',
      error
    )
  }
}

const handleAdminEmailOverride = async (
  userEmail: string,
  newOwnerUid: string
): Promise<void> => {
  try {
    if (
      userEmail.toLowerCase() !==
      ADMIN_EMAIL.toLowerCase()
    ) {
      return
    }

    const db = getDb()

    if (!db) {
      console.warn('[AZIBO] Firestore is not available.')
      return
    }

    const usersRef = collection(db, 'users')

    const ownerQuery = query(
      usersRef,
      where('role', '==', 'owner')
    )

    const snapshot = await getDocs(ownerQuery)

    for (const docSnap of snapshot.docs) {
      if (docSnap.id !== newOwnerUid) {
        await updateDoc(
          doc(db, 'users', docSnap.id),
          {
            role: 'user',
          }
        )
      }
    }
  } catch (error: unknown) {
    console.error(
      '[AZIBO] Error handling admin email override:',
      error
    )
  }
}

const isFirstUser = async (): Promise<boolean> => {
  try {
    const db = getDb()

    if (!db) {
      console.warn('[AZIBO] Firestore is not available.')
      return false
    }

    const usersRef = collection(db, 'users')

    const ownerQuery = query(
      usersRef,
      where('role', '==', 'owner')
    )

    const snapshot = await getDocs(ownerQuery)

    return snapshot.empty
  } catch (error: unknown) {
    console.error(
      '[AZIBO] Error checking first user:',
      error
    )

    return false
  }
}

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
) => {
  try {
    const auth = getAuth()

    if (!auth) {
      return {
        success: false,
        error:
          'Firebase Authentication is not configured.',
      }
    }

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

    const user = userCredential.user

    const firstUser = await isFirstUser()

    const isAdmin =
      email.toLowerCase() ===
      ADMIN_EMAIL.toLowerCase()

    // ONLY the admin email can become owner.
    // Being the first user does NOT grant ownership.
    const initialRole: 'owner' | 'user' =
      isAdmin ? 'owner' : 'user'

    const initialCredits =
      isAdmin ? 999999 : 100

    let deviceFingerprint = ''
    let hasClaimedBefore = false

    if (!isAdmin && !firstUser) {
      deviceFingerprint =
        await getDeviceFingerprint()

      if (deviceFingerprint) {
        hasClaimedBefore =
          await hasDeviceClaimed(
            deviceFingerprint
          )

        if (hasClaimedBefore) {
          // Repeat device receives only 5 credits.
          // This does not affect ownership.
        }
      }
    }

    let userCredits = initialCredits

    if (
      !isAdmin &&
      !firstUser &&
      hasClaimedBefore
    ) {
      userCredits = 5
    }

    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email ?? '',
      displayName,
      role: initialRole,
      credits: userCredits,
      createdAt: Date.now(),
      subscriptionPlan: 'free',
    }

    const db = getDb()

    if (!db) {
      return {
        success: false,
        error:
          'Firebase Firestore is not configured.',
      }
    }

    await setDoc(
      doc(db, 'users', user.uid),
      userProfile
    )

    // If the admin account registers,
    // remove owner status from any previous owner.
    if (isAdmin) {
      await handleAdminEmailOverride(
        email,
        user.uid
      )
    }

    if (
      !isAdmin &&
      !firstUser &&
      deviceFingerprint &&
      !hasClaimedBefore
    ) {
      await recordDeviceClaim(
        deviceFingerprint,
        user.uid
      )
    }

    return {
      success: true,
      user,
      profile: userProfile,
    }
  } catch (error: unknown) {
    console.error(
      '[AZIBO] Sign up error:',
      error
    )

    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}

export const signInWithEmail = async (
  email: string,
  password: string
) => {
  try {
    const auth = getAuth()

    if (!auth) {
      return {
        success: false,
        error:
          'Firebase Authentication is not configured.',
      }
    }

    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

    const user = userCredential.user

    const userProfile =
      await getUserProfile(user.uid)

    return {
      success: true,
      user,
      profile: userProfile,
    }
  } catch (error: unknown) {
    console.error(
      '[AZIBO] Sign in error:',
      error
    )

    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}

export const signInWithGoogle = async () => {
  try {
    const auth = getAuth()

    if (!auth) {
      return {
        success: false,
        error:
          'Firebase Authentication is not configured.',
      }
    }

    const provider = new GoogleAuthProvider()

    const result = await signInWithPopup(
      auth,
      provider
    )

    const user = result.user

    const existingProfile =
      await getUserProfile(user.uid)

    if (existingProfile) {
      return {
        success: true,
        user,
        profile: existingProfile,
      }
    }

    const firstUser = await isFirstUser()

    const isAdmin =
      user.email?.toLowerCase() ===
      ADMIN_EMAIL.toLowerCase()

    // ONLY the admin email can become owner.
    // Being the first user does NOT grant ownership.
    const initialRole: 'owner' | 'user' =
      isAdmin ? 'owner' : 'user'

    const initialCredits =
      isAdmin ? 999999 : 100

    let deviceFingerprint = ''
    let hasClaimedBefore = false

    if (!isAdmin && !firstUser) {
      deviceFingerprint =
        await getDeviceFingerprint()

      if (deviceFingerprint) {
        hasClaimedBefore =
          await hasDeviceClaimed(
            deviceFingerprint
          )
      }
    }

    let userCredits = initialCredits

    if (
      !isAdmin &&
      !firstUser &&
      hasClaimedBefore
    ) {
      userCredits = 5
    }

    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email ?? '',
      displayName:
        user.displayName ?? 'User',
      photoURL:
        user.photoURL ?? undefined,
      role: initialRole,
      credits: userCredits,
      createdAt: Date.now(),
      subscriptionPlan: 'free',
    }

    const db = getDb()

    if (!db) {
      return {
        success: false,
        error:
          'Firebase Firestore is not configured.',
      }
    }

    await setDoc(
      doc(db, 'users', user.uid),
      userProfile
    )

    // If the admin account registers,
    // remove owner status from any previous owner.
    if (isAdmin) {
      await handleAdminEmailOverride(
        user.email ?? '',
        user.uid
      )
    }

    if (
      !isAdmin &&
      !firstUser &&
      deviceFingerprint &&
      !hasClaimedBefore
    ) {
      await recordDeviceClaim(
        deviceFingerprint,
        user.uid
      )
    }

    return {
      success: true,
      user,
      profile: userProfile,
    }
  } catch (error: unknown) {
    console.error(
      '[AZIBO] Google sign in error:',
      error
    )

    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}

export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  try {
    const db = getDb()

    if (!db) {
      console.warn(
        '[AZIBO] Firestore is not available.'
      )

      return null
    }

    const docRef = doc(
      db,
      'users',
      uid
    )

    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return docSnap.data() as UserProfile
  } catch (error: unknown) {
    console.error(
      '[AZIBO] Error getting user profile:',
      error
    )

    return null
  }
}

export const signOutUser = async () => {
  try {
    const auth = getAuth()

    if (!auth) {
      return {
        success: false,
        error:
          'Firebase Authentication is not configured.',
      }
    }

    await signOut(auth)

    return {
      success: true,
    }
  } catch (error: unknown) {
    console.error(
      '[AZIBO] Sign out error:',
      error
    )

    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}

export const getCurrentUser = (): User | null => {
  const auth = getAuth()

  return auth?.currentUser ?? null
}
